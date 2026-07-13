import {
  convertAndOpenPreview,
  convertTabWithAiAndOpenPreview,
} from "../lib/convert-tab";
import { ExtractError } from "../lib/errors";
import { createProgressController } from "../ui/progress";
import { applyVersionLabel } from "../ui/version";

const CONVERT_TIMEOUT_MS = 90_000;
const AI_CONVERT_TIMEOUT_MS = 120_000;

const form = document.getElementById("convert-form") as HTMLFormElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
const aiConvertBtn = document.getElementById("ai-convert-btn") as HTMLButtonElement;
const optionsLink = document.getElementById("options-link") as HTMLAnchorElement;
const pageTitleEl = document.getElementById("page-title") as HTMLParagraphElement;
const pageUrlEl = document.getElementById("page-url") as HTMLParagraphElement;
const errorEl = document.getElementById("error-message") as HTMLDivElement;
const progressEl = document.getElementById("conversion-progress") as HTMLDivElement;
const progressLabel = document.getElementById("progress-label") as HTMLSpanElement;
const progressPercent = document.getElementById("progress-percent") as HTMLSpanElement;
const progressFill = document.getElementById("progress-fill") as HTMLDivElement;

const progress = createProgressController({
  progressEl,
  progressLabel,
  progressPercent,
  progressFill,
  progressTrack: progressEl.querySelector('[role="progressbar"]'),
});

let canConvert = false;

function showError(message: string) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function setLoading(loading: boolean, mode: "local" | "ai" = "local") {
  form.classList.toggle("is-loading", loading);
  form.classList.toggle("is-ai-loading", loading && mode === "ai");
  submitBtn.disabled = loading || !canConvert;
  aiConvertBtn.disabled = loading || !canConvert;
}

function conversionErrorMessage(err: unknown): string {
  if (err instanceof ExtractError) return err.message;
  if (err instanceof Error && err.message === "Conversion timed out") {
    return "Conversion took too long. Try a shorter page or reload and try again.";
  }
  if (err instanceof Error) return err.message;
  return "Conversion failed. Try again.";
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function updatePageDisplay(tab: chrome.tabs.Tab | undefined): boolean {
  if (!tab?.id) {
    canConvert = false;
    pageTitleEl.textContent = "No active tab";
    pageUrlEl.textContent = "";
    submitBtn.disabled = true;
    aiConvertBtn.disabled = true;
    return false;
  }

  if (!tab.url?.startsWith("http")) {
    canConvert = false;
    pageTitleEl.textContent = tab.title?.trim() || "This page cannot be converted";
    pageUrlEl.textContent = tab.url ?? "";
    submitBtn.disabled = true;
    aiConvertBtn.disabled = true;
    showError("Open a normal web page (http or https), then try again.");
    return false;
  }

  canConvert = true;
  pageTitleEl.textContent = tab.title?.trim() || "Untitled page";
  pageUrlEl.textContent = tab.url;
  submitBtn.disabled = false;
  aiConvertBtn.disabled = false;
  return true;
}

async function loadCurrentPage() {
  const tab = await getActiveTab();
  if (updatePageDisplay(tab)) {
    showError("");
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("Conversion timed out")), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        window.clearTimeout(timer);
        reject(err);
      });
  });
}

async function runConversion(
  mode: "local" | "ai",
  convert: (tabId: number, url: string) => Promise<void>,
  timeoutMs: number,
) {
  showError("");

  const tab = await getActiveTab();
  if (!updatePageDisplay(tab) || !tab?.id || !tab.url) {
    if (!tab?.id) {
      showError("No active tab to convert.");
    }
    return;
  }

  setLoading(true, mode);
  progress.start();

  try {
    await withTimeout(convert(tab.id, tab.url), timeoutMs);
    await progress.finish();
    window.close();
  } catch (err) {
    progress.stop(true);
    showError(conversionErrorMessage(err));
  } finally {
    setLoading(false);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runConversion("local", convertAndOpenPreview, CONVERT_TIMEOUT_MS);
});

aiConvertBtn.addEventListener("click", async () => {
  await runConversion("ai", convertTabWithAiAndOpenPreview, AI_CONVERT_TIMEOUT_MS);
});

optionsLink.addEventListener("click", (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

applyVersionLabel(document.getElementById("app-version"));
loadCurrentPage();
