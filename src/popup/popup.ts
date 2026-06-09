import { createProgressController } from "../ui/progress";
import type { ConvertMessage, ConvertResponse } from "../lib/types";

const form = document.getElementById("convert-form") as HTMLFormElement;
const submitBtn = document.getElementById("submit-btn") as HTMLButtonElement;
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

function setLoading(loading: boolean) {
  form.classList.toggle("is-loading", loading);
  submitBtn.disabled = loading || !canConvert;
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
    return false;
  }

  if (!tab.url?.startsWith("http")) {
    canConvert = false;
    pageTitleEl.textContent = tab.title?.trim() || "This page cannot be converted";
    pageUrlEl.textContent = tab.url ?? "";
    submitBtn.disabled = true;
    showError("Open a normal web page (http or https), then try again.");
    return false;
  }

  canConvert = true;
  pageTitleEl.textContent = tab.title?.trim() || "Untitled page";
  pageUrlEl.textContent = tab.url;
  submitBtn.disabled = false;
  return true;
}

async function loadCurrentPage() {
  const tab = await getActiveTab();
  if (updatePageDisplay(tab)) {
    showError("");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError("");

  const tab = await getActiveTab();
  if (!updatePageDisplay(tab)) {
    if (tab?.id) {
      return;
    }
    showError("No active tab to convert.");
    return;
  }

  setLoading(true);
  progress.start();

  try {
    const message: ConvertMessage = { type: "convert", tabId: tab!.id! };
    const response = (await chrome.runtime.sendMessage(message)) as ConvertResponse | undefined;

    if (!response) {
      progress.stop(true);
      showError("No response from extension background.");
      return;
    }

    if (!response.ok) {
      progress.stop(true);
      showError(response.error);
      return;
    }

    await progress.finish();
    window.close();
  } catch {
    progress.stop(true);
    showError("Conversion failed. Try again.");
  } finally {
    setLoading(false);
  }
});

loadCurrentPage();
