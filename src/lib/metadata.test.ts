import { describe, expect, it } from "vitest";
import { domainFromUrl, fallbackMetadata, formatDate } from "./metadata";

describe("domainFromUrl", () => {
  it("strips www prefix", () => {
    expect(domainFromUrl("https://www.example.com/path")).toBe("example.com");
  });

  it("returns hostname for bare domains", () => {
    expect(domainFromUrl("https://news.site/article")).toBe("news.site");
  });

  it("returns empty string for invalid URLs", () => {
    expect(domainFromUrl("not-a-url")).toBe("");
  });
});

describe("formatDate", () => {
  it("formats ISO dates", () => {
    expect(formatDate("2024-03-15")).toMatch(/March 15, 2024/);
  });

  it("returns null for missing values", () => {
    expect(formatDate(null)).toBeNull();
    expect(formatDate(undefined)).toBeNull();
    expect(formatDate("")).toBeNull();
  });

  it("passes through unparseable strings", () => {
    expect(formatDate("Spring 2024")).toBe("Spring 2024");
  });
});

describe("fallbackMetadata", () => {
  it("reads Open Graph and article meta tags", () => {
    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Fallback title</title>
          <meta property="og:title" content="OG Title" />
          <meta name="author" content="Jane Doe" />
          <meta property="og:site_name" content="Example News" />
          <meta property="article:published_time" content="2024-01-10" />
        </head>
        <body></body>
      </html>`;

    const meta = fallbackMetadata(html, "https://www.example.com/story");

    expect(meta.title).toBe("OG Title");
    expect(meta.author).toBe("Jane Doe");
    expect(meta.source).toBe("Example News");
    expect(meta.date).toBe("2024-01-10");
  });

  it("falls back to title tag and domain", () => {
    const html = `<!DOCTYPE html><html><head><title>Page title</title></head><body></body></html>`;
    const meta = fallbackMetadata(html, "https://news.example.org/post");

    expect(meta.title).toBe("Page title");
    expect(meta.source).toBe("news.example.org");
  });

  it("extracts JSON-LD article metadata", () => {
    const html = `<!DOCTYPE html>
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@type": "NewsArticle",
              "headline": "JSON-LD headline",
              "author": { "name": "Alex Writer" },
              "datePublished": "2023-12-01"
            }
          </script>
        </head>
        <body></body>
      </html>`;

    const meta = fallbackMetadata(html, "https://example.com/a");

    expect(meta.title).toBe("JSON-LD headline");
    expect(meta.author).toBe("Alex Writer");
    expect(meta.date).toBe("2023-12-01");
  });

  it("ignores URL-only article:author meta and prefers named author sources", () => {
    const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta property="article:author" content="https://www.kiplinger.com/author/kelley-r-taylor" />
          <meta property="mrf:authors" content="Kelley R. Taylor" />
          <script type="application/ld+json">
            {
              "@type": "NewsArticle",
              "author": { "name": "JSON-LD Author" }
            }
          </script>
        </head>
        <body></body>
      </html>`;

    const meta = fallbackMetadata(html, "https://www.kiplinger.com/story");

    expect(meta.author).toBe("Kelley R. Taylor");
  });
});
