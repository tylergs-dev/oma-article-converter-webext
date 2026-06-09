import { EXTENSION_VERSION } from "../lib/version";

export function formatVersion(version = EXTENSION_VERSION): string {
  return `v${version}`;
}

export function applyVersionLabel(element: HTMLElement | null): void {
  if (!element) return;
  element.textContent = formatVersion();
}
