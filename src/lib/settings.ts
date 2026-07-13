export const OPENROUTER_API_KEY_STORAGE = "openRouterApiKey";

export async function getOpenRouterApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(OPENROUTER_API_KEY_STORAGE);
  const value = result[OPENROUTER_API_KEY_STORAGE];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

export async function setOpenRouterApiKey(key: string): Promise<void> {
  const trimmed = key.trim();
  if (!trimmed) {
    await clearOpenRouterApiKey();
    return;
  }
  await chrome.storage.local.set({ [OPENROUTER_API_KEY_STORAGE]: trimmed });
}

export async function clearOpenRouterApiKey(): Promise<void> {
  await chrome.storage.local.remove(OPENROUTER_API_KEY_STORAGE);
}
