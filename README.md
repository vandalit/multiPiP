# Multi PiP

Extensión experimental para validar la viabilidad del producto descrito en
[`docs/`](./docs/README.md).

## Estado actual

El proyecto está en **Fase 0: spike**. El prototipo prueba la apertura de
Document Picture-in-Picture desde el ícono y, en YouTube, intenta presentar en
la ventana una captura visual en vivo del elemento `<video>`. La pestaña fuente
permanece en su lugar.

Es una prueba de una única fuente: no implementa todavía cola multi-fuente,
controles de reproducción ni audio en el monitor. `captureStream()` podría ser
rechazado o producir una pista no reproducible en ciertos videos; ese resultado
es justamente parte del spike. No se adopta `tabCapture` como solución final,
porque muestra la pestaña completa y no cumple el requisito de producto.

## Requisitos de desarrollo

- Google Chrome 116 o posterior para la API Document Picture-in-Picture.
- No requiere Node.js, instalación de paquetes ni proceso de build.

## Cargar la extensión

1. Abrir `chrome://extensions`.
2. Activar **Modo de desarrollador**.
3. Seleccionar **Cargar descomprimida** y elegir esta carpeta.
4. Abrir una pestaña web normal y pulsar el ícono de Multi PiP.
5. Debe abrirse una ventana PiP con el video capturado y un botón **Quitar**.
   El clic en **Quitar** o un segundo clic en el ícono detiene la captura y
   cierra el monitor al quedar vacía.

El badge muestra `OK` cuando se inicia el monitor con una pista de video activa
y `ERR` si falla la apertura/captura. Para ver el detalle, revisar la consola
de la pestaña y la consola del service worker desde `chrome://extensions`.

La vista previa se silencia para evitar duplicar el audio de la pestaña. La
fuente sigue reproduciéndose en su página con su audio original. Los controles
de configuración, volver a la pestaña y cerrar son controles propios de la
ventana PiP de Chrome.

Las páginas internas de Chrome, la Chrome Web Store y otros orígenes restringidos
no permiten inyectar el script de prueba.

## Estructura inicial

```text
background/
  service-worker.js       Inyección al hacer clic y reporte del resultado
spike/
  video-monitor.js        Prueba de captura de un video y vaciado de la cola
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
```

Estas comprobaciones validan sintaxis solamente; el resultado del spike debe
confirmarse cargando la extensión en Chrome.
