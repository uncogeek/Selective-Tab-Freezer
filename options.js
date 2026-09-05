"use strict";

const SITES_KEY = "freezeSites";
const LEGACY_KEY = "freezePatterns";
const LANGUAGE_KEY = "uiLanguage";

const elements = {
  language: document.getElementById("language"),
  search: document.getElementById("search"),
  body: document.getElementById("sites-body"),
  empty: document.getElementById("empty-state"),
  count: document.getElementById("site-count"),
  status: document.getElementById("status"),
  addList: document.getElementById("add-list"),
  importFile: document.getElementById("import-file"),
  exportList: document.getElementById("export-list"),
  fileInput: document.getElementById("file-input"),
  modal: document.getElementById("bulk-modal"),
  bulkText: document.getElementById("bulk-text"),
  bulkImport: document.getElementById("bulk-import"),
  bulkCancel: document.getElementById("bulk-cancel")
};

let sites = [];
let editingIndex = null;

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", isError);
}

async function persistSites() {
  sites = TabFreezerCore.normalizeSites(sites);
  await chrome.storage.local.set({ [SITES_KEY]: sites });
  await chrome.storage.local.remove(LEGACY_KEY);
}

function makeButton(labelKey, action, index, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = TabFreezerI18n.t(labelKey);
  button.dataset.action = action;
  button.dataset.index = String(index);
  if (className) {
    button.className = className;
  }
  return button;
}

function makeTextCell(value, className) {
  const cell = document.createElement("td");
  cell.className = className;
  cell.textContent = value;
  cell.title = value;
  return cell;
}

function renderEditRow(row, site, index) {
  const number = document.createElement("td");
  number.className = "number-column";
  number.textContent = String(index + 1);

  const urlCell = document.createElement("td");
  const urlInput = document.createElement("input");
  urlInput.className = "cell-editor url-editor";
  urlInput.value = site.url;
  urlInput.dataset.editor = "url";
  urlCell.appendChild(urlInput);

  const commentCell = document.createElement("td");
  const commentInput = document.createElement("input");
  commentInput.className = "cell-editor";
  commentInput.value = site.comment;
  commentInput.dataset.editor = "comment";
  commentCell.appendChild(commentInput);

  const actions = document.createElement("td");
  const group = document.createElement("div");
  group.className = "row-actions";
  group.append(makeButton("save", "save", index, "primary"));
  group.append(makeButton("cancel", "cancel", index));
  actions.appendChild(group);

  row.append(number, urlCell, commentCell, actions);
  queueMicrotask(() => urlInput.focus());
}

function renderViewRow(row, site, index) {
  const number = document.createElement("td");
  number.className = "number-column";
  number.textContent = String(index + 1);

  const actions = document.createElement("td");
  const group = document.createElement("div");
  group.className = "row-actions";
  group.append(makeButton("edit", "edit", index));
  group.append(makeButton("delete", "delete", index, "danger"));
  actions.appendChild(group);

  row.append(
    number,
    makeTextCell(site.url, "url-cell"),
    makeTextCell(site.comment || "—", "comment-cell"),
    actions
  );
}

function render() {
  const query = elements.search.value.trim().toLocaleLowerCase();
  const filtered = sites
    .map((site, index) => ({ site, index }))
    .filter(({ site }) =>
      !query || site.url.toLocaleLowerCase().includes(query) || site.comment.toLocaleLowerCase().includes(query)
    );

  elements.body.replaceChildren();

  for (const { site, index } of filtered) {
    const row = document.createElement("tr");
    row.dataset.index = String(index);
    if (editingIndex === index) {
      renderEditRow(row, site, index);
    } else {
      renderViewRow(row, site, index);
    }
    elements.body.appendChild(row);
  }

  elements.empty.hidden = filtered.length > 0;
  elements.empty.textContent = sites.length === 0
    ? TabFreezerI18n.t("noSites")
    : TabFreezerI18n.t("noSearchResults");

  elements.count.textContent = query
    ? TabFreezerI18n.t("visibleCount", { visible: filtered.length, total: sites.length })
    : TabFreezerI18n.t("sitesCount", { count: sites.length });
}

async function saveEditedRow(index, row) {
  const url = row.querySelector('[data-editor="url"]').value.trim();
  const comment = row.querySelector('[data-editor="comment"]').value.trim();

  if (!url) {
    setStatus(TabFreezerI18n.t("urlRequired"), true);
    return;
  }

  if (sites.some((site, siteIndex) => siteIndex !== index && site.url === url)) {
    setStatus(TabFreezerI18n.t("duplicateSite"), true);
    return;
  }

  sites[index] = { url, comment };
  editingIndex = null;
  await persistSites();
  render();
  setStatus(TabFreezerI18n.t("siteUpdated"));
}

