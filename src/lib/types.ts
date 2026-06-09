export interface ConvertResult {
  title: string;
  author: string | null;
  source: string | null;
  date: string | null;
  html: string;
}

export const PREVIEW_STORAGE_KEY = "lastPreview";
