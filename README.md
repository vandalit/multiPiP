# Multi PiP

Extensión experimental para validar la viabilidad del producto descrito en
[`docs/`](./docs/README.md).

## Estado actual

El proyecto está en **Fase 0: spike**. La prueba manual anterior en Chrome con
YouTube confirmó una fuente en Document PiP y sus controles de quitar,
volver/acoplar y cerrar. La prueba de la segunda pestaña con ese diseño falló:
la segunda fuente reemplazaba a la primera.

La implementación actual cambia el experimento a **una ventana Document PiP
propietaria con dos slots fijos**:

1. El primer clic captura el video de la pestaña activa y abre el monitor en
   slot 1.
2. Un clic en otra pestaña captura su video y trata de enviar sus frames al
   mismo monitor usando WebRTC para presentarlos en slot 2.
3. Cada slot tiene una caja con proporción visual fija (`16:9`) y el video usa
   `object-fit: contain`, para que fuentes de ratio/resolución diferente no
   redimensionen la caja.
4. Cada botón **Quitar** vacía su slot. El monitor se cierra al quedar ambos
   slots vacíos. El segundo clic en el ícono toggleará el slot correspondiente.

El primer intento de abrir este spike falló con `NotAllowedError` porque el
service worker esperaba operaciones asíncronas antes de inyectar el script y
Chrome ya no reconocía la activación del ícono. Se cambió esa ruta para inyectar
sin `await` y persistir el estado en paralelo. La prueba manual posterior
confirmó que ahora acepta dos canales.

Falta comprobar la retirada independiente de cada slot, el cierre al vaciar el
monitor y la estabilidad del encuadre al mezclar calidades/ratios. También falta
medir latencia, fluidez y consumo de recursos.

El segundo stream se transporta mediante WebRTC local (sin servidor STUN/TURN
configurado). Eso puede añadir encode/decode y carga de CPU/GPU; no se sabe aún
si Chromium consigue una ruta optimizada de frames. Es una técnica de
validación, no una decisión de arquitectura de producto. No están incluidos
todavía el audio del monitor, controles de reproducción ni cola de tres
fuentes. Los cambios de calidad se hacen en los reproductores originales.

## Requisitos de desarrollo

- Google Chrome 116 o posterior para la API Document Picture-in-Picture.
- No requiere Node.js, instalación de paquetes ni proceso de build.

## Cargar la extensión

1. Abrir `chrome://extensions`.
2. Activar **Modo de desarrollador**.
3. Seleccionar **Cargar descomprimida** y elegir esta carpeta.
4. Para cada cambio de código, pulsar **Recargar** en la tarjeta de la extensión.
5. Abrir una pestaña de YouTube con un video en reproducción y pulsar el ícono
   de Multi PiP. El video debe ocupar el slot 1.
6. Cambiar a otra pestaña de YouTube con un segundo video y pulsar el ícono de
   nuevo. El segundo video debe ocupar el slot 2 del mismo monitor, sin
   reemplazar el primero.
7. Quitar cada slot desde su botón **Quitar**. El monitor debe seguir abierto
   mientras haya al menos un slot activo y cerrarse al vaciar ambos.

El badge muestra `OK` cuando una fuente está presentándose y `ERR` cuando falla
la apertura, captura o conexión. Para ver el detalle, revisar las consolas de
las pestañas fuente y la consola del service worker desde
`chrome://extensions`.

La vista previa se silencia para evitar duplicar el audio de la pestaña. La
fuente sigue reproduciéndose en su página con su audio original. Los controles
de configuración, volver a la pestaña y cerrar son controles propios de la
ventana PiP de Chrome.

Las páginas internas de Chrome, la Chrome Web Store y otros orígenes restringidos
no permiten inyectar el script de prueba.

## Estructura inicial

```text
background/
  service-worker.js       Slots activos, señalización y mensajes entre pestañas
spike/
  video-monitor.js        Monitor PiP propietario y slot 1
  secondary-source.js     Captura de pestaña secundaria para el slot 2
docs/
  PRD.md                  Definición inicial de producto
  POC.md                  Experimentos y criterios de aceptación
  ROADMAP.md              Fases y puertas de decisión
manifest.json             Manifest MV3 experimental
```

## Validación local

```sh
node --check background/service-worker.js
node --check spike/video-monitor.js
node --check spike/secondary-source.js
```

Estas comprobaciones validan sintaxis solamente; el resultado del spike debe
confirmarse cargando la extensión en Chrome.

## Agente de desarrollo y continuidad entre modelos

Agente usado para este trabajo: **asistente de IA con Copilot SDK en VS Code**.
Su papel es ayudar a analizar, implementar, probar y mantener la documentación;
**no forma parte de la extensión ni de su runtime**. El proveedor o modelo
activo puede cambiar sin cambiar el producto. No se fija aquí un nombre de
modelo: las capacidades concretas dependen del agente/modelo configurado en cada
sesión.

### Contrato técnico para cualquier agente

- **Fuente de verdad:** leer primero [`docs/README.md`](./docs/README.md),
  [`docs/PRD.md`](./docs/PRD.md), [`docs/POC.md`](./docs/POC.md) y
  [`docs/ROADMAP.md`](./docs/ROADMAP.md). Registrar nueva evidencia y decisiones
  en esos documentos para no depender del historial de chat.
- **Plataforma:** extensión Chrome/Chromium Manifest V3, JavaScript nativo,
  `chrome.scripting` y Document Picture-in-Picture. El scaffold no usa bundler,
  framework ni dependencias.
- **Arquitectura vigente:** el service worker inyecta el spike en la pestaña
  activa. `spike/video-monitor.js` abre el Document PiP propietario y muestra
  slot 1. `spike/secondary-source.js` intenta pasar una segunda pista capturada
  por `HTMLVideoElement.captureStream()` mediante RTCPeerConnection al slot 2.
  Dos canales están validados manualmente; retirada independiente, geometría
  bajo ratios/calidades distintas y rendimiento aún requieren pruebas.
- **Decisiones de producto que no deben alterarse por conveniencia técnica:**
  una ventana compartida, hasta tres fuentes, mostrar solo videos, añadir con
  un clic, fuentes originales intactas, layout fila/columna, pausa sobre el
  video real, audio mezclado con volumen individual, toggle/X para quitar, y
  cerrar el monitor al quitar la última fuente.
- **No presentar hipótesis como hechos:** la composición WebRTC multi-pestaña,
  audio, controles sobre YouTube, límites de captura, rendimiento y
  compatibilidad entre versiones todavía requieren evidencia.
- **Cambios precisos:** conservar JavaScript sencillo y permisos mínimos;
  evitar dependencias, abstracciones o cambios de producto sin necesidad.
- **Validación mínima:** `node --check` para los scripts, parsear
  `manifest.json`, ejecutar `git diff --check` y probar manualmente la extensión
  en Chrome. Las comprobaciones estáticas no sustituyen la prueba en navegador.
- **Al cambiar de agente/modelo:** comunicar el objetivo concreto, pedir que lea
  los documentos de producto y el estado actual, y solicitar que actualice la
  evidencia relevante junto con el código. No asumir acceso al contexto de
  conversaciones anteriores.
