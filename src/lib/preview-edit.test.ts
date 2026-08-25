import { describe, expect, it } from "vitest";
import { buildEditedResult } from "./preview-edit";
import type { ConvertResult } from "./types";

const base: ConvertResult = {
  title: "Original Title",
  author: "Jane Doe",
  source: "Example News",
  date: "2026-01-15",
  html: "<p>Original body</p>",
};

describe("buildEditedResult", () => {
  it("trims title and preserves metadata from base", () => {
    const { result, error } = buildEditedResult(
      base,
      "  Updated Title  ",
      "<p>Updated body</p>",
    );

    expect(error).toBeUndefined();
    expect(result.title).toBe("Updated Title");
    expect(result.author).toBe("Jane Doe");
    expect(result.source).toBe("Example News");
    expect(result.date).toBe("2026-01-15");
    expect(result.html).toContain("Updated body");
  });

  it("falls back to base title when edited title is blank", () => {
    const { result } = buildEditedResult(base, "   ", "<p>Body</p>");
    expect(result.title).toBe("Original Title");
  });

  it("sanitizes body and strips disallowed tags", () => {
    const { result } = buildEditedResult(
      base,
      "Title",
      '<p>Text</p><script>alert("x")</script><img src="x.png">',
    );

    expect(result.html).not.toContain("<script");
    expect(result.html).not.toContain("<img");
    expect(result.html).toContain("Text");
  });

  it("returns error and keeps base html when body sanitizes to empty", () => {
    const { result, error } = buildEditedResult(base, "Title", "<div></div>");

    expect(error).toBe("Could not save: article body cannot be empty.");
    expect(result.html).toBe("<p>Original body</p>");
    expect(result.title).toBe("Original Title");
  });
});
