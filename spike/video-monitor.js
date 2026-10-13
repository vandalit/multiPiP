(() => {
  const stateKey = "__multiPipOwner";
  if (globalThis[stateKey]) return;

  const sourceVideo = findVideo();
  if (!sourceVideo) {
    fail("No se encontró un video con imagen disponible.");
    return;
  }
  if (!("documentPictureInPicture" in window)) {
    fail("Document Picture-in-Picture no está disponible.");
    return;
  }

  void openMonitor(sourceVideo);

  async function openMonitor(video) {
    let pipWindow;
    let localStream;

    try {
      localStream = video.captureStream();
      assertVideoTrack(localStream);
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 800,
        height: 480,
      });

      const owner = createOwner(pipWindow, video, localStream);
      globalThis[stateKey] = owner;
      await owner.playSlot(1);
      report(true, "El video se está mostrando en el slot 1.");
    } catch (error) {
      localStream?.getTracks().forEach((track) => track.stop());
      pipWindow?.close();
      const detail = error instanceof Error ? error.message : String(error);
      console.error("Multi PiP: no se pudo abrir el grid.", error);
      fail(`No se pudo abrir el grid: ${detail}`);
    }
  }

  function createOwner(pipWindow, source, stream) {
    const doc = pipWindow.document;
    doc.head.innerHTML = `<meta charset="utf-8"><title>Multi PiP</title>`;
    const style = doc.createElement("style");
    style.textContent = `
      :root { color-scheme: dark; font: 14px/1.4 system-ui, sans-serif; }
      * { box-sizing: border-box; }
      body { margin: 0; width: 100vw; height: 100vh; overflow: hidden; background: #101318; color: #f5f7fa; }
      #grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; height: 100%; padding: 10px; }
      .slot { display: grid; grid-template-rows: minmax(0, 1fr) auto; min-width: 0; min-height: 0; gap: 8px; padding: 8px; border: 1px solid #3a414b; border-radius: 8px; background: #1b2028; }
      .screen { display: grid; place-items: center; min-width: 0; min-height: 0; overflow: hidden; aspect-ratio: 16 / 9; background: #000; }
      video { display: block; width: 100%; height: 100%; object-fit: contain; }
      .empty { color: #929ba8; }
      footer { display: flex; align-items: center; justify-content: space-between; min-width: 0; gap: 8px; }
      p { overflow: hidden; margin: 0; text-overflow: ellipsis; white-space: nowrap; }
      button { flex: none; border: 0; border-radius: 6px; padding: 6px 10px; color: white; background: #b42318; cursor: pointer; }
    `;
    const grid = doc.createElement("main");
    grid.id = "grid";
    doc.head.append(style);

    const slots = [createSlot(doc, 1), createSlot(doc, 2)];
    slots.forEach((slot) => grid.append(slot.root));
    doc.body.replaceChildren(grid);

    const owner = {
      pipWindow,
      source,
      localStream: stream,
      slots,
      peer: null,
      secondTitle: "",
      async playSlot(slotNumber) {
        const slot = slots[slotNumber - 1];
        if (slot.video.srcObject) {
          await slot.video.play();
        }
      },
      removeSlot(slotNumber, notify = true) {
        if (slotNumber === 1) {
          stream.getTracks().forEach((track) => track.stop());
          slots[0].video.srcObject = null;
          slots[0].label.textContent = "Slot 1 vacío";
          slots[0].remove.hidden = true;
        } else {
          closePeer();
          slots[1].video.srcObject = null;
          slots[1].label.textContent = "Slot 2 vacío";
          slots[1].remove.hidden = true;
          if (notify) void chrome.runtime.sendMessage({ type: "REMOVE_SECONDARY" });
        }
        if (slots.every((slot) => !slot.video.srcObject)) pipWindow.close();
      },
    };

    function closePeer() {
      if (owner.peer) {
        owner.peer.ontrack = null;
        owner.peer.close();
        owner.peer = null;
      }
    }

    slots[0].video.srcObject = stream;
    slots[0].label.textContent = source.title || "Video 1";
    slots[0].remove.hidden = false;
    slots[0].remove.addEventListener("click", () => owner.removeSlot(1));
    slots[1].remove.addEventListener("click", () => owner.removeSlot(2));

    chrome.runtime.onMessage.addListener((message) => {
      if (globalThis[stateKey] !== owner) return;
      if (message?.type === "TOGGLE_SLOT") {
        owner.removeSlot(message.slot);
      } else if (message?.type === "SOURCE_OFFER") {
        void acceptSource(message.offer, message.title);
      } else if (message?.type === "SECONDARY_STOPPED") {
        owner.removeSlot(2, false);
      }
    });

    pipWindow.addEventListener("pagehide", () => {
      closePeer();
      stream.getTracks().forEach((track) => track.stop());
      if (globalThis[stateKey] === owner) delete globalThis[stateKey];
      void chrome.runtime.sendMessage({ type: "OWNER_CLOSED" });
    }, { once: true });

    void chrome.runtime.sendMessage({ type: "OWNER_READY" });

    async function acceptSource(offer, title) {
      closePeer();
      const peer = new RTCPeerConnection({ iceServers: [] });
      owner.peer = peer;
      peer.ontrack = (event) => {
        if (owner.peer !== peer) return;
        const remoteStream = event.streams[0];
        if (!remoteStream) {
          report(false, "La segunda fuente no entregó un stream.");
          return;
        }
        slots[1].video.srcObject = remoteStream;
        slots[1].label.textContent = title || "Video 2";
        slots[1].remove.hidden = false;
        void owner.playSlot(2).then(() => {
          report(true, "El segundo video se está mostrando en el slot 2.");
        }).catch((error) => {
          console.error("Multi PiP: no se pudo reproducir el slot 2.", error);
          report(false, "La conexión llegó, pero no se pudo reproducir el slot 2.");
          owner.removeSlot(2);
        });
      };
      peer.onconnectionstatechange = () => {
        if (peer.connectionState === "failed" || peer.connectionState === "closed") {
          owner.removeSlot(2, false);
        }
      };

      try {
        await peer.setRemoteDescription(offer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await waitForIceGathering(peer);
        await chrome.runtime.sendMessage({
          type: "OWNER_ANSWER",
          answer: peer.localDescription,
        });
      } catch (error) {
        closePeer();
        slots[1].label.textContent = "Error al conectar slot 2";
        const detail = error instanceof Error ? error.message : String(error);
        console.error("Multi PiP: no se pudo conectar el segundo video.", error);
        report(false, `No se pudo conectar el slot 2: ${detail}`);
      }
    }

    function createSlot(document, slotNumber) {
      const root = document.createElement("section");
      root.className = "slot";
      const screen = document.createElement("div");
      screen.className = "screen";
      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      const label = document.createElement("p");
      label.className = "empty";
      label.textContent = `Slot ${slotNumber} vacío`;
      screen.append(video);
      const footer = document.createElement("footer");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Quitar";
      remove.hidden = true;
      footer.append(label, remove);
      root.append(screen, footer);
      return { root, video, label, remove };
    }

    return owner;
  }

  function findVideo() {
    return [...document.querySelectorAll("video")]
      .filter((video) => video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
      .sort((left, right) => {
        const leftRect = left.getBoundingClientRect();
        const rightRect = right.getBoundingClientRect();
        return rightRect.width * rightRect.height - leftRect.width * leftRect.height;
      })[0];
  }

  function assertVideoTrack(stream) {
    const track = stream.getVideoTracks()[0];
    if (!track || track.readyState !== "live") {
      throw new Error("No se obtuvo una pista de video activa.");
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

  function fail(message) {
    void chrome.runtime.sendMessage({ type: "OWNER_FAILED", message });
    report(false, message);
  }
})();
