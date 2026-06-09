import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import { isBoilerplateParagraph, normalizeText } from "./boilerplate";

const MIN_ARTICLE_LENGTH = 200;

export interface ReadableParseResult {
  title: string;
  content: string;
}

export function parseReadableArticle(
  document: Document,
  options?: { charThreshold?: number },
): ReadableParseResult | null {
  const reader = new Readability(document.cloneNode(true) as Document, {
    charThreshold: options?.charThreshold ?? 100,
    keepClasses: false,
  });
  const article = reader.parse();
  if (!article?.content?.trim()) return null;

  return {
    title: (article.title || "").trim(),
    content: article.content,
  };
}

function removeBoilerplateParagraphs(root: Element): void {
  root.querySelectorAll("p").forEach((p) => {
    if (isBoilerplateParagraph(p.textContent ?? "")) {
      p.remove();
    }
  });
}

function restoreHeadingsFromSource(
  bodyRoot: Element,
  source: Element | null,
  isPromoHeading: (text: string) => boolean,
): void {
  if (!source) return;

  const headingTexts: [string, string][] = [];
  for (const level of ["h2", "h3", "h4"]) {
    source.querySelectorAll(level).forEach((heading) => {
      const text = normalizeText(heading.textContent ?? "");
      if (text && !isPromoHeading(text)) {
        headingTexts.push([level, text]);
      }
    });
  }

  for (const [level, text] of headingTexts) {
    bodyRoot.querySelectorAll("p").forEach((p) => {
      if (normalizeText(p.textContent ?? "") === text) {
        const replacement = p.ownerDocument.createElement(level);
        replacement.textContent = text;
        p.replaceWith(replacement);
      }
    });
  }
}

export function readableContentToHtml(
  content: string,
  sourceContainer: Element | null,
  isPromoHeading: (text: string) => boolean,
): string | null {
  const { document: bodyDoc } = parseHTML(
    `<!DOCTYPE html><html><body>${content}</body></html>`,
  );
  removeBoilerplateParagraphs(bodyDoc.body);
  restoreHeadingsFromSource(bodyDoc.body, sourceContainer, isPromoHeading);

  if (normalizeText(bodyDoc.body.textContent ?? "").length < MIN_ARTICLE_LENGTH) {
    return null;
  }

  return bodyDoc.body.innerHTML;
}
