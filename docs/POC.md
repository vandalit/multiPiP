# Multi PiP — alcance y plan del POC

**Objetivo:** responder con evidencia si es posible entregar la experiencia
definida en el [PRD](./PRD.md), antes de construir la cola y endurecer el
producto.

## 1. Pregunta de viabilidad

¿Puede una extensión Chromium, tras un único clic en su ícono, abrir un monitor
Document PiP compartido que muestre solo el video de la pestaña actual y permita
añadir hasta otras dos fuentes sin reemplazar las anteriores?

El POC valida la experiencia, no presupone que `tabCapture`, `captureStream()`
ni el PiP nativo sean la solución. Capturar la pestaña completa no cumple el
requisito de producto y no cuenta como resultado satisfactorio.

## 2. Alcance incluido

- Chrome como primer navegador experimental; comprobar Edge después si no altera
  el experimento.
- Un monitor Document PiP único, compartido por hasta tres fuentes.
- Abrir el monitor y añadir la fuente actual desde el clic del ícono, también
  en el primer uso.
- Mostrar solo el video en cada caja.
- Presentación básica en fila o columna.
- Reordenación de fuentes con controles subir/bajar.
- Quitar una fuente con X y con un segundo clic en el ícono de esa misma pestaña.
- Pausa/reanudación dirigida al video original.
- Mezcla de audio con volumen individual por fuente.
- Silenciar audio original mientras se incorpora la fuente y comprobar la
  restauración al quitarla.
- Prueba inicial en YouTube; Twitch queda para una validación posterior.
- Observación de errores, ciclo de vida de pestañas/ventana y costo de tres
  fuentes.

## 3. Fuera del POC

- Grids libres, drag-and-drop avanzado, redimensionamiento y layouts guardados.
- Opciones persistentes, personalización visual y publicación.
- Compatibilidad general con todos los sitios, reproductores o frames.
- DRM y promesa de funcionamiento en servicios con contenido protegido.
- Soporte de cámara, pantalla, ventanas, audio sin video u otras fuentes.
- Una afirmación de calidad o rendimiento sin mediciones.

## 4. Experimentos y criterios de aceptación

### E1 — Gesto de apertura y flujo de un clic

**Procedimiento:** con el monitor cerrado, pulsar una vez el ícono en una
pestaña con un video compatible.

**Registrar:** si se abre el monitor, si se añade la fuente en esa misma acción,
si el navegador presenta una confirmación o error y si el comportamiento se
repite tras cerrar y volver a abrir.

**Pasa:** el primer clic abre el monitor y añade la fuente sin clic extra ni
confirmación adicional.

**Resultado inicial observado (12 oct 2026):**

| Entorno | Observación | Estado |
|---|---|---|
| Chrome, pestaña de YouTube | Un clic abre la ventana pequeña Document PiP con el mensaje placeholder; el badge queda verde `OK` y no se observan errores en consola. | Apertura de un clic validada en este caso. |
| Segundo clic en el ícono | La ventana permanece abierta. | Resultado del prototipo anterior, que no tenía una fuente que quitar. El nuevo spike implementa toggle de una fuente. |
| Controles de la ventana | Se ven los controles nativos de Chrome (configuración, volver/acoplar a la pestaña y cerrar). | Comportamiento del navegador; no es un error del prototipo. |

Este resultado valida que el clic de la extensión puede abrir Document PiP en
la prueba realizada. **No** demuestra que el video se presente correctamente.
El spike actualizado intenta usar `HTMLVideoElement.captureStream()` para
presentar una vista en vivo sin mover el elemento original; falta verificarlo
visualmente en Chrome. Registrar la versión exacta de Chrome al repetir o
ampliar la prueba.

### E2 — Captura/presentación exclusiva del video

**Procedimiento actual:** en YouTube, pulsar el ícono para capturar el video
principal elegible en una ventana Document PiP; comprobar que se vea una imagen
en movimiento y que la pestaña original permanezca en su sitio. Quitar con el
botón de la caja o volver a pulsar el ícono.

**Pasa para el spike de una fuente:** la ventana presenta el video en vivo (no
la página completa), la fuente original sigue abierta y reproducida, y quitar
la única fuente detiene su pista y cierra la ventana.

