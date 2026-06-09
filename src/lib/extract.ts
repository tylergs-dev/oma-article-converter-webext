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
}

function extractBodyHtml(html: string): string | null {
  const { document } = parseHTML(html);
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
  return sanitizeHtml(
    bodyDoc.body.textContent?.trim() ? bodyDoc.body.innerHTML : "",
  );
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
