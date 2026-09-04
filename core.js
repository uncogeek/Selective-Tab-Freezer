(function (root) {
  "use strict";

  function parsePatterns(value) {
    const lines = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);
    const unique = new Set();

    for (const line of lines) {
      const pattern = String(line).trim();
      if (pattern) {
        unique.add(pattern);
      }
    }

    return [...unique];
  }

  function normalizeSites(value) {
    const source = Array.isArray(value)
      ? value
      : parsePatterns(value).map((url) => ({ url, comment: "" }));
    const sites = [];
    const seen = new Set();

    for (const item of source) {
      const url = String(typeof item === "string" ? item : item?.url || "").trim();
      const comment = String(typeof item === "object" && item ? item.comment || "" : "").trim();

      if (!url || seen.has(url)) {
        continue;
      }

      seen.add(url);
      sites.push({ url, comment });
    }

    return sites;
  }

  function sitesFromStorage(stored) {
    if (Array.isArray(stored?.freezeSites)) {
      return normalizeSites(stored.freezeSites);
    }

    return normalizeSites(stored?.freezePatterns || "");
  }

  function mergeSites(current, incoming) {
    const sites = normalizeSites(current);
    const byUrl = new Map(sites.map((site, index) => [site.url, index]));
    let added = 0;
    let duplicates = 0;

    for (const site of normalizeSites(incoming)) {
      const existingIndex = byUrl.get(site.url);

      if (existingIndex !== undefined) {
        duplicates += 1;
        if (!sites[existingIndex].comment && site.comment) {
          sites[existingIndex] = { ...sites[existingIndex], comment: site.comment };
        }
        continue;
      }

      byUrl.set(site.url, sites.length);
      sites.push(site);
      added += 1;
    }

    return { sites, added, duplicates };
  }

  function matchesUrl(url, sites) {
    if (!url) {
      return false;
    }

    return normalizeSites(sites).some((site) => url.includes(site.url));
  }

  root.TabFreezerCore = Object.freeze({
    parsePatterns,
    normalizeSites,
    sitesFromStorage,
    mergeSites,
    matchesUrl
  });
})(typeof globalThis !== "undefined" ? globalThis : self);
