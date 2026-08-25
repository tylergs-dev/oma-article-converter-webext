import { sanitizeHtml } from "./sanitize";
import type { ConvertResult } from "./types";

export type EditedResult = {
  result: ConvertResult;
  error?: string;
};

export function buildEditedResult(
  base: ConvertResult,
  titleText: string,
  bodyHtml: string,
): EditedResult {
  const sanitized = sanitizeHtml(bodyHtml);
  if (!sanitized) {
    return {
      result: base,
      error: "Could not save: article body cannot be empty.",
    };
  }

  return {
    result: {
      ...base,
      title: titleText.trim() || base.title,
      html: sanitized,
    },
  };
}
