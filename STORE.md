# Store listing — Article to Print

Draft copy and assets checklist for publishing the extension.

## Short description (132 chars max)

Convert the current page to clean, printable text. Reads your open tab locally—no URL paste needed.

## Detailed description

**Article to Print** turns the page you are viewing into a clean, text-focused document you can print or save as PDF—ideal for screen readers, archival reading, and distraction-free printing.

### How it works

1. Open an article or web page in a tab.
2. Click the extension icon.
3. Click **Convert this page**.
4. Review the preview, then **Print** or save as PDF from your browser.

### Highlights

- **One-click conversion** — no URL to paste or verify
- **Local processing** — reads your open tab directly, like a normal browser visit
- **Reader-style extraction** — title, author, source, date, and article body without images, ads, or scripts
- **Print-ready layout** — serif article typography with print CSS tuned for PDF export

### Privacy

- No account required
- No analytics or ads
- No remote servers — conversion runs locally when you click Convert
- See `privacy-policy.md` for full details

### Permissions explained

- **Read active tab** — only when you click Convert on the current page
- **Storage** — pass preview data to the preview page

## Category

Productivity

## Language

English

## Screenshots (suggested)

1. Popup showing current page title and Convert button
2. Preview page with article title, meta line, and Print toolbar
3. Browser print dialog / saved PDF sample

Recommended size: 1280×800 or 640×400 PNG.

## Promotional images

- **Small promo tile:** 440×280
- **Marquee promo tile:** 1400×560 (optional)

Use brand accent `#4f46e5` on light `#f1f5f9` background; document icon motif from popup header.

## Icons

Shipped in `public/icons/`:

- 16×16
- 48×48
- 128×128

Regenerate with `npm run icons` if needed.

## Package for upload

```bash
npm run zip
```

Upload `article-to-print-extension.zip` (contents of `dist/` after build).

## Privacy practices (store form)

| Question | Answer |
|----------|--------|
| Single purpose | Yes — convert the current page to printable text |
| User data collected | No personal data collected by the developer |
| Data usage | Page content processed locally on user action for conversion only |
| Data sold | No |
| Remote code | No (bundled extension only) |
| Privacy policy URL | Host `privacy-policy.md` on GitHub or include in store support URL |

## Support URL / privacy policy URL

Replace with your published URLs before submission, for example:

- Support: `https://github.com/tylergs-dev/oma-article-converter-webext/issues`
- Privacy: `https://github.com/tylergs-dev/oma-article-converter-webext/blob/main/privacy-policy.md`

## Version notes (1.1.0)

- Optional **AI conversion** fallback via OpenRouter (user-supplied API key)
- Options page to save/clear the key locally
- Local convert path unchanged; page HTML is sent to OpenRouter only when AI conversion is used

## Reviewer note (paste into store submission)

**What’s new:** Optional AI conversion fallback. Default “Convert this page” still runs entirely locally.

**How to test:**
1. Open any public news article.
2. Click Convert — should work without an API key.
3. Open Options → paste an OpenRouter key from https://openrouter.ai/keys → Save.
4. Click **AI conversion** — preview should open with title/author/date and article body.
5. Without a key, AI conversion should show an error directing you to Options.

**Permissions:** New host access to `openrouter.ai` is only used for the AI path. The API key stays in `chrome.storage.local` on the device.

## Version notes (1.0.0)

Initial release:

- One-click popup converter for the current tab
- Full-tab print preview
- Local-only extraction (no remote fetching)
- Unit tests for extraction helpers

## Review tips

- Demo video or test URL: use a public news article (not paywalled).
- Explain that the extension only reads the active tab when the user clicks Convert.
- Ensure `privacy-policy.md` is publicly accessible before submitting.
