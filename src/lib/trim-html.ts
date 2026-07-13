import { parseHTML } from "linkedom";
import type { Document } from "linkedom";
import { ARTICLE_CONTAINER_SELECTORS } from "./sanitize";

export const TRIM_HTML_MAX_CHARS = 90_000;

const STRIP_TAGS = [
  "script",
  "style",
  "noscript",
  "svg",
  "iframe",
  "object",
  "embed",
  "canvas",
  "video",
  "audio",
  "source",
  "track",
  "link",
  "meta",
  "img",
  "picture",
  "figure",
  "figcaption",
  "form",
  "button",
  "input",
  "select",
  "textarea",
  "template",
] as const;

function stripNoise(root: Element): void {
  for (const tag of STRIP_TAGS) {
    root.querySelectorAll(tag).forEach((el) => el.remove());
  }

  root.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "style" || name === "srcset") {
        el.removeAttribute(attr.name);
      }
    }
  });
}

function findBestContainer(document: Document): Element {
  for (const selector of ARTICLE_CONTAINER_SELECTORS) {
    const el = document.querySelector(selector);
    const text = el?.textContent?.replace(/\s+/g, " ").trim() ?? "";
    if (el && text.length >= 400) return el;
  }
  return document.body ?? document.documentElement;
}

function collapseWhitespace(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();
}

function truncateHtml(html: string, maxChars: number): string {
  if (html.length <= maxChars) return html;
  return `${html.slice(0, maxChars)}\n<!-- truncated -->`;
}

/**
 * Reduce page HTML for an LLM: drop scripts/media/forms, prefer article
 * container, collapse whitespace, and cap size.
 */
export function trimHtmlForAi(
  html: string,
  maxChars: number = TRIM_HTML_MAX_CHARS,
): string {
  if (!html?.trim()) return "";

  const { document } = parseHTML(html);
  const container = findBestContainer(document);
  stripNoise(container);

  const cleaned = collapseWhitespace(container.innerHTML || container.outerHTML || "");
  return truncateHtml(cleaned, maxChars);
}
