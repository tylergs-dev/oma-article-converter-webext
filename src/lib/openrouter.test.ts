import { describe, expect, it, vi } from "vitest";
import { ExtractError } from "./errors";
import {
  OPENROUTER_API_URL,
  OPENROUTER_MODEL,
  parseAiArticleResponse,
  requestAiArticleExtraction,
} from "./openrouter";

describe("parseAiArticleResponse", () => {
  it("parses a plain JSON object", () => {
    const payload = parseAiArticleResponse(
      JSON.stringify({
        title: "Test Title",
        author: "Jane Doe",
        source: "Example News",
        date: "July 13, 2026",
        html: "<p>Hello world</p>",
      }),
    );

    expect(payload).toEqual({
      title: "Test Title",
      author: "Jane Doe",
      source: "Example News",
      date: "July 13, 2026",
      html: "<p>Hello world</p>",
    });
  });

  it("parses JSON inside markdown fences", () => {
    const payload = parseAiArticleResponse(`\`\`\`json
{"title":"Fenced","author":null,"source":null,"date":null,"html":"<p>Body</p>"}
\`\`\``);

    expect(payload.title).toBe("Fenced");
    expect(payload.author).toBeNull();
    expect(payload.html).toBe("<p>Body</p>");
  });

  it("extracts the first JSON object from surrounding text", () => {
    const payload = parseAiArticleResponse(
      'Here you go:\n{"title":"Wrapped","author":null,"source":null,"date":null,"html":"<p>Ok</p>"}\nThanks',
    );
    expect(payload.title).toBe("Wrapped");
  });

  it("rejects missing title or html", () => {
    expect(() =>
      parseAiArticleResponse(
        JSON.stringify({ title: "", author: null, source: null, date: null, html: "<p>x</p>" }),
      ),
    ).toThrow(ExtractError);

    expect(() =>
      parseAiArticleResponse(
        JSON.stringify({ title: "T", author: null, source: null, date: null, html: "" }),
      ),
    ).toThrow(ExtractError);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseAiArticleResponse("not json")).toThrow(ExtractError);
  });
});

describe("requestAiArticleExtraction", () => {
  it("posts to OpenRouter and parses the model content", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: "From API",
                  author: null,
                  source: "Site",
                  date: null,
                  html: "<p>Article</p>",
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const result = await requestAiArticleExtraction({
      apiKey: "test-key",
      html: "<p>raw</p>",
      pageUrl: "https://example.com/a",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result.title).toBe("From API");
    expect(result.html).toBe("<p>Article</p>");

    expect(fetchImpl).toHaveBeenCalledOnce();
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    const [url, init] = call;
    expect(url).toBe(OPENROUTER_API_URL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(OPENROUTER_MODEL);
    expect(body.messages[1].content).toContain("https://example.com/a");
    expect(body.messages[1].content).toContain("<p>raw</p>");
  });

  it("maps 401 to an invalid-key error", async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ error: { message: "Unauthorized" } }), { status: 401 }),
    );

    await expect(
      requestAiArticleExtraction({
        apiKey: "bad",
        html: "<p>x</p>",
        pageUrl: "https://example.com",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/invalid/i);
  });

  it("maps 429 to a rate-limit error", async () => {
    const fetchImpl = vi.fn(async () => new Response("rate limited", { status: 429 }));

    await expect(
      requestAiArticleExtraction({
        apiKey: "key",
        html: "<p>x</p>",
        pageUrl: "https://example.com",
        fetchImpl: fetchImpl as unknown as typeof fetch,
      }),
    ).rejects.toThrow(/rate limit/i);
  });
});
