# Article to Print (Browser Extension)

Convert the current web page into a clean, text-only document you can print or save as PDF. Built as a Manifest V3 browser extension with a one-click popup and full-tab print preview.

## Features

- One-click conversion of the page you are viewing
- Reads HTML directly from the open tab (no remote fetching)
- Reader-style extraction with images, ads, and scripts removed
- Title, author, source, and publication date in the preview header
- Print-optimized layout (Print → Save as PDF)

## Requirements

- Node.js 20+
- Google Chrome, Microsoft Edge, or another Chromium browser

## Development

```bash
npm install
npm run dev
```

Vite watches the extension and rebuilds on change. Load the unpacked extension from the `dist/` folder:

1. Open `chrome://extensions` or `edge://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` directory in this project

After code changes, click **Reload** on the extension card.

## Build and package

```bash
npm run build
```

Produces a production build in `dist/`.

```bash
npm run zip
```

Runs a production build and creates `article-to-print-extension.zip` for store submission or sharing.

Generate placeholder icons (if missing):

```bash
npm run icons
```

## Tests

```bash
npm test
```

Runs Vitest unit tests for extraction helpers (boilerplate detection, bot pages, metadata, sanitization).

## Usage

1. Open an article or web page in a tab.
2. Click the extension icon.
3. Click **Convert this page**.
4. Review the preview tab, then click **Print** (or Cmd/Ctrl+P) and choose Save as PDF.

## How it works

The extension reads the live DOM from your current tab using `activeTab` and `scripting` permissions. Extraction runs locally in the extension—nothing is sent to a remote server. This uses your normal browsing session (cookies, login, rendered content), so it works on pages that block automated fetching.

## Project layout

```
src/
  background/     Service worker (capture tab, extract, open preview)
  popup/          One-click convert popup
  preview/        Full-tab print preview
  lib/            Extraction, sanitization, validation
  styles/         Shared CSS
  ui/             Shared UI helpers
```

## Limitations

- Only converts the page currently open in the active tab.
- Paywalled or heavily dynamic pages may still extract poorly if content is not in the DOM.
- Extraction quality depends on the source HTML structure.
- For personal/archival use; respect site terms of service and copyright.

## License

Private / personal use unless otherwise specified by the repository owner.
