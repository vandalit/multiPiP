const stateKey = "multiPipSpikeState";
const emptyState = { ownerTabId: null, secondTabId: null };
let spikeState = emptyState;
let stateVersion = 0;

void chrome.storage.session.get(stateKey).then((stored) => {
  if (stateVersion === 0) {
    spikeState = stored[stateKey] ?? emptyState;
  }
}).catch((error) => {
  console.error("Multi PiP: no se pudo restaurar el estado del spike.", error);
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) {
    console.error("Multi PiP: no se pudo identificar la pestaña activa.");
    return;
  }
  handleActionClick(tab.id);
});

chrome.runtime.onMessage.addListener((message, sender) => {
  void handleMessage(message, sender).catch((error) => {
    console.error("Multi PiP: error procesando un mensaje.", error);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void handleTabRemoved(tabId);
});

function handleActionClick(tabId) {
  if (spikeState.ownerTabId === null) {
    updateState({ ownerTabId: tabId, secondTabId: null });
    injectImmediately(tabId, "spike/video-monitor.js");
    return;
  }

  if (tabId === spikeState.ownerTabId) {
    sendToTab(spikeState.ownerTabId, { type: "TOGGLE_SLOT", slot: 1 });
    return;
  }

  if (tabId === spikeState.secondTabId) {
    sendToTab(spikeState.ownerTabId, { type: "TOGGLE_SLOT", slot: 2 });
    return;
  }

  if (spikeState.secondTabId !== null) {
    void showResult(tabId, false, "El spike admite solo dos slots.");
    return;
  }

  updateState({ ...spikeState, secondTabId: tabId });
  injectImmediately(tabId, "spike/secondary-source.js");
}

async function handleMessage(message, sender) {
  const senderTabId = sender.tab?.id;

  switch (message?.type) {
    case "OWNER_READY":
      if (senderTabId !== spikeState.ownerTabId) return;
      await showResult(senderTabId, true, "Monitor de dos slots iniciado.");
      break;
    case "OWNER_FAILED":
      if (senderTabId !== spikeState.ownerTabId) return;
      updateState(emptyState);
      await showResult(senderTabId, false, message.message);
      break;
    case "OWNER_CLOSED":
      if (senderTabId !== spikeState.ownerTabId) return;
      stopSecondary(spikeState.secondTabId);
      updateState(emptyState);
      break;
    case "SOURCE_OFFER":
      if (senderTabId !== spikeState.secondTabId || spikeState.ownerTabId === null) return;
      sendToTab(spikeState.ownerTabId, {
        type: "SOURCE_OFFER",
        offer: message.offer,
        title: message.title,
      });
      break;
    case "OWNER_ANSWER":
      if (senderTabId !== spikeState.ownerTabId || spikeState.secondTabId === null) return;
      sendToTab(spikeState.secondTabId, {
        type: "OWNER_ANSWER",
        answer: message.answer,
      });
      break;
    case "REMOVE_SECONDARY":
      if (senderTabId !== spikeState.ownerTabId) return;
      stopSecondary(spikeState.secondTabId);
      updateState({ ...spikeState, secondTabId: null });
      break;
    case "SECONDARY_STOPPED":
      if (senderTabId !== spikeState.secondTabId) return;
      sendToTab(spikeState.ownerTabId, { type: "SECONDARY_STOPPED" });
      updateState({ ...spikeState, secondTabId: null });
      break;
    case "SPIKE_RESULT":
      if (senderTabId !== undefined) {
        await showResult(senderTabId, message.ok === true, message.message);
      }
      break;
  }
}

function handleTabRemoved(tabId) {
  if (tabId === spikeState.ownerTabId) {
    stopSecondary(spikeState.secondTabId);
    updateState(emptyState);
  } else if (tabId === spikeState.secondTabId) {
    sendToTab(spikeState.ownerTabId, { type: "SECONDARY_STOPPED" });
    updateState({ ...spikeState, secondTabId: null });
  }
}

function injectImmediately(tabId, file) {
  let injection;
  try {
    injection = chrome.scripting.executeScript({
      target: { tabId },
      files: [file],
    });
  } catch (error) {
    handleInjectionFailure(tabId, file, error);
    return;
  }

  void injection.catch((error) => handleInjectionFailure(tabId, file, error));
}

function handleInjectionFailure(tabId, file, error) {
  if (tabId === spikeState.ownerTabId) {
    updateState(emptyState);
  } else if (tabId === spikeState.secondTabId) {
    updateState({ ...spikeState, secondTabId: null });
  }
  console.error(`Multi PiP: no se pudo inyectar ${file}.`, error);
  void showResult(tabId, false, "No se pudo ejecutar el spike en esta pestaña.");
}

function stopSecondary(tabId) {
  if (tabId !== null) {
    sendToTab(tabId, { type: "STOP_SOURCE" });
  }
}

function sendToTab(tabId, message) {
  if (tabId === null) return;
  void chrome.tabs.sendMessage(tabId, message).catch((error) => {
    console.error(`Multi PiP: no se pudo enviar un mensaje a la pestaña ${tabId}.`, error);
  });
}

function updateState(nextState) {
  stateVersion += 1;
  spikeState = nextState;
  void chrome.storage.session.set({ [stateKey]: nextState }).catch((error) => {
    console.error("Multi PiP: no se pudo guardar el estado del spike.", error);
  });
}

async function showResult(tabId, ok, message) {
  const text = ok ? "OK" : "ERR";
  const color = ok ? "#16803c" : "#b42318";

  try {
    await Promise.all([
      chrome.action.setBadgeText({ tabId, text }),
      chrome.action.setBadgeBackgroundColor({ tabId, color }),
      chrome.action.setTitle({
        tabId,
        title: `Multi PiP: ${message || (ok ? "correcto" : "falló")}`,
      }),
    ]);
  } catch (error) {
    console.error("Multi PiP: no se pudo mostrar el resultado.", error);
  }
}
