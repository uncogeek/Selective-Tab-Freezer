importScripts("core.js");

const SITES_KEY = "freezeSites";
const LEGACY_KEY = "freezePatterns";

async function getSites() {
  const stored = await chrome.storage.local.get({
    [SITES_KEY]: null,
    [LEGACY_KEY]: ""
  });
  const sites = TabFreezerCore.sitesFromStorage(stored);

  if (!Array.isArray(stored[SITES_KEY]) && sites.length > 0) {
    await chrome.storage.local.set({ [SITES_KEY]: sites });
    await chrome.storage.local.remove(LEGACY_KEY);
  }

  return sites;
}

async function setResultBadge(result) {
  let text = String(result.frozen);
  let color = "#2563eb";
  let title = `${result.frozen} tab(s) frozen`;

  if (result.failed > 0) {
    text = "!";
    color = "#b91c1c";
    title = `${result.frozen} frozen, ${result.failed} failed`;
  } else if (result.skippedActive > 0) {
    text = result.frozen ? `${result.frozen}!` : "!";
    color = "#b45309";
    title = `${result.frozen} frozen; ${result.skippedActive} active tab(s) skipped`;
  } else if (result.matched === 0) {
    text = "0";
    color = "#64748b";
    title = "No matching tabs found";
  }

  await chrome.action.setBadgeBackgroundColor({ color });
  await chrome.action.setBadgeText({ text });
  await chrome.action.setTitle({ title });
}

async function showSetupRequired() {
  await chrome.action.setBadgeBackgroundColor({ color: "#b45309" });
  await chrome.action.setBadgeText({ text: "SET" });
  await chrome.action.setTitle({ title: "Add URL patterns in Settings first" });
}

async function freezeMatchingTabs() {
  const sites = await getSites();

  if (sites.length === 0) {
    await showSetupRequired();
    await chrome.runtime.openOptionsPage();
    return {
      sites: 0,
      matched: 0,
      frozen: 0,
      alreadyDiscarded: 0,
      skippedActive: 0,
      failed: 0,
      setupRequired: true
    };
  }

  const tabs = await chrome.tabs.query({});
  const matchingTabs = tabs.filter((tab) =>
    TabFreezerCore.matchesUrl(tab.pendingUrl || tab.url || "", sites)
  );

  const result = {
    sites: sites.length,
    matched: matchingTabs.length,
    frozen: 0,
    alreadyDiscarded: 0,
    skippedActive: 0,
    failed: 0,
    setupRequired: false
  };

  const discardJobs = [];

  for (const tab of matchingTabs) {
    if (tab.discarded) {
      result.alreadyDiscarded += 1;
      continue;
    }

    // Chrome deliberately refuses to discard an active tab.
    if (tab.active) {
      result.skippedActive += 1;
      continue;
    }

    if (typeof tab.id !== "number") {
      result.failed += 1;
      continue;
    }

    discardJobs.push(
      chrome.tabs.discard(tab.id)
        .then((discardedTab) => {
          if (discardedTab && discardedTab.discarded) {
            result.frozen += 1;
          } else {
            result.failed += 1;
          }
        })
        .catch(() => {
          result.failed += 1;
        })
    );
  }

  await Promise.all(discardJobs);
  await setResultBadge(result);
  return result;
}

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    chrome.runtime.openOptionsPage();
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "FREEZE_MATCHING_TABS") {
    return false;
  }

  freezeMatchingTabs()
    .then((result) => sendResponse({ ok: true, result }))
    .catch((error) => sendResponse({ ok: false, error: String(error?.message || error) }));

  return true;
});
