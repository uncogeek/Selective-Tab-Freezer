"use strict";

const SITES_KEY = "freezeSites";
const LEGACY_KEY = "freezePatterns";
const LANGUAGE_KEY = "uiLanguage";

const currentUrl = document.getElementById("current-url");
const commentInput = document.getElementById("comment");
const addButton = document.getElementById("add-current");
const freezeButton = document.getElementById("freeze");
const settingsButton = document.getElementById("settings");
const statusOutput = document.getElementById("status");

let activeTab = null;

function setStatus(message, isError = false) {
  statusOutput.textContent = message;
  statusOutput.classList.toggle("error", isError);
}

async function getSites() {
  const stored = await chrome.storage.local.get({ [SITES_KEY]: null, [LEGACY_KEY]: "" });
  return TabFreezerCore.sitesFromStorage(stored);
}

async function addCurrentTab() {
  if (!activeTab?.url) {
    setStatus(TabFreezerI18n.t("currentUnavailable"), true);
    return;
  }

  const sites = await getSites();
  const merged = TabFreezerCore.mergeSites(sites, [{
    url: activeTab.url,
    comment: commentInput.value.trim()
  }]);

  if (merged.added === 0) {
    setStatus(TabFreezerI18n.t("duplicateSite"), true);
    return;
  }

  await chrome.storage.local.set({ [SITES_KEY]: merged.sites });
  await chrome.storage.local.remove(LEGACY_KEY);
  setStatus(TabFreezerI18n.t("siteAdded"));
  addButton.disabled = true;
}

async function freezeSavedTabs() {
  const response = await chrome.runtime.sendMessage({ type: "FREEZE_MATCHING_TABS" });
  if (!response?.ok) {
    throw new Error(response?.error || TabFreezerI18n.t("genericError"));
  }

  const result = response.result;
  if (result.setupRequired) {
    setStatus(TabFreezerI18n.t("noSavedSites"), true);
    return;
  }

  setStatus(TabFreezerI18n.t("frozenResult", {
    frozen: result.frozen,
    skipped: result.skippedActive,
    existing: result.alreadyDiscarded
  }));
}

addButton.addEventListener("click", () => {
  addCurrentTab().catch(() => setStatus(TabFreezerI18n.t("genericError"), true));
});
freezeButton.addEventListener("click", () => {
  freezeSavedTabs().catch(() => setStatus(TabFreezerI18n.t("genericError"), true));
});
settingsButton.addEventListener("click", () => chrome.runtime.openOptionsPage());

Promise.all([
  chrome.storage.local.get({ [LANGUAGE_KEY]: "en" }),
  chrome.tabs.query({ active: true, currentWindow: true })
]).then(([stored, tabs]) => {
  TabFreezerI18n.apply(stored[LANGUAGE_KEY]);
  [activeTab] = tabs;

  if (activeTab?.url) {
    currentUrl.textContent = activeTab.url;
    currentUrl.title = activeTab.url;
  } else {
    currentUrl.textContent = TabFreezerI18n.t("currentUnavailable");
    addButton.disabled = true;
    commentInput.disabled = true;
  }
}).catch(() => {
  TabFreezerI18n.apply("en");
  currentUrl.textContent = TabFreezerI18n.t("currentUnavailable");
  addButton.disabled = true;
});
