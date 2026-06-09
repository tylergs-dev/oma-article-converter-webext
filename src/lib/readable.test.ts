import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseHTML } from "linkedom";
import { describe, expect, it } from "vitest";
import { isPromoHeading } from "./boilerplate";
import { parseReadableArticle, readableContentToHtml } from "./readable";

describe("parseReadableArticle", () => {
  it("extracts main article content without related feed sections", () => {
    const html = readFileSync(
      join(process.cwd(), "test/fixtures/morningstar-pr-newswire.html"),
      "utf8",
    );
    const { document } = parseHTML(html);
    const parsed = parseReadableArticle(document);

    expect(parsed?.title).toContain("California American Water");
    expect(parsed?.content).toMatch(/underground water main pipe project/i);
    expect(parsed?.content).not.toMatch(/Popular/i);
    expect(parsed?.content).not.toMatch(/Portfolio That Has Been Beating/i);
  });
});

describe("readableContentToHtml", () => {
  it("returns cleaned reader HTML when content is substantial", () => {
    const html = readFileSync(
      join(process.cwd(), "test/fixtures/morningstar-pr-newswire.html"),
      "utf8",
    );
    const { document } = parseHTML(html);
    const parsed = parseReadableArticle(document);
    expect(parsed).not.toBeNull();

    const body = readableContentToHtml(parsed!.content, null, isPromoHeading);
    expect(body).toMatch(/underground water main pipe project/i);
  });
});
