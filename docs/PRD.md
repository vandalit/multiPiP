# Multi PiP — PRD inicial

**Estado:** definición de producto inicial; arquitectura y viabilidad técnica
pendientes de spike  
**Fecha de consolidación:** 12 de octubre de 2026

## 1. Resumen

Multi PiP es una extensión para Chromium que permite reunir hasta tres videos
de pestañas distintas en una única ventana flotante Picture-in-Picture,
organizados en fila o columna. La persona sigue usando sus pestañas; el monitor
muestra solo los videos y ofrece controles por fuente.

La experiencia buscada conserva la sencillez de las extensiones PiP actuales:
un clic en el ícono de la extensión añade el video de la pestaña actual y abre
el monitor si aún no está abierto. No se debe exigir un clic extra para iniciar
el monitor.

El producto no consiste en abrir un PiP nativo independiente por video ni en
mostrar capturas de páginas completas. Es un monitor único con varias vistas de
video. La forma de obtener y presentar esas vistas todavía debe validarse.

## 2. Problema y oportunidad

El PiP tradicional facilita seguir un video mientras se trabaja en otra
ventana, pero el producto que buscamos debe permitir vigilar varios videos al
mismo tiempo sin administrar varias ventanas flotantes. La oportunidad es
reutilizar la interacción familiar de PiP —clic en el botón de extensión— y
cambiar la experiencia de una sola fuente a un stack compacto de fuentes.

