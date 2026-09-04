# Selective Tab Freezer 1.1.0

This extension discards only tabs whose URL contains one of your saved URLs or patterns. A discarded tab remains visible and reloads when activated.

## Main features

- Clicking the toolbar icon opens a popup; it no longer freezes immediately.
- Add the current tab's full URL with an optional comment.
- Freeze all matching inactive tabs on demand.
- Edit, save, or delete individual table rows.
- Live client-side search across URLs and comments.
- Add multiple URL patterns from a textarea, one per line.
- Import JSON/TXT and export JSON with comments preserved.
- Persian is the default language; English switches the entire UI to LTR.
- URL fields remain LTR in both languages.
- Version 1.0 settings are migrated automatically.

## Vazirmatn fonts

Place the files at these exact paths:

```text
Selective-Tab-Freezer/fonts/Vazirmatn-Regular.woff2
Selective-Tab-Freezer/fonts/Vazirmatn-Bold.woff2
```

Reload the extension from `chrome://extensions` after adding them. Tahoma and Arial are used as fallbacks when the font files are absent.

Chrome cannot discard an active tab. Switch to a non-target tab before running Freeze if a target tab is active.
