import { capturePageHtml } from "../lib/capture-page";
import { isBotPage } from "../lib/bot-detect";
import { ExtractError } from "../lib/errors";
import { extractArticle } from "../lib/extract";
import type { ConvertMessage, ConvertResponse, ConvertResult } from "../lib/types";
import { PREVIEW_STORAGE_KEY } from "../lib/types";
import { validateUrl } from "../lib/validate";

async function getTabUrl(tabId: number): Promise<string> {
  const tab = await chrome.tabs.get(tabId);
  if (!tab.url?.startsWith("http")) {
    throw new ExtractError(
      "Open a normal web page first (http or https), then click Convert.",
    );
  }
  return validateUrl(tab.url);
}

async function captureHtmlFromTab(tabId: number): Promise<string> {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: capturePageHtml,
  });
  if (!result?.result || typeof result.result !== "string") {
    throw new ExtractError("Could not read page content from the current tab.");
  }
  return result.result;
}

async function convertCurrentTab(tabId: number): Promise<ConvertResult> {
  const url = await getTabUrl(tabId);
  const html = await captureHtmlFromTab(tabId);

  if (isBotPage(html)) {
    throw new ExtractError(
      "This page looks like a security check. Wait for it to finish loading, then try again.",
    );
  }

  return extractArticle(url, html);
}

async function openPreview(result: ConvertResult): Promise<number> {
  await chrome.storage.session.set({ [PREVIEW_STORAGE_KEY]: result });
  const tab = await chrome.tabs.create({
    url: chrome.runtime.getURL("src/preview/preview.html"),
  });
  return tab.id ?? 0;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "Conversion failed";
}

chrome.runtime.onMessage.addListener((message: ConvertMessage, _sender, sendResponse) => {
  if (message.type === "convert") {
    convertCurrentTab(message.tabId)
      .then(async (result) => {
        const previewTabId = await openPreview(result);
        const response: ConvertResponse = { ok: true, previewTabId };
        sendResponse(response);
      })
      .catch((err) => {
        const response: ConvertResponse = { ok: false, error: errorMessage(err) };
        sendResponse(response);
      });
    return true;
  }

  return false;
});
