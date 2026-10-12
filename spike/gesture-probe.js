(async () => {
  const report = (ok, message) => {
    void chrome.runtime.sendMessage({
      type: "MULTIPIP_GESTURE_PROBE_RESULT",
      ok,
      message,
    }).catch((error) => {
      console.error("Multi PiP: no se pudo reportar el resultado de la prueba.", error);
    });
  };

  if (!("documentPictureInPicture" in window)) {
    report(false, "Document Picture-in-Picture no está disponible en esta pestaña.");
    return;
  }

  try {
    const pipWindow = await window.documentPictureInPicture.requestWindow({
      width: 360,
      height: 180,
    });
    const message = pipWindow.document.createElement("main");
    message.textContent = "Document PiP abierto desde el clic de la extensión.";
    message.style.cssText = [
      "box-sizing: border-box",
      "display: grid",
      "place-items: center",
      "height: 100%",
      "padding: 24px",
      "font: 600 16px/1.4 system-ui, sans-serif",
      "text-align: center",
      "color: #172b4d",
      "background: #f4f7fb",
    ].join(";");
    pipWindow.document.body.replaceChildren(message);

    report(true, "Document PiP se abrió desde el clic de la extensión.");
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.error("Multi PiP: falló la apertura de Document PiP.", error);
    report(false, `No se pudo abrir Document PiP: ${detail}`);
  }
})();
