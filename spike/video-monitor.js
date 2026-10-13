(() => {
  const stateKey = "__multiPipVideoMonitor";
  const existing = globalThis[stateKey];

  if (existing?.sourceVideo?.isConnected && existing?.pipWindow) {
    existing.removeSource();
    return;
  }

  const candidates = [...document.querySelectorAll("video")]
    .filter((video) => video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
    .sort((left, right) => {
      const leftRect = left.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      const leftArea = leftRect.width * leftRect.height;
      const rightArea = rightRect.width * rightRect.height;
      return rightArea - leftArea;
    });
  const sourceVideo = candidates[0];

  if (!sourceVideo) {
    report(false, "No se encontró un video con imagen disponible en esta pestaña.");
    return;
  }

  if (typeof sourceVideo.captureStream !== "function") {
    report(false, "Este navegador no permite capturar el elemento de video.");
    return;
  }

  void openMonitor(sourceVideo);

  async function openMonitor(video) {
    let pipWindow;
    let stream;

    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 520,
        height: 340,
      });

      stream = video.captureStream();
      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack || videoTrack.readyState !== "live") {
        throw new Error("El video no produjo una pista de captura activa.");
      }

      renderMonitor(pipWindow, video, stream);
      report(true, "Se abrió el monitor con la captura en vivo del video.");
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      pipWindow?.close();
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Multi PiP: no se pudo iniciar la captura del video.", error);
      report(false, `No se pudo mostrar el video: ${detail}`);
    }
  }

  function renderMonitor(pipWindow, video, stream) {
    const doc = pipWindow.document;
    const style = doc.createElement("style");
    style.textContent = `
      :root { color-scheme: dark; font: 14px/1.4 system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; height: 100vh; background: #101318; color: #f5f7fa; }
      main { display: grid; grid-template-rows: 1fr auto; height: 100%; padding: 10px; gap: 8px; }
      video { width: 100%; height: 100%; min-height: 0; object-fit: contain; background: #000; }
      footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      button { border: 0; border-radius: 6px; padding: 7px 12px; color: #fff; background: #b42318; cursor: pointer; }
    `;

    const main = doc.createElement("main");
    const preview = doc.createElement("video");
    preview.autoplay = true;
    preview.muted = true;
    preview.playsInline = true;
    preview.srcObject = stream;

    const footer = doc.createElement("footer");
    const title = doc.createElement("p");
    title.textContent = `Multi PiP · ${document.title || "Video"}`;
    const removeButton = doc.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Quitar";
    removeButton.addEventListener("click", removeSource, { once: true });

    footer.append(title, removeButton);
    main.append(preview, footer);
    doc.head.replaceChildren(style);
    doc.body.replaceChildren(main);

    const state = {
      pipWindow,
      sourceVideo: video,
      stream,
      removeSource,
    };
    globalThis[stateKey] = state;

    pipWindow.addEventListener("pagehide", () => {
      stream.getTracks().forEach((track) => track.stop());
      if (globalThis[stateKey] === state) {
        delete globalThis[stateKey];
      }
    }, { once: true });

    void preview.play().catch((error) => {
      console.error("Multi PiP: no se pudo iniciar la vista previa.", error);
      removeSource();
      report(false, "La captura existe, pero Chrome bloqueó su reproducción.");
    });

    function removeSource() {
      stream.getTracks().forEach((track) => track.stop());
      if (globalThis[stateKey] === state) {
        delete globalThis[stateKey];
      }
      pipWindow.close();
    }
  }

  function report(ok, message) {
    void chrome.runtime.sendMessage({
      type: "MULTIPIP_VIDEO_MONITOR_RESULT",
      ok,
      message,
    }).catch((error) => {
      console.error("Multi PiP: no se pudo reportar el resultado.", error);
    });
  }
})();
