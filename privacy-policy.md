# Privacy Policy — Article to Print

**Last updated:** June 9, 2026

Article to Print is a browser extension that converts web articles into printable text. This policy describes what data the extension handles and how.

## Summary

- The extension processes article URLs and page content **only when you click Convert**.
- Optional settings (such as a Jina API key) are stored **locally in your browser** via Chrome sync storage.
- We do not operate a backend server for conversion; fetching happens from your browser (and optionally via Jina Reader when you enable fallback).

## Data the extension accesses

### Article URLs and page content

When you convert an article, the extension may:

- Read the URL you enter in the popup
- Read HTML from the active tab (if it matches the URL you entered)
- Fetch the article URL over the network (with your permission for that site’s origin)

This content is used solely to extract and display a printable version. Converted article data is stored temporarily in **session storage** for the preview tab and is cleared when the browser session ends.

### Extension settings

If you choose to save options, the following may be stored in `chrome.storage.sync` on your device:

- Jina API key (optional)
- Whether Jina Reader fallback is enabled

These values are not sent to us. If Chrome sync is enabled, Google may sync extension settings across your signed-in devices per [Google’s sync policies](https://policies.google.com/privacy).

## Third-party services

### Jina Reader (optional)

If you enable Jina Reader fallback and/or provide a Jina API key, article URLs (and related request metadata required by Jina) are sent to Jina’s service at `r.jina.ai` to retrieve readable article text when direct fetching fails.

Review Jina’s terms and privacy practices at [jina.ai](https://jina.ai/).

## Data we do not collect

The extension does not include analytics, advertising, or account sign-in. We do not receive or store your browsing history, converted articles, or API keys on our own servers.

## Permissions

The extension requests browser permissions needed for conversion:

| Permission | Why |
|------------|-----|
| `activeTab` | Read the open tab when its URL matches your conversion request |
| `scripting` | Extract HTML from the active tab |
| `storage` | Save options and pass preview data to the preview page |
| `tabs` | Open the preview tab and read the active tab URL |
| Host access (on request) | Fetch article URLs you convert |
| `https://r.jina.ai/*` | Optional Jina Reader fallback |

Host permissions for arbitrary `http`/`https` origins are requested only when needed for a URL you submit, not for all sites by default.

## Children’s privacy

The extension is not directed at children under 13, and we do not knowingly collect personal information from children.

## Changes

We may update this policy as the extension changes. Material updates will be reflected in the “Last updated” date above.

## Contact

For privacy questions about this extension, contact the maintainer through the repository or support channel listed in the Chrome Web Store listing.
