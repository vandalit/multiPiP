chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) {
    console.error("Multi PiP: no se pudo identificar la pestaña activa.");
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["spike/gesture-probe.js"],
    });
  } catch (error) {
    console.error("Multi PiP: no se pudo ejecutar la prueba en esta pestaña.", error);
    await showResult(tab.id, false, "No se pudo ejecutar la prueba en esta pestaña.");
  }
});

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== "MULTIPIP_GESTURE_PROBE_RESULT") {
    return;
  }

  const tabId = sender.tab?.id;
  if (tabId === undefined) {
    console.error("Multi PiP: el resultado de la prueba no incluye una pestaña.");
    return;
  }

  void showResult(tabId, message.ok === true, message.message);
});

async function showResult(tabId, ok, message) {
  const text = ok ? "OK" : "ERR";
  const color = ok ? "#16803c" : "#b42318";

  try {
    await Promise.all([
      chrome.action.setBadgeText({ tabId, text }),
      chrome.action.setBadgeBackgroundColor({ tabId, color }),
      chrome.action.setTitle({
        tabId,
        title: `Multi PiP: ${message || (ok ? "prueba exitosa" : "falló la prueba")}`,
      }),
    ]);
  } catch (error) {
    console.error("Multi PiP: no se pudo mostrar el resultado de la prueba.", error);
  }
}
