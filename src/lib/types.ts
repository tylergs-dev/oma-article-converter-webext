export interface ConvertResult {
  title: string;
  author: string | null;
  source: string | null;
  date: string | null;
  html: string;
}

export type ConvertMessage = { type: "convert"; tabId: number };

export type ConvertResponse =
  | { ok: true; previewTabId: number }
  | { ok: false; error: string };

export const PREVIEW_STORAGE_KEY = "lastPreview";
