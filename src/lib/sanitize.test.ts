import { describe, expect, it } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("keeps allowed article markup", () => {
    const html = "<p>Hello <strong>world</strong></p><h2>Section</h2>";
    const result = sanitizeHtml(html);
    expect(result).toContain("<p>");
    expect(result).toContain("<strong>world</strong>");
    expect(result).toContain("<h2>Section</h2>");
  });

  it("removes scripts and images", () => {
    const html = '<p>Text</p><script>alert("x")</script><img src="x.png" alt="photo">';
    const result = sanitizeHtml(html);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("<img");
    expect(result).toContain("Text");
  });

  it("strips unsafe attributes but keeps href on links", () => {
    const html = '<p onclick="evil()">Read <a href="https://example.com" target="_blank">more</a></p>';
    const result = sanitizeHtml(html);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("target");
    expect(result).toContain('href="https://example.com"');
  });

  it("returns empty string for blank or text-only junk", () => {
    expect(sanitizeHtml("")).toBe("");
    expect(sanitizeHtml("   ")).toBe("");
    expect(sanitizeHtml("<div></div>")).toBe("");
  });
});
