import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import {
  isBoilerplateParagraph,
  isPromoHeading,
  normalizeText,
} from "./boilerplate";
import { ExtractError } from "./errors";
import { domainFromUrl, fallbackMetadata, formatDate } from "./metadata";
import { parseReadableArticle, readableContentToHtml } from "./readable";
import {
  ARTICLE_CONTAINER_SELECTORS,
  BLOCK_TAGS,
  JUNK_CLASS_PATTERN,
  sanitizeHtml,
  unwrapLinks,
} from "./sanitize";
import type { ConvertResult } from "./types";

const PROMO_SELECTORS = [
  '[id^="blueconic"]',
  '[id*="blueconic-article"]',
  ".blueconic-article__wrapper",
  ".blueconic-article__wrapper__top",
  ".blueconic-article__wrapper__bottom",
  ".ad-unit",
  '[class*="blueconic"]',
  ".vanilla-blueconic-header-wrapper",
  ".slice-author-bio",
  ".slice-container-authorBio",
  '[class*="authorBio"]',
];

function stripInArticlePromos(document: Document): void {
  for (const selector of PROMO_SELECTORS) {
    document.querySelectorAll(selector).forEach((el) => el.remove());
  }
}

function findArticleContainer(document: Document): Element | null {
  for (const selector of ARTICLE_CONTAINER_SELECTORS) {
    for (const element of document.querySelectorAll(selector)) {
      if ((element.textContent?.trim().length ?? 0) >= 400) {
        return element;
      }
    }
  }
  return null;
}

function pruneArticleContainer(container: Element): void {
  const removeTags = [
    "img", "picture", "svg", "video", "iframe", "aside", "nav",
    "script", "style", "form", "button", "input", "noscript",
    "figure", "figcaption", "object", "embed", "canvas", "audio", "source", "track",
  ];
  for (const tagName of removeTags) {
    container.querySelectorAll(tagName).forEach((el) => el.remove());
  }

  container.querySelectorAll("*").forEach((tag) => {
    const classStr = tag.getAttribute("class") ?? "";
    const tagId = tag.getAttribute("id") ?? "";
    if (JUNK_CLASS_PATTERN.test(`${classStr} ${tagId}`)) {
      tag.remove();
    }
  });

  container.querySelectorAll("h2, h3, h4").forEach((heading) => {
    if (isPromoHeading(heading.textContent ?? "")) {
      heading.remove();
    }
  });

  container.querySelectorAll("h3").forEach((heading) => {
    if (normalizeText(heading.textContent ?? "").toLowerCase() === "related content") {
      const sibling = heading.nextElementSibling;
      if (sibling && (sibling.tagName === "UL" || sibling.tagName === "OL")) {
        sibling.remove();
      }
      heading.remove();
    }
  });
}

function extractFromContainer(container: Element): string | null {
  const { document } = parseHTML(`<!DOCTYPE html><html><body>${container.outerHTML}</body></html>`);
  const root = document.body.firstElementChild;
  if (!root) return null;

  pruneArticleContainer(root);

  const blocks: string[] = [];
  for (const tagName of BLOCK_TAGS) {
    root.querySelectorAll(tagName).forEach((tag) => {
      let parent: Element | null = tag.parentElement;
      while (parent && parent !== root) {
        if (BLOCK_TAGS.includes(parent.tagName.toLowerCase() as (typeof BLOCK_TAGS)[number])) {
          return;
        }
        parent = parent.parentElement;
      }

      if (["h2", "h3", "h4"].includes(tag.tagName.toLowerCase())) {
        const text = normalizeText(tag.textContent ?? "");
        if (isPromoHeading(text)) return;
        blocks.push(`<${tag.tagName.toLowerCase()}>${text}</${tag.tagName.toLowerCase()}>`);
        return;
      }

      if (tag.tagName.toLowerCase() === "p") {
        const clone = tag.cloneNode(true) as Element;
        pruneArticleContainer(clone);
        unwrapLinks(clone);
        const text = normalizeText(clone.textContent ?? "");
        if (!text || isBoilerplateParagraph(text)) return;
        if (text.toLowerCase() === "about adviser intel") return;
        blocks.push(clone.outerHTML);
        return;
      }

      if (tag.tagName === "UL" || tag.tagName === "OL") {
        const linkText = [...tag.querySelectorAll("a")]
          .map((a) => normalizeText(a.textContent ?? ""))
          .join(" ")
          .toLowerCase();
        if (
          linkText === "facebook x" ||
          linkText === "facebook" ||
          linkText === "x" ||
          (tag.querySelectorAll("li").length <= 3 && linkText.includes("facebook"))
        ) {
          return;
        }
      }

      if (["ul", "ol", "blockquote", "table"].includes(tag.tagName.toLowerCase())) {
        const clone = tag.cloneNode(true) as Element;
        pruneArticleContainer(clone);
        unwrapLinks(clone);
        if (clone.textContent?.trim()) {
          blocks.push(clone.outerHTML);
        }
      }
    });
  }

  if (!blocks.length) return null;
  return blocks.join("\n");
}

