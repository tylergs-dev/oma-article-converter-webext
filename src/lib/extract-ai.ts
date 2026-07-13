import { ExtractError } from "./errors";
import { formatDate } from "./metadata";
import { requestAiArticleExtraction } from "./openrouter";
import { sanitizeHtml } from "./sanitize";
import { getOpenRouterApiKey } from "./settings";
import { trimHtmlForAi } from "./trim-html";
import type { ConvertResult } from "./types";

export async function extractArticleWithAi(
  url: string,
  html: string,
): Promise<ConvertResult> {
  const apiKey = await getOpenRouterApiKey();
  if (!apiKey) {
    throw new ExtractError(
      "Add your OpenRouter API key in Options to use AI conversion.",
    );
  }

  const trimmed = trimHtmlForAi(html);
  if (!trimmed) {
    throw new ExtractError("Could not prepare page HTML for AI conversion.");
  }

  const payload = await requestAiArticleExtraction({
    apiKey,
    html: trimmed,
    pageUrl: url,
  });

  const bodyHtml = sanitizeHtml(payload.html);
  if (!bodyHtml) {
    throw new ExtractError("AI conversion did not produce usable article content.");
  }

  return {
    title: payload.title,
    author: payload.author,
    source: payload.source,
    date: formatDate(payload.date) ?? payload.date,
    html: bodyHtml,
  };
}
