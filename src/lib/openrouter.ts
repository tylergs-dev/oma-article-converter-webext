import { ExtractError } from "./errors";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_MODEL = "openrouter/free";

export interface AiArticlePayload {
  title: string;
  author: string | null;
  source: string | null;
  date: string | null;
  html: string;
}

const SYSTEM_PROMPT = `You extract the core article from raw HTML for a clean print layout.

Return ONLY a JSON object with this exact shape:
{
  "title": string,
  "author": string | null,
  "source": string | null,
  "date": string | null,
  "html": string
}

Rules for "html":
- Include only the article body: h2, h3, h4, p, ul, ol, li, blockquote, strong, em, br when needed.
- Do not include images, links, scripts, ads, banners, promo/newsletter text, related articles, share bars, author bios, navigation, footers, or comments.
- Preserve original wording; do not summarize or rewrite.
- Prefer readable paragraph and heading structure.

Rules for metadata:
- title: main article headline
- author: byline author name if present, else null
- source: publication / site name if present, else null
- date: publication date as readable text if present, else null

Output JSON only. No markdown fences or commentary.`;

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

/**
 * Parse model output into an article payload. Exported for unit tests.
 */
export function parseAiArticleResponse(content: string): AiArticlePayload {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new ExtractError("AI conversion returned empty content.");
  }

  let jsonText = trimmed;
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  } else {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      jsonText = trimmed.slice(start, end + 1);
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new ExtractError("AI conversion returned invalid JSON. Try again.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ExtractError("AI conversion returned an unexpected response.");
  }

  const record = parsed as Record<string, unknown>;
  const title = typeof record.title === "string" ? record.title.trim() : "";
  const html = typeof record.html === "string" ? record.html.trim() : "";

  if (!title) {
    throw new ExtractError("AI conversion did not return an article title.");
  }
  if (!html) {
    throw new ExtractError("AI conversion did not return article content.");
  }

  return {
    title,
    author: asNullableString(record.author),
    source: asNullableString(record.source),
    date: asNullableString(record.date),
    html,
  };
}

interface OpenRouterChoice {
  message?: { content?: string | null };
}

interface OpenRouterErrorBody {
  error?: { message?: string };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: { message?: string };
}

export async function requestAiArticleExtraction(options: {
  apiKey: string;
  html: string;
  pageUrl: string;
  fetchImpl?: typeof fetch;
}): Promise<AiArticlePayload> {
  const fetchImpl = options.fetchImpl ?? fetch;

  let response: Response;
  try {
    response = await fetchImpl(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "chrome-extension://article-to-print",
        "X-Title": "Article to Print",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Page URL: ${options.pageUrl}\n\nHTML:\n${options.html}`,
          },
        ],
      }),
    });
  } catch {
    throw new ExtractError(
      "Could not reach OpenRouter. Check your network connection and try again.",
    );
  }

  const rawText = await response.text();
  let body: OpenRouterResponse & OpenRouterErrorBody = {};
  try {
    body = rawText ? (JSON.parse(rawText) as OpenRouterResponse) : {};
  } catch {
    // keep empty body
  }

  if (response.status === 401) {
    throw new ExtractError(
      "OpenRouter API key is invalid. Update it in Options and try again.",
    );
  }

  if (response.status === 429) {
    throw new ExtractError(
      "OpenRouter rate limit reached. Wait a bit, then try AI conversion again.",
    );
  }

  if (!response.ok) {
    const apiMessage =
      body.error?.message ||
      (body as OpenRouterErrorBody).error?.message ||
      rawText.slice(0, 200);
    throw new ExtractError(
      apiMessage
        ? `OpenRouter request failed: ${apiMessage}`
        : `OpenRouter request failed (${response.status}).`,
    );
  }

  const content = body.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new ExtractError("AI conversion returned no content. Try again.");
  }

  return parseAiArticleResponse(content);
}