**Registrar además:** sincronización, latencia perceptible, resolución,
relación de aspecto, pantalla completa, cambio de pestaña y restricciones del
sitio. El spike silencia el elemento de vista previa; el audio continúa en la
pestaña de origen. No valida aún la mezcla ni el control de audio.

### E3 — Tres fuentes en un monitor

**Procedimiento:** añadir sucesivamente tres videos de pestañas distintas.

**Pasa:** las tres fuentes permanecen visibles en la misma ventana y ninguna
reemplaza a otra. Una cuarta fuente se rechaza de forma comprensible sin perder
las existentes.

### E4 — Controles de reproducción

**Procedimiento:** pausar y reanudar cada caja individualmente mientras se
observa su fuente.

**Pasa:** el control afecta al video correcto en la pestaña origen y no altera
las demás fuentes.

**Registrar:** qué ocurre si no se encuentra un video controlable, si hay varios
videos, si el video vive en un iframe o si el sitio vuelve a imponer su estado.

### E5 — Audio y restauración

**Procedimiento:** añadir dos o más fuentes, cambiar el volumen de cada caja,
confirmar que se pueden oír mezcladas; quitar cada fuente después de registrar
el estado de mute/volumen original.

**Pasa:** volumen independiente, mezcla audible y ausencia de audio duplicado
por la fuente original; al quitar una fuente se restaura su estado anterior
cuando la implementación lo permita.

**Registrar:** política de autoplay, mute original, volumen previo, cambios
externos al monitor y cualquier caso donde no se pueda restaurar sin interferir
con el usuario.

### E6 — X, toggle y ciclo de vida

**Procedimiento:** quitar fuentes usando X y el ícono; probar cierre de fuente,
recarga/navegación, cierre del monitor y cierre de la página host si aplica.

**Pasa:** una fuente retirada deja de ocupar su caja, mientras su pestaña sigue
abierta y reproduciéndose; las otras cajas continúan. Los casos no recuperables
se notifican y no dejan cajas fantasma.

**Comportamiento acordado:** al quitar la última fuente, cerrar automáticamente
la ventana del monitor.

### E7 — Rendimiento

**Procedimiento:** mantener tres videos de YouTube durante una sesión de diez
minutos, con monitor visible y luego fuera del foco. Twitch queda para una ronda
posterior.

**Registrar:** navegador/versión, sistema, CPU/GPU si es observable, resolución
de origen, fluidez/frames perdidos observables, sincronización, errores y
comportamiento al quedar en segundo plano.

**Pasa:** sesión sin caída ni pérdida permanente de fuentes. El umbral de
rendimiento perceptible debe definirse antes de declarar el spike aprobado; no
hay actualmente un límite numérico acordado.

## 5. Decisión al terminar

- **Continuar:** E1 y E2 pasan, y E3–E6 demuestran el comportamiento funcional
  esencial; E7 no revela un bloqueo inaceptable según umbrales acordados.
- **Replantear:** abrir Document PiP o presentar solo el video requiere pasos o
  permisos incompatibles con el requisito de un clic, pero existe una
  alternativa de UX que el usuario aprueba explícitamente.
- **Detener:** el monitor no puede mostrar videos de otras pestañas con la UX
  requerida, o solo puede hacerlo capturando páginas completas.

No se considera aprobado el POC si únicamente se demuestra una ventana PiP nativa
para un video o una captura completa de la pestaña.

## 6. Entregables

1. Prototipo desechable o rama experimental que permita reproducir los
   escenarios.
2. Matriz de resultados E1–E7, incluyendo navegador/versión y sitios.
3. Decisión continuar/replantear/detener con bloqueos y limitaciones.
4. Arquitectura y estimación del MVP solo después de seleccionar una técnica
   validada.

## 7. Referencias técnicas para iniciar la investigación

- [Chrome: Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/):
  ventana flotante con contenido HTML y restricciones de ciclo de vida/gesto.
- [GoogleChromeLabs: extensión PiP de un video](https://github.com/GoogleChromeLabs/picture-in-picture-chrome-extension):
  referencia del flujo por ícono y `video.requestPictureInPicture()`.
- [Chrome Extensions: `tabCapture`](https://developer.chrome.com/docs/extensions/reference/api/tabCapture):
  captura de la pestaña completa; útil para comparación, pero no satisface por
  sí sola el requisito visual de Multi PiP.
