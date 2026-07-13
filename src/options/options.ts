import {
  clearOpenRouterApiKey,
  getOpenRouterApiKey,
  setOpenRouterApiKey,
} from "../lib/settings";

const form = document.getElementById("settings-form") as HTMLFormElement;
const keyInput = document.getElementById("openrouter-key") as HTMLInputElement;
const clearBtn = document.getElementById("clear-btn") as HTMLButtonElement;
const statusEl = document.getElementById("settings-status") as HTMLParagraphElement;

function showStatus(message: string) {
  statusEl.textContent = message;
  statusEl.hidden = !message;
}

async function loadKey() {
  const key = await getOpenRouterApiKey();
  keyInput.value = key ?? "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await setOpenRouterApiKey(keyInput.value);
  const saved = await getOpenRouterApiKey();
  showStatus(saved ? "API key saved." : "API key cleared.");
});

clearBtn.addEventListener("click", async () => {
  await clearOpenRouterApiKey();
  keyInput.value = "";
  showStatus("API key cleared.");
});

loadKey();
