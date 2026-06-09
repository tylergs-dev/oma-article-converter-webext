import { describe, expect, it } from "vitest";
import {
  isBoilerplateParagraph,
  isPromoHeading,
  normalizeText,
} from "./boilerplate";

describe("normalizeText", () => {
  it("collapses whitespace and trims", () => {
    expect(normalizeText("  hello   world  ")).toBe("hello world");
  });

  it("returns empty string for blank input", () => {
    expect(normalizeText("   ")).toBe("");
    expect(normalizeText("")).toBe("");
  });
});

describe("isBoilerplateParagraph", () => {
  it("flags newsletter signup copy", () => {
    expect(isBoilerplateParagraph("You are now subscribed.")).toBe(true);
    expect(isBoilerplateParagraph("Sign up.")).toBe(true);
  });

  it("flags social share boilerplate", () => {
    expect(isBoilerplateParagraph("Share this article")).toBe(true);
    expect(isBoilerplateParagraph("Copy link")).toBe(true);
  });

  it("allows normal article paragraphs", () => {
    expect(
      isBoilerplateParagraph(
        "The Federal Reserve held rates steady amid mixed inflation signals.",
      ),
    ).toBe(false);
  });

  it("treats empty text as boilerplate", () => {
    expect(isBoilerplateParagraph("")).toBe(true);
  });
});

describe("isPromoHeading", () => {
  it("flags promo section headings", () => {
    expect(isPromoHeading("Related content")).toBe(true);
    expect(isPromoHeading("Sign up for Kiplinger")).toBe(true);
    expect(isPromoHeading("Disclaimer")).toBe(true);
  });

  it("allows substantive headings", () => {
    expect(isPromoHeading("What investors should watch next")).toBe(false);
  });

  it("treats empty text as promo", () => {
    expect(isPromoHeading("")).toBe(true);
  });
});
