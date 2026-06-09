import { getSettings, saveSettings } from "../lib/settings";

const form = document.getElementById("options-form") as HTMLFormElement;
const apiKeyInput = document.getElementById("jina-api-key") as HTMLInputElement;
const fallbackCheckbox = document.getElementById("jina-fallback") as HTMLInputElement;
const statusEl = document.getElementById("options-status") as HTMLParagraphElement;

async function loadSettings() {
  const settings = await getSettings();
  apiKeyInput.value = settings.jinaApiKey;
  fallbackCheckbox.checked = settings.jinaFallbackEnabled;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await saveSettings({
    jinaApiKey: apiKeyInput.value.trim(),
    jinaFallbackEnabled: fallbackCheckbox.checked,
  });

  statusEl.textContent = "Settings saved.";
  statusEl.hidden = false;
  window.setTimeout(() => {
    statusEl.hidden = true;
  }, 2500);
});

loadSettings();
