(() => {
  const stateKey = "__multiPipSecondary";
  if (globalThis[stateKey]) {
    report(false, "Esta pestaña ya está conectada al slot 2.");
    return;
  }

  const sourceVideo = [...document.querySelectorAll("video")]
    .filter((video) => video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
    .sort((left, right) => {
      const leftRect = left.getBoundingClientRect();
      const rightRect = right.getBoundingClientRect();
      return rightRect.width * rightRect.height - leftRect.width * leftRect.height;
    })[0];

  if (!sourceVideo) {
    report(false, "No se encontró un video con imagen disponible para el slot 2.");
    void chrome.runtime.sendMessage({ type: "SECONDARY_STOPPED" });
    return;
  }
  if (typeof sourceVideo.captureStream !== "function") {
    report(false, "Este navegador no permite capturar el elemento de video.");
    void chrome.runtime.sendMessage({ type: "SECONDARY_STOPPED" });
    return;
  }

  void connectSource(sourceVideo);

  async function connectSource(video) {
    let stream;
    const peer = new RTCPeerConnection({ iceServers: [] });

    try {
      stream = video.captureStream();
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState !== "live") {
        throw new Error("No se obtuvo una pista de video activa.");
      }

      const state = { peer, stream };
      globalThis[stateKey] = state;
      peer.addTrack(track, stream);
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "closed") {
          stopSource();
        }
      };

      chrome.runtime.onMessage.addListener((message) => {
        if (globalThis[stateKey] !== state) return;
        if (message?.type === "OWNER_ANSWER") {
          void peer.setRemoteDescription(message.answer).catch((error) => {
            console.error("Multi PiP: no se pudo completar la conexión.", error);
            stopSource();
          });
        } else if (message?.type === "STOP_SOURCE") {
          stopSource(false);
        }
      });

      track.addEventListener("ended", () => stopSource(), { once: true });
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await waitForIceGathering(peer);
      await chrome.runtime.sendMessage({
        type: "SOURCE_OFFER",
        offer: peer.localDescription,
        title: document.title || "Video 2",
      });
    } catch (error) {
      stream?.getTracks().forEach((track) => track.stop());
      peer.close();
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Multi PiP: no se pudo enviar el segundo video.", error);
      report(false, `No se pudo enviar el video al slot 2: ${detail}`);
      void chrome.runtime.sendMessage({ type: "SECONDARY_STOPPED" });
    }

    function stopSource(notify = true) {
      const state = globalThis[stateKey];
      if (!state || state.peer !== peer) return;
      delete globalThis[stateKey];
      peer.close();
      stream?.getTracks().forEach((track) => track.stop());
      if (notify) void chrome.runtime.sendMessage({ type: "SECONDARY_STOPPED" });
    }
  }

  function waitForIceGathering(peer) {
    if (peer.iceGatheringState === "complete") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error("Timeout al recopilar candidatos de conexión."));
      }, 8000);
      const onStateChange = () => {
        if (peer.iceGatheringState === "complete") {
          cleanup();
          resolve();
        }
      };
      const cleanup = () => {
        clearTimeout(timeout);
        peer.removeEventListener("icegatheringstatechange", onStateChange);
      };
      peer.addEventListener("icegatheringstatechange", onStateChange);
    });
  }

  function report(ok, message) {
    void chrome.runtime.sendMessage({ type: "SPIKE_RESULT", ok, message });
  }
})();
