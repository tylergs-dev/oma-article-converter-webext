import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { TRIM_HTML_MAX_CHARS, trimHtmlForAi } from "./trim-html";

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), "../../test/fixtures");

describe("trimHtmlForAi", () => {
  it("strips scripts, styles, and images", () => {
    const html = `
      <html><body>
        <article class="article-body">
          <script>alert(1)</script>
          <style>.x{color:red}</style>
          <img src="ad.png" alt="ad" />
          <p>${"Article paragraph. ".repeat(40)}</p>
          <p>Second paragraph with enough text for extraction.</p>
        </article>
      </body></html>
    `;

    const trimmed = trimHtmlForAi(html);
    expect(trimmed).not.toMatch(/<script/i);
    expect(trimmed).not.toMatch(/<style/i);
    expect(trimmed).not.toMatch(/<img/i);
    expect(trimmed).toContain("Article paragraph");
    expect(trimmed).toContain("Second paragraph");
  });

  it("prefers article container over full page chrome", () => {
    const html = `
      <html><body>
        <nav>Home About Subscribe Newsletter</nav>
        <div class="article-body">
          <p>${"Core article content goes here. ".repeat(30)}</p>
          <p>More core article content for the printer friendly view.</p>
        </div>
        <aside>Related ads and promos</aside>
      </body></html>
    `;

    const trimmed = trimHtmlForAi(html);
    expect(trimmed).toContain("Core article content");
    expect(trimmed).not.toContain("Home About Subscribe");
    expect(trimmed).not.toContain("Related ads and promos");
  });

  it("caps output length", () => {
    const huge = `<html><body><article class="article-body"><p>${"x".repeat(200_000)}</p></article></body></html>`;
    const trimmed = trimHtmlForAi(huge, 5_000);
    expect(trimmed.length).toBeLessThanOrEqual(5_000 + 30);
    expect(trimmed).toContain("<!-- truncated -->");
  });

  it("keeps fixture HTML under the default budget after trim", () => {
    const fixture = readFileSync(join(fixturesDir, "kiplinger-trump-tax.html"), "utf8");
    const trimmed = trimHtmlForAi(fixture);
    expect(trimmed.length).toBeLessThanOrEqual(TRIM_HTML_MAX_CHARS + 30);
    expect(trimmed.length).toBeGreaterThan(400);
  });

  it("returns empty string for blank input", () => {
    expect(trimHtmlForAi("")).toBe("");
    expect(trimHtmlForAi("   ")).toBe("");
  });
});
