# Article to Print (Chrome Extension)

Convert web articles into clean, text-only documents you can print or save as PDF. Built as a Manifest V3 browser extension with a popup converter, full-tab preview, and optional [Jina Reader](https://jina.ai/reader/) fallback for bot-blocked sites.

## Features

- Convert the current tab or any article URL from the popup
- Reader-style extraction with images, ads, and scripts removed
- Title, author, source, and publication date in the preview header
- Print-optimized layout (Print → Save as PDF)
- Optional Jina API key stored locally for higher fallback success

## Requirements

- Node.js 20+
- Google Chrome or another Chromium browser

## Development

```bash
npm install
npm run dev
```

Vite watches the extension and rebuilds on change. Load the unpacked extension from the `dist/` folder:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist` directory in this project

After code changes, click **Reload** on the extension card in `chrome://extensions`.

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

1. Open an article in a tab, or click the extension icon.
2. Confirm the URL and click **Convert**.
3. Review the preview tab, then click **Print** (or Cmd/Ctrl+P) and choose Save as PDF.

### Options

Open **Extension options** from the popup (or right-click the extension icon → Options) to configure:

| Setting | Purpose |
|---------|---------|
| Jina API key | Optional key for Jina Reader fallback ([get one](https://jina.ai/reader#pricing)) |
| Enable Jina Reader fallback | Use Jina when direct fetch fails or returns a bot/challenge page |

Settings are stored in `chrome.storage.sync` on your device only.

## Project layout

```
src/
  background/     Service worker (fetch, extract, open preview)
  popup/          Extension popup UI
  preview/        Full-tab print preview
  options/        Jina settings page
  lib/            Extraction, sanitization, validation
  styles/         Shared CSS
  ui/             Shared UI helpers
```

## Limitations

- Paywalled, JavaScript-only, or heavily bot-protected pages may still fail.
- Jina free tier has rate limits; an API key improves success on blocked domains.
- Extraction quality depends on the source HTML structure.
- For personal/archival use; respect site terms of service and copyright.

## License

Private / personal use unless otherwise specified by the repository owner.
