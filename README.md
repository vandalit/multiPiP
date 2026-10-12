# Multi PiP

Extensión experimental para validar la viabilidad del producto descrito en
[`docs/`](./docs/README.md).

## Estado actual

El proyecto está en **Fase 0: spike**. Esta primera base prueba una sola
incógnita: si el clic en el ícono de la extensión puede abrir una ventana
Document Picture-in-Picture desde la pestaña activa, sin pedir un segundo clic.
Todavía no captura ni presenta videos y no es una versión funcional del
producto.

La arquitectura para obtener video de otra pestaña, los controles y el audio
siguen pendientes de validación. No se adopta `tabCapture` como solución final,
porque muestra la pestaña completa y no cumple el requisito de producto.

## Requisitos de desarrollo

- Google Chrome 116 o posterior para la API Document Picture-in-Picture.
- No requiere Node.js, instalación de paquetes ni proceso de build.

## Cargar la extensión

1. Abrir `chrome://extensions`.
2. Activar **Modo de desarrollador**.
3. Seleccionar **Cargar descomprimida** y elegir esta carpeta.
4. Abrir una pestaña web normal y pulsar el ícono de Multi PiP.
5. Si la prueba pasa, debe abrirse una pequeña ventana PiP con el resultado.
   Cerrar esa ventana para continuar probando.

El badge del ícono muestra `OK` cuando la llamada abre Document PiP y `ERR`
cuando falla. Para ver el detalle del error, revisar la consola de la pestaña y
la consola del service worker desde `chrome://extensions`.

Las páginas internas de Chrome, la Chrome Web Store y otros orígenes restringidos
no permiten inyectar el script de prueba.

## Estructura inicial

```text
background/
  service-worker.js       Inyección al hacer clic y reporte del resultado
spike/
  gesture-probe.js        Prueba aislada de apertura de Document PiP
docs/
  PRD.md                  Definición inicial de producto
  POC.md                  Experimentos y criterios de aceptación
  ROADMAP.md              Fases y puertas de decisión
manifest.json             Manifest MV3 experimental
```

## Validación local

```sh
node --check background/service-worker.js
node --check spike/gesture-probe.js
```

Estas comprobaciones validan sintaxis solamente; el resultado del spike debe
confirmarse cargando la extensión en Chrome.
