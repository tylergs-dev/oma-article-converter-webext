# Privacy Policy — Article to Print

**Last updated:** July 13, 2026

Article to Print is a browser extension that converts the current web page into printable text. This policy describes what data the extension handles and how.

## Summary

- The extension processes page content **only when you click Convert** or **AI conversion** on the page you are viewing.
- Local conversion reads HTML from your open tab and extracts article text in the browser.
- AI conversion also reads HTML locally, then sends trimmed page HTML to OpenRouter using **your** API key so a model can extract the article.
- We do not operate a backend server; no article content is sent to us.

## Data the extension accesses

### Page content

When you convert a page, the extension:

- Reads HTML from the active tab in your browser
- For **Convert this page**: extracts article text locally for the print preview
- For **AI conversion**: trims the HTML and sends it to OpenRouter (`https://openrouter.ai`) with your saved API key to extract the article

Converted article data is stored temporarily in **session storage** for the preview tab and is cleared when the browser session ends.

### OpenRouter API key

If you use AI conversion, you may save an OpenRouter API key in the extension Options page. That key is stored only in your browser’s local extension storage. It is sent to OpenRouter only when you click **AI conversion**.

## Data we do not collect

The extension does not include analytics, advertising, or account sign-in with us. We do not receive or store your browsing history, API key, or converted articles on our servers.

## Permissions

The extension requests browser permissions needed for conversion:

| Permission | Why |
|------------|-----|
| `activeTab` | Read the open tab when you click Convert |
| `scripting` | Extract HTML from the active tab |
| `storage` | Pass preview data to the preview page and store your OpenRouter API key locally |
| `tabs` | Open the preview tab and read the active tab URL |
| Host access to `openrouter.ai` | Send trimmed page HTML for AI conversion when you choose that option |

## Children’s privacy

The extension is not directed at children under 13, and we do not knowingly collect personal information from children.

## Changes

We may update this policy as the extension changes. Material updates will be reflected in the “Last updated” date above.

## Contact

For privacy questions about this extension, contact the maintainer through the repository or support channel listed in the store listing.
