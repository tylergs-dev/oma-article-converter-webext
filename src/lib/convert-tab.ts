import { capturePageHtml } from "./capture-page";
import { isBotPage } from "./bot-detect";
import { ExtractError } from "./errors";
import { extractArticle } from "./extract";
import { extractArticleWithAi } from "./extract-ai";
import { PREVIEW_STORAGE_KEY, type ConvertResult } from "./types";
import { validateUrl } from "./validate";

export async function captureHtmlFromTab(tabId: number): Promise<string> {
  let injection: chrome.scripting.InjectionResult<string> | undefined;

  try {
    [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: capturePageHtml,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cannot access|cannot be scripted|extensions gallery/i.test(message)) {
      throw new ExtractError(
        "Cannot read this page. Open a normal article page and try again.",
      );
    }
    throw new ExtractError(`Could not read page content: ${message}`);
  }

  const html = injection?.result;
  if (!html || typeof html !== "string") {
    throw new ExtractError("Could not read page content from the current tab.");
  }

  return html;
}

async function captureValidatedHtml(tabId: number, url: string): Promise<{
  safeUrl: string;
  html: string;
}> {
  const safeUrl = validateUrl(url);
  const html = await captureHtmlFromTab(tabId);

  if (isBotPage(html)) {
    throw new ExtractError(
      "This page looks like a security check. Wait for it to finish loading, then try again.",
    );
  }

  return { safeUrl, html };
}

export async function convertTabToResult(tabId: number, url: string): Promise<ConvertResult> {
  const { safeUrl, html } = await captureValidatedHtml(tabId, url);
  return extractArticle(safeUrl, html);
}

export async function convertTabWithAiToResult(
  tabId: number,
  url: string,
): Promise<ConvertResult> {
  const { safeUrl, html } = await captureValidatedHtml(tabId, url);
  return extractArticleWithAi(safeUrl, html);
}

export async function openPreview(result: ConvertResult): Promise<void> {
  await chrome.storage.session.set({ [PREVIEW_STORAGE_KEY]: result });
  await chrome.tabs.create({
    url: chrome.runtime.getURL("src/preview/preview.html"),
  });
}

export async function convertAndOpenPreview(tabId: number, url: string): Promise<void> {
  const result = await convertTabToResult(tabId, url);
  await openPreview(result);
}

export async function convertTabWithAiAndOpenPreview(
  tabId: number,
  url: string,
): Promise<void> {
  const result = await convertTabWithAiToResult(tabId, url);
  await openPreview(result);
}
