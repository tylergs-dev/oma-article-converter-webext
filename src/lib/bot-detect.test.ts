import { describe, expect, it } from "vitest";
import { isBotPage } from "./bot-detect";

describe("isBotPage", () => {
  it("detects Cloudflare challenge markers", () => {
    const html = `<html><head><title>Just a moment...</title></head><body><div class="cf-browser-verification"></div></body></html>`;
    expect(isBotPage(html)).toBe(true);
  });

  it("detects access denied titles", () => {
    const html = `<html><head><title>Access Denied</title></head><body><p>Forbidden</p></body></html>`;
    expect(isBotPage(html)).toBe(true);
  });

  it("returns false for normal article HTML", () => {
    const html = `<html><head><title>News story</title></head><body><article>${"word ".repeat(80)}</article></body></html>`;
    expect(isBotPage(html)).toBe(false);
  });

  it("returns true for empty HTML", () => {
    expect(isBotPage("")).toBe(true);
    expect(isBotPage("   ")).toBe(true);
  });
});
