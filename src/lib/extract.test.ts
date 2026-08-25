import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractArticle } from "./extract";

const morningstarUrl =
  "https://www.morningstar.com/news/pr-newswire/20260609la79987/major-california-american-water-infrastructure-investment-is-completed-in-carmel-by-the-sea";

const kiplingerUrl = "https://www.kiplinger.com/taxes/trump-tax-bill-summary";

const morningstarOvervaluedUrl =
  "https://www.morningstar.com/stocks/11-newly-overvalued-stocks-this-week";

describe("extractArticle", () => {
  it("keeps Morningstar glossary terms in a single paragraph", () => {
    const html = readFileSync(
      join(process.cwd(), "test/fixtures/morningstar-overvalued-stocks.html"),
      "utf8",
    );
    const result = extractArticle(morningstarOvervaluedUrl, html);

    expect(result.title).toContain("Overvalued Stocks");
    expect(result.html).toMatch(
      /Once a week,[\s\S]*?Morningstar Ratings[\s\S]*?1-star territory\.<\/p>/i,
    );
    expect(result.html).not.toMatch(
      /<p>\s*<span>Morningstar Ratings<\/span>\s*<\/p>/i,
    );
    expect(result.html).toMatch(
      /fair value estimate[\s\S]*?Uncertainty Rating[\s\S]*?considered overvalued\./i,
    );
  });

  it("extracts Morningstar PR Newswire article without related headlines, images, or links", () => {
    const html = readFileSync(
      join(process.cwd(), "test/fixtures/morningstar-pr-newswire.html"),
      "utf8",
    );
    const result = extractArticle(morningstarUrl, html);

    expect(result.title).toContain("California American Water");
    expect(result.html).not.toMatch(/<img/i);
    expect(result.html).not.toMatch(/<a\b/i);
    expect(result.html).not.toMatch(/Popular/i);
    expect(result.html).not.toMatch(/Portfolio That Has Been Beating/i);
    expect(result.html).not.toMatch(/View original content/i);
    expect(result.html).not.toMatch(/SOURCE American Water/i);
    expect(result.html).not.toMatch(/third-party content is offered for informational purposes/i);
    expect(result.html).not.toMatch(/<h2>Major California American Water/i);
    expect(result.html).toMatch(/\/PRNewswire\/ --/i);
    expect(result.html).toMatch(/underground water main pipe project/i);
    expect(result.html).toMatch(/About American Water/i);
  });

  it("extracts Kiplinger article with author name and without subscribe promos", () => {
    const html = readFileSync(
      join(process.cwd(), "test/fixtures/kiplinger-trump-tax.html"),
      "utf8",
    );
    const result = extractArticle(kiplingerUrl, html);

    expect(result.title).toContain("Trump Tax Bill");
    expect(result.author).toBe("Kelley R. Taylor");
    expect(result.author).not.toMatch(/^https?:\/\//);
    expect(result.html).not.toMatch(/<a\b/i);
    expect(result.html).not.toMatch(/free issue/i);
    expect(result.html).not.toMatch(/from just/i);
    expect(result.html).not.toMatch(/sign up for kiplinger/i);
    expect(result.html).not.toMatch(/ad-unit/i);
    expect(result.html).not.toMatch(/Sponsored by Kiplinger/i);
    expect(result.html).toMatch(/budget reconciliation process/i);
  });
});
