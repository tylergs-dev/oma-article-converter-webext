import { describe, expect, it } from "vitest";
import { isBotPage, shouldUseJinaFallback } from "./bot-detect";

describe("isBotPage", () => {
  it("detects Cloudflare challenge markers", () => {
    const html = `<html><body><div class="cf-browser-verification">Checking your browser</div></body></html>`;
    expect(isBotPage(html)).toBe(true);
  });

  it("detects challenge titles", () => {
    const html = `<html><head><title>Just a moment...</title></head><body></body></html>`;
    expect(isBotPage(html)).toBe(true);
  });

  it("allows normal article HTML", () => {
    const html = `<html><head><title>Market update</title></head><body><article><p>${"Lorem ipsum dolor sit amet. ".repeat(20)}</p></article></body></html>`;
    expect(isBotPage(html)).toBe(false);
  });

  it("treats empty HTML as a bot page", () => {
    expect(isBotPage("")).toBe(true);
    expect(isBotPage("   ")).toBe(true);
  });
});

describe("shouldUseJinaFallback", () => {
  it("returns false when fallback is disabled", () => {
    expect(shouldUseJinaFallback(false, 403, "<html></html>")).toBe(false);
  });

  it("returns true for blocked status codes when enabled", () => {
    expect(shouldUseJinaFallback(true, 403, null)).toBe(true);
    expect(shouldUseJinaFallback(true, 429, null)).toBe(true);
  });

  it("returns true for bot pages when enabled", () => {
    const html = `<html><head><title>Access denied</title></head></html>`;
    expect(shouldUseJinaFallback(true, 200, html)).toBe(true);
  });

  it("returns false for successful normal pages", () => {
    const html = `<html><head><title>Article</title></head><body><p>${"content ".repeat(50)}</p></body></html>`;
    expect(shouldUseJinaFallback(true, 200, html)).toBe(false);
  });
});
