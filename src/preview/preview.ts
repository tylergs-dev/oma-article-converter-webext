import type { ConvertResult } from "../lib/types";
import { PREVIEW_STORAGE_KEY } from "../lib/types";

const titleEl = document.getElementById("print-title") as HTMLHeadingElement;
const metaEl = document.getElementById("print-meta") as HTMLParagraphElement;
const bodyEl = document.getElementById("print-body") as HTMLDivElement;
const errorEl = document.getElementById("error-message") as HTMLDivElement;
const printBtn = document.getElementById("print-btn") as HTMLButtonElement;
const closeBtn = document.getElementById("close-btn") as HTMLButtonElement;

function formatMeta(author: string | null, source: string | null, date: string | null): string {
  return [author, source, date].filter(Boolean).join(" · ");
}

function showError(message: string) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function renderPreview(result: ConvertResult) {
  titleEl.textContent = result.title;
  metaEl.textContent = formatMeta(result.author, result.source, result.date);
  bodyEl.innerHTML = result.html;
  document.title = result.title;
}

async function loadPreview() {
  const stored = await chrome.storage.session.get(PREVIEW_STORAGE_KEY);
  const result = stored[PREVIEW_STORAGE_KEY] as ConvertResult | undefined;

  if (!result?.html) {
    showError("No preview data found. Convert an article from the extension popup.");
    return;
  }

  renderPreview(result);
}

printBtn.addEventListener("click", () => window.print());
closeBtn.addEventListener("click", () => window.close());

loadPreview();