async function handleTableAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const index = Number(button.dataset.index);
  const row = button.closest("tr");

  if (button.dataset.action === "edit") {
    editingIndex = index;
    render();
  } else if (button.dataset.action === "cancel") {
    editingIndex = null;
    render();
  } else if (button.dataset.action === "save") {
    await saveEditedRow(index, row);
  } else if (button.dataset.action === "delete") {
    if (!confirm(TabFreezerI18n.t("confirmDelete"))) {
      return;
    }
    sites.splice(index, 1);
    editingIndex = null;
    await persistSites();
    render();
    setStatus(TabFreezerI18n.t("siteDeleted"));
  }
}

function openBulkModal() {
  elements.modal.hidden = false;
  elements.bulkText.value = "";
  elements.bulkText.focus();
}

function closeBulkModal() {
  elements.modal.hidden = true;
}

async function addBulkSites() {
  const incoming = TabFreezerCore.parsePatterns(elements.bulkText.value)
    .map((url) => ({ url, comment: "" }));

  if (incoming.length === 0) {
    setStatus(TabFreezerI18n.t("urlRequired"), true);
    return;
  }

  const merged = TabFreezerCore.mergeSites(sites, incoming);
  sites = merged.sites;
  await persistSites();
  closeBulkModal();
  render();
  setStatus(TabFreezerI18n.t("bulkAdded", {
    added: merged.added,
    duplicates: merged.duplicates
  }));
}

function exportSites() {
  const payload = {
    format: "selective-tab-freezer",
    version: 1,
    exportedAt: new Date().toISOString(),
    sites
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "selective-tab-freezer-sites.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  setStatus(TabFreezerI18n.t("exported", { count: sites.length }));
}

async function importFile(file) {
  const text = await file.text();
  let incoming;

  if (file.name.toLocaleLowerCase().endsWith(".txt")) {
    incoming = TabFreezerCore.parsePatterns(text).map((url) => ({ url, comment: "" }));
  } else {
    const parsed = JSON.parse(text);
    incoming = Array.isArray(parsed) ? parsed : parsed?.sites;
    if (!Array.isArray(incoming)) {
      throw new Error(TabFreezerI18n.t("invalidImport"));
    }
  }

  const merged = TabFreezerCore.mergeSites(sites, incoming);
  sites = merged.sites;
  await persistSites();
  render();
  setStatus(TabFreezerI18n.t("fileImported", {
    added: merged.added,
    duplicates: merged.duplicates
  }));
}

async function changeLanguage() {
  await chrome.storage.local.set({ [LANGUAGE_KEY]: elements.language.value });
  TabFreezerI18n.apply(elements.language.value);
  render();
  setStatus(TabFreezerI18n.t("languageChanged"));
}

elements.search.addEventListener("input", render);
elements.body.addEventListener("click", (event) => {
  handleTableAction(event).catch((error) => setStatus(error.message, true));
});
elements.addList.addEventListener("click", openBulkModal);
elements.bulkCancel.addEventListener("click", closeBulkModal);
elements.modal.addEventListener("click", (event) => {
  if (event.target.matches("[data-close-modal]")) {
    closeBulkModal();
  }
});
elements.bulkImport.addEventListener("click", () => {
  addBulkSites().catch((error) => setStatus(error.message, true));
});
elements.exportList.addEventListener("click", exportSites);
elements.importFile.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", () => {
  const [file] = elements.fileInput.files;
  if (file) {
    importFile(file).catch((error) => setStatus(error.message, true));
  }
  elements.fileInput.value = "";
});
elements.language.addEventListener("change", () => {
  changeLanguage().catch((error) => setStatus(error.message, true));
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.modal.hidden) {
    closeBulkModal();
  }
});

chrome.storage.local.get({ [SITES_KEY]: null, [LEGACY_KEY]: "", [LANGUAGE_KEY]: "en" })
  .then(async (stored) => {
    sites = TabFreezerCore.sitesFromStorage(stored);
    elements.language.value = stored[LANGUAGE_KEY] === "fa" ? "fa" : "en";
    TabFreezerI18n.apply(elements.language.value);

    if (!Array.isArray(stored[SITES_KEY]) && sites.length > 0) {
      await persistSites();
    }

    render();
  })
  .catch((error) => setStatus(error.message, true));
