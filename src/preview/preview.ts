import { buildEditedResult } from "../lib/preview-edit";
import type { ConvertResult } from "../lib/types";
import { PREVIEW_STORAGE_KEY } from "../lib/types";
import { applyVersionLabel } from "../ui/version";

const labelTextEl = document.getElementById("preview-label-text") as HTMLSpanElement;
const hintEl = document.getElementById("preview-hint") as HTMLParagraphElement;
const articleEl = document.getElementById("print-article") as HTMLElement;
const titleEl = document.getElementById("print-title") as HTMLHeadingElement;
const metaEl = document.getElementById("print-meta") as HTMLParagraphElement;
const bodyEl = document.getElementById("print-body") as HTMLDivElement;
const errorEl = document.getElementById("error-message") as HTMLDivElement;
const editBtn = document.getElementById("edit-btn") as HTMLButtonElement;
const doneBtn = document.getElementById("done-btn") as HTMLButtonElement;
const resetBtn = document.getElementById("reset-btn") as HTMLButtonElement;
const printBtn = document.getElementById("print-btn") as HTMLButtonElement;
const closeBtn = document.getElementById("close-btn") as HTMLButtonElement;

let currentResult: ConvertResult | null = null;
let originalResult: ConvertResult | null = null;
let isEditing = false;
let isDirty = false;

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

function setEditMode(editing: boolean) {
  isEditing = editing;
  titleEl.contentEditable = String(editing);
  bodyEl.contentEditable = String(editing);
  articleEl.classList.toggle("print-article--editing", editing);

  labelTextEl.textContent = editing ? "Editing" : "Preview";
  hintEl.hidden = !editing;
  editBtn.hidden = editing;
  doneBtn.hidden = !editing;
  resetBtn.hidden = !editing;

  if (editing) {
    bodyEl.focus();
  }
}

function enterEditMode() {
  if (!currentResult) return;
  setEditMode(true);
}

async function persistResult(result: ConvertResult): Promise<void> {
  await chrome.storage.session.set({ [PREVIEW_STORAGE_KEY]: result });
}

async function saveEdits(): Promise<boolean> {
  if (!currentResult) return false;

  const { result, error } = buildEditedResult(
    currentResult,
    titleEl.textContent ?? "",
    bodyEl.innerHTML,
  );

  if (error) {
    showError(error);
    return false;
  }

  showError("");
  currentResult = result;
  renderPreview(result);
  await persistResult(result);
  isDirty = false;
  return true;
}

async function exitEditMode(): Promise<boolean> {
  if (!isEditing) return true;

  const saved = await saveEdits();
  if (!saved) return false;

  setEditMode(false);
  return true;
}

function resetEdits() {
  if (!originalResult) return;

  showError("");
  renderPreview(originalResult);
  isDirty = true;
}

async function handlePrint() {
  if (isEditing || isDirty) {
    const saved = await exitEditMode();
    if (!saved) return;
  }

  window.print();
}

async function loadPreview() {
  const stored = await chrome.storage.session.get(PREVIEW_STORAGE_KEY);
  const result = stored[PREVIEW_STORAGE_KEY] as ConvertResult | undefined;

  if (!result?.html) {
    showError("No preview data found. Convert an article from the extension popup.");
    editBtn.disabled = true;
    printBtn.disabled = true;
    return;
  }

  currentResult = result;
  originalResult = { ...result, html: result.html };
  renderPreview(result);
}

function markDirty() {
  if (isEditing) {
    isDirty = true;
  }
}

editBtn.addEventListener("click", enterEditMode);
doneBtn.addEventListener("click", () => void exitEditMode());
resetBtn.addEventListener("click", resetEdits);
printBtn.addEventListener("click", () => void handlePrint());
closeBtn.addEventListener("click", () => window.close());
titleEl.addEventListener("input", markDirty);
bodyEl.addEventListener("input", markDirty);

applyVersionLabel(document.getElementById("app-version"));
loadPreview();
