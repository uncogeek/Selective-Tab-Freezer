(function (root) {
  "use strict";

  const messages = {
    fa: {
      optionsSubtitle: "فقط تب‌های انتخاب‌شده را مدیریت و Freeze کنید.",
      language: "زبان",
      persian: "فارسی",
      english: "English",
      searchPlaceholder: "جست‌وجو در URL یا توضیحات...",
      addFromList: "افزودن از لیست",
      importFile: "ورود فایل",
      exportList: "خروجی گرفتن",
      row: "ردیف",
      url: "URL یا عبارت منطبق",
      comment: "نام یا توضیحات",
      actions: "عملیات",
      edit: "ویرایش",
      delete: "حذف",
      save: "ذخیره",
      cancel: "انصراف",
      noSites: "هنوز هیچ سایتی اضافه نشده است.",
      noSearchResults: "نتیجه‌ای برای این جست‌وجو پیدا نشد.",
      sitesCount: "تعداد سایت‌ها: {count}",
      visibleCount: "نمایش {visible} از {total} سایت",
      bulkTitle: "افزودن از لیست",
      bulkHelp: "در هر خط یک URL کامل یا بخشی از URL را وارد کنید.",
      bulkPlaceholder: "https://www.tradingview.com/chart/3dfsdfQz/\n0K4ttewrt",
      addItems: "افزودن به فهرست",
      urlRequired: "حداقل یک URL یا عبارت معتبر وارد کنید.",
      duplicateSite: "این URL از قبل در فهرست وجود دارد.",
      siteUpdated: "ردیف با موفقیت ذخیره شد.",
      siteDeleted: "ردیف حذف شد.",
      confirmDelete: "این ردیف حذف شود؟",
      bulkAdded: "{added} مورد اضافه شد؛ {duplicates} مورد تکراری بود.",
      exported: "از {count} سایت خروجی گرفته شد.",
      fileImported: "{added} مورد وارد شد؛ {duplicates} مورد تکراری بود.",
      invalidImport: "ساختار فایل انتخاب‌شده معتبر نیست.",
      languageChanged: "زبان رابط تغییر کرد.",
      popupSubtitle: "عملیات فقط پس از انتخاب شما اجرا می‌شود.",
      currentTab: "تب فعلی",
      optionalComment: "نام یا توضیح اختیاری",
      optionalCommentPlaceholder: "مثلاً: چارت اصلی EURUSD",
      addCurrent: "افزودن تب فعلی",
      freezeSaved: "❄️Freeze کن",
      openSettings: "مدیریت فهرست و تنظیمات",
      loading: "در حال خواندن تب فعلی...",
      currentUnavailable: "URL تب فعلی قابل خواندن نیست.",
      siteAdded: "تب فعلی به فهرست اضافه شد.",
      frozenResult: "{frozen} تب Freeze شد؛ {skipped} تب فعال رد شد؛ {existing} تب از قبل Freeze بود.",
      noSavedSites: "فهرست خالی است؛ ابتدا یک تب اضافه کنید.",
      genericError: "عملیات انجام نشد. دوباره تلاش کنید."
    },
    en: {
      optionsSubtitle: "Manage and freeze only the tabs you explicitly select.",
      language: "Language",
      persian: "فارسی",
      english: "English",
      searchPlaceholder: "Search URLs or comments...",
      addFromList: "Add from list",
      importFile: "Import file",
      exportList: "Export list",
      row: "Row",
      url: "URL or matching text",
      comment: "Name or comment",
      actions: "Actions",
      edit: "Edit",
      delete: "Delete",
      save: "Save",
      cancel: "Cancel",
      noSites: "No sites have been added yet.",
      noSearchResults: "No result matches this search.",
      sitesCount: "Sites: {count}",
      visibleCount: "Showing {visible} of {total} sites",
      bulkTitle: "Add from list",
      bulkHelp: "Enter one full URL or URL substring per line.",
      bulkPlaceholder: "https://www.tradingview.com/chart/0sdfsdfQz/\n0K5ttewrt",
      addItems: "Add to list",
      urlRequired: "Enter at least one valid URL or pattern.",
      duplicateSite: "This URL already exists in the list.",
      siteUpdated: "The row was saved.",
      siteDeleted: "The row was deleted.",
      confirmDelete: "Delete this row?",
      bulkAdded: "Added {added}; skipped {duplicates} duplicate(s).",
      exported: "Exported {count} site(s).",
      fileImported: "Imported {added}; skipped {duplicates} duplicate(s).",
      invalidImport: "The selected file has an invalid structure.",
      languageChanged: "Interface language changed.",
      popupSubtitle: "Nothing runs until you choose an action.",
      currentTab: "Current tab",
      optionalComment: "Optional name or comment",
      optionalCommentPlaceholder: "Example: Main EURUSD chart",
      addCurrent: "Add current tab",
      freezeSaved: "Freeze listed tabs",
      openSettings: "Manage list and settings",
      loading: "Reading the current tab...",
      currentUnavailable: "The current tab URL is unavailable.",
      siteAdded: "The current tab was added to the list.",
      frozenResult: "Frozen: {frozen}; active skipped: {skipped}; already frozen: {existing}.",
      noSavedSites: "The list is empty. Add a tab first.",
      genericError: "The operation failed. Please try again."
    }
  };

  let currentLanguage = "fa";

  function t(key, values = {}) {
    const template = messages[currentLanguage]?.[key] || messages.fa[key] || key;
    return Object.entries(values).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template
    );
  }

  function apply(language, container = document) {
    currentLanguage = language === "en" ? "en" : "fa";
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === "en" ? "ltr" : "rtl";

    container.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    container.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.i18nPlaceholder);
    });

    return currentLanguage;
  }

  root.TabFreezerI18n = Object.freeze({ t, apply });
})(typeof globalThis !== "undefined" ? globalThis : self);