La extensión open-source de
[GoogleChromeLabs](https://github.com/GoogleChromeLabs/picture-in-picture-chrome-extension)
sirve como referencia del flujo de PiP nativo de un video. No demuestra por sí
sola que varias fuentes puedan componerse en el monitor propuesto.

## 3. Usuarios y casos de uso

### Usuario objetivo inicial

Una persona que usa Chromium y quiere mantener visibles varios videos o
transmisiones mientras trabaja en otra pestaña o aplicación.

### Casos principales

1. Añadir desde el ícono el video que se reproduce en la pestaña actual.
2. Ver hasta tres videos en un monitor siempre visible, en fila o columna.
3. Pausar o reanudar cada video desde su caja.
4. Ajustar el volumen de cada fuente por separado y escuchar varias fuentes
   mezcladas.
5. Reordenar las fuentes o quitar una caja sin cerrar ni alterar la pestaña de
   origen.

## 4. Principios de experiencia

- **Un clic para empezar:** el primer clic debe abrir el monitor y añadir la
  fuente actual; no se acepta un paso adicional de confirmación como flujo
  normal.
- **La fuente conserva su lugar:** la pestaña original permanece abierta y el
  video se sigue reproduciendo allí. El monitor es una vista de ese video, no
  una acción que navega la pestaña a otra página.
- **Solo video en el monitor:** no se presenta la página completa capturada.
- **Acciones reversibles:** quitar una caja detiene su participación en el
  monitor; la pestaña fuente continúa en su estado normal.
- **Controles por fuente:** reproducción y volumen se controlan
  independientemente.

## 5. Requisitos funcionales iniciales

| ID | Requisito |
|---|---|
| FR-1 | Añadir al monitor el video de la pestaña actual al pulsar el ícono de la extensión. |
| FR-2 | Si el monitor no existe, abrirlo en esa misma interacción, sin otro clic del usuario. |
| FR-3 | Admitir hasta tres fuentes simultáneas en una ventana flotante compartida. |
| FR-4 | Mostrar solo el video, no la superficie completa de la pestaña. |
| FR-5 | Ofrecer una disposición en fila o columna. |
| FR-6 | Permitir pausar y reanudar el video real desde su caja, si el sitio lo permite. |
| FR-7 | Permitir volumen independiente por caja y mezclar el audio de las fuentes activas. |
| FR-8 | Mientras la fuente está en el monitor, silenciar su audio original para evitar duplicación; al quitarla, restaurar el estado de audio previo cuando sea posible. |
| FR-9 | La X quita una fuente del monitor sin cerrar ni pausar su pestaña de origen. |
| FR-10 | Pulsar de nuevo el ícono en una pestaña que ya está añadida quita esa fuente (toggle). |
| FR-11 | Permitir reordenar las fuentes dentro del monitor con controles subir/bajar. |
| FR-12 | Informar con claridad si no hay un video compatible, se alcanzó el límite o una fuente dejó de estar disponible. |

Los controles actúan sobre la reproducción original cuando modifican el estado
del reproductor. La presentación visual y el canal de audio que se use para el
monitor dependen de la arquitectura que valide el spike.

## 6. Requisitos no funcionales y límites

- **Navegador inicial:** Chromium (Chrome y Edge, sujeto a verificación).
- **Fuente de prueba inicial:** YouTube. Twitch queda para una validación posterior.
- **Rendimiento:** medir con tres videos simultáneos; no se ha acordado todavía
  un umbral numérico de CPU, resolución o FPS.
- **Permisos:** usar el modelo de permisos mínimo compatible con el flujo real;
  no se ha cerrado aún la lista definitiva del manifest.
- **Resiliencia:** observar qué ocurre si se cierra o recarga una pestaña fuente,
  si se cierra el monitor o si se descarta la pestaña que lo abre.

## 7. Decisiones acordadas

| Tema | Decisión |
|---|---|
| Experiencia visual | Una ventana compartida con hasta tres cajas, cada una mostrando solo un video. |
| Estado de las fuentes | Las pestañas originales permanecen abiertas; el monitor no debe reemplazar su contenido. |
| Pausa/reanudación | Se aplica al video real de la fuente. |
| Audio | Se mezclan las fuentes, con volumen individual por caja. |
| Audio original | Se silencia mientras la fuente forma parte del monitor y se intenta restaurar al quitarla. |
| Cierre de caja | La X quita la caja; no necesita devolver un nodo de video trasladado. |
| Toggle del ícono | Un segundo clic en la fuente ya añadida la quita. |
| Monitor vacío | Al quitar la última fuente, cerrar automáticamente la ventana Document PiP. |
| Capacidad objetivo del POC | Tres fuentes. |
| Sitio de validación inicial | YouTube; Twitch se deja para una ronda posterior. |
| Apertura inicial | Un solo clic en el ícono es un requisito. Si no se consigue, se reconsidera el enfoque; no se oculta con un paso adicional. |

## 8. Fuera de alcance inicial

- Firefox y Safari.
- Fuentes que no sean videos de pestañas web.
- Grid libre, arrastre/redimensionamiento de cajas y layouts guardados.
- Publicación en Chrome Web Store.
- Garantizar soporte universal para cualquier sitio, reproductor, iframe, DRM o
  video protegido.
- Capturar la pestaña completa como experiencia final.

## 9. Preguntas abiertas

Estas cuestiones no deben resolverse por suposición:

1. ¿Qué mecanismo permite mostrar el video de otra pestaña dentro de una caja
   propia sin capturar toda la página, conservando reproducción y calidad?
2. La apertura de Document PiP desde el ícono pasó en una prueba manual en
   Chrome sobre una pestaña de YouTube con contenido placeholder. ¿Se repite en
   las versiones/navegadores objetivo y se puede añadir el video real en esa
   misma interacción?
3. ¿Qué sucede con video y audio en YouTube y Twitch al cambiar de pestaña,
   minimizar, pausar, silenciar o quitar una fuente?
4. ¿Se puede restaurar de forma fiable el estado de audio que tenía el sitio
   antes de añadir la fuente, incluso si su reproductor actualiza ese estado?
5. ¿Qué debe hacer el toggle si hay varios videos elegibles en la pestaña?
6. ¿El POC necesita seek/retroceso, o basta con pausa/reanudación y volumen?
7. ¿Qué indicador y comportamiento se desea cuando el monitor se cierra, se
   cierra la pestaña fuente, se recarga o el sitio no es compatible?
8. ¿Qué umbrales cuantitativos de fluidez, CPU, resolución y FPS definen un
   resultado aceptable con tres fuentes?

## 10. Criterios de éxito de producto para el POC

- Una persona puede añadir una fuente con un solo clic, desde el primer uso.
- El monitor muestra únicamente el video de la fuente, no su página completa.
- Tres fuentes de prueba pueden coexistir en una sola ventana, sin que una
  sustituya a las otras.
- Pausa/reanudación y volumen tienen el comportamiento acordado en las fuentes
  compatibles.
- Quitar una caja no detiene la pestaña de origen y restaura el audio original
  según lo observado y documentado.
- Los resultados, límites y comportamiento en fallos quedan registrados antes
  de decidir si se invierte en el MVP.
