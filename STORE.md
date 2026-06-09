# Chrome Web Store listing — Article to Print

Draft copy and assets checklist for publishing the extension.

## Short description (132 chars max)

Convert articles to clean, printable text. Removes ads and images. Optional Jina fallback for blocked sites.

## Detailed description

**Article to Print** turns any web article into a clean, text-focused document you can print or save as PDF—ideal for screen readers, archival reading, and distraction-free printing.

### How it works

1. Click the extension icon on an article page (or paste a URL).
2. Click **Convert** to extract the main article text.
3. Review the preview, then **Print** or save as PDF from your browser.

### Highlights

- **Reader-style extraction** — title, author, source, date, and article body without images, ads, or scripts
- **Current tab support** — when the URL matches your open tab, content is read directly from the page
- **Print-ready layout** — serif article typography with print CSS tuned for PDF export
- **Optional Jina Reader fallback** — for sites that block automated fetching (403/429 or bot challenges)

### Privacy

- No account required
- No analytics or ads
- Conversion runs when you click Convert; optional API key stays in your browser
- See `privacy-policy.md` for full details

### Permissions explained

- **Read active tab** — only when you convert and the tab URL matches
- **Storage** — save your optional settings and pass preview data to the preview page
- **Host access** — requested per site when fetching URLs you submit

## Category

Productivity

## Language

English

## Screenshots (suggested)

1. Popup with URL prefilled and Convert button
2. Preview page with article title, meta line, and Print toolbar
3. Options page showing Jina API key and fallback toggle
4. Browser print dialog / saved PDF sample

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

## Privacy practices (Chrome Web Store form)

| Question | Answer |
|----------|--------|
| Single purpose | Yes — convert articles to printable text |
| User data collected | No personal data collected by the developer |
| Data usage | Article URLs/content processed on user action for conversion only |
| Data sold | No |
| Remote code | No (bundled extension only; network calls to user-submitted URLs and optional Jina API) |
| Privacy policy URL | Host `privacy-policy.md` on GitHub Pages or include in store support URL |

## Support URL / privacy policy URL

Replace with your published URLs before submission, for example:

- Support: `https://github.com/<user>/article-to-print-extension/issues`
- Privacy: `https://github.com/<user>/article-to-print-extension/blob/main/privacy-policy.md`

## Version notes (1.0.0)

Initial release:

- Manifest V3 popup converter
- Full-tab print preview
- Jina Reader fallback with optional API key
- Unit tests for extraction helpers

## Review tips

- Demo video or test URL: use a public news article (not paywalled).
- Explain Jina fallback in reviewer notes if host permission prompts appear.
- Ensure `privacy-policy.md` is publicly accessible before submitting.