const STANDALONE_DATELINE =
  /^[A-Z][A-Z\s,.'-]+,?\s+[A-Z][a-z]+\.?,?\s+\d{1,2},?\s+\d{4}$/;

function paragraphContinues(previousText: string, nextText: string, next: Element): boolean {
  if (/^[.,;:—–-]/.test(nextText)) return true;
  if (/^[a-z("']/.test(nextText)) return true;
  if (
    nextText.length <= 80 &&
    !/[.!?]/.test(nextText) &&
    next.querySelector("span, em, i, strong, b") &&
    !next.querySelector("ul, ol, table")
  ) {
    return true;
  }
  return false;
}

/** Hoist lone paragraphs out of wrapper divs left by glossary popover embeds. */
function flattenSingleParagraphDivs(root: Element): void {
  let changed = true;

  while (changed) {
    changed = false;

    for (const div of root.querySelectorAll("div")) {
      const blockChildren = [...div.children].filter((child) => {
        const tag = child.tagName.toLowerCase();
        return tag !== "br" && (BLOCK_TAGS.includes(tag as (typeof BLOCK_TAGS)[number]) || tag === "div");
      });

      if (blockChildren.length === 1 && blockChildren[0].tagName === "P") {
        div.replaceWith(blockChildren[0]);
        changed = true;
        break;
      }
    }
  }
}

/** Rejoin paragraphs split by inline glossary popovers (e.g. Morningstar dictionary terms). */
function mergeSplitParagraphs(root: Element): void {
  let merged = true;

  while (merged) {
    merged = false;

    for (const current of root.querySelectorAll("p")) {
      const next = current.nextElementSibling;
      if (!next || next.tagName !== "P") continue;

      const currentText = normalizeText(current.textContent ?? "");
      const nextText = normalizeText(next.textContent ?? "");
      if (!currentText || !nextText) continue;

      const currentEndsSentence = /[.!?]["'”)]*$/.test(currentText);
      if (!currentEndsSentence && paragraphContinues(currentText, nextText, next)) {
        const nextHtml = next.innerHTML.trimStart();
        const separator = /^[.,;:—–-]/.test(nextText) ? "" : " ";
        current.innerHTML = `${current.innerHTML.trimEnd()}${separator}${nextHtml}`;
        next.remove();
        merged = true;
        break;
      }
    }
  }
}

function polishArticleBody(root: Element, title: string | null): void {
  const titleNorm = normalizeText(title ?? "").toLowerCase();

  root.querySelectorAll("h2, h3, h4").forEach((heading) => {
    const text = normalizeText(heading.textContent ?? "");
    if (isPromoHeading(text)) {
      heading.remove();
      return;
    }
    if (titleNorm && text.toLowerCase() === titleNorm) {
      heading.remove();
    }
  });

  root.querySelectorAll("div, aside, section").forEach((el) => {
    const text = normalizeText(el.textContent ?? "");
    if (!text || text.length > 400) return;
    if (isPromoHeading(text) || isBoilerplateParagraph(text)) {
      el.remove();
    }
  });

  for (const p of [...root.querySelectorAll("p")]) {
    const text = normalizeText(p.textContent ?? "");
    if (isBoilerplateParagraph(text)) {
      p.remove();
      continue;
    }
    if (titleNorm && text.toLowerCase() === titleNorm) {
      p.remove();
      continue;
    }
    if (STANDALONE_DATELINE.test(text) && !text.includes("/PRNewswire/")) {
      p.remove();
      continue;
    }
    break;
  }

  for (const p of [...root.querySelectorAll("p")].reverse()) {
    const text = normalizeText(p.textContent ?? "");
    if (isBoilerplateParagraph(text)) {
      p.remove();
      continue;
    }
    break;
  }

  polishSplitParagraphs(root);
}

function polishSplitParagraphs(root: Element): void {
  flattenSingleParagraphDivs(root);
  mergeSplitParagraphs(root);
}

function extractBodyHtml(html: string): string | null {
  const { document } = parseHTML(html);
  stripInArticlePromos(document);
  const container = findArticleContainer(document);

  const readable = parseReadableArticle(document);
  if (readable) {
    const body = readableContentToHtml(readable.content, container, isPromoHeading);
    if (body) return body;
  }

  if (container) {
    const direct = extractFromContainer(container);
    if (direct) {
      const { document: d2 } = parseHTML(`<!DOCTYPE html><html><body>${direct}</body></html>`);
      if (normalizeText(d2.body.textContent ?? "").length >= 400) {
        return direct;
      }
    }
  }

  return null;
}

function finalizeBodyHtml(rawBody: string, title: string | null): string {
  const { document: bodyDoc } = parseHTML(
    `<!DOCTYPE html><html><body>${rawBody}</body></html>`,
  );
  polishArticleBody(bodyDoc.body, title);
  const sanitized = sanitizeHtml(
    bodyDoc.body.textContent?.trim() ? bodyDoc.body.innerHTML : "",
  );
  if (!sanitized) return "";

  const { document: finalDoc } = parseHTML(
    `<!DOCTYPE html><html><body>${sanitized}</body></html>`,
  );
  polishSplitParagraphs(finalDoc.body);
  return finalDoc.body.textContent?.trim() ? finalDoc.body.innerHTML : "";
}

export function extractArticle(url: string, html: string): ConvertResult {
  const fallbacks = fallbackMetadata(html, url);
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const parsed = reader.parse();

  const title = parsed?.title || fallbacks.title;
  const author = fallbacks.author;
  const source = fallbacks.source || domainFromUrl(url) || null;
  const dateRaw = fallbacks.date;

  const rawBody = extractBodyHtml(html);
  const bodyHtml = rawBody ? finalizeBodyHtml(rawBody, title) : "";

  if (!bodyHtml) {
    throw new ExtractError("Could not extract article content");
  }

  return {
    title: (title || "Untitled Article").trim(),
    author: author?.trim() || null,
    source: source?.trim() || null,
    date: formatDate(dateRaw),
    html: bodyHtml,
  };
}
