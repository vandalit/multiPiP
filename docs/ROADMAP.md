# Multi PiP — hoja de ruta inicial

La hoja de ruta está condicionada al resultado del spike. No se asignan
estimaciones de calendario hasta validar el mecanismo para presentar videos de
otras pestañas y abrir el monitor desde un único clic.

## Fase 0 — Spike de viabilidad

**Propósito:** resolver los riesgos que pueden invalidar el concepto o exigir
un cambio de UX.

- Probar el gesto del ícono para abrir Document PiP en el primer clic.
- Presentar un video de la pestaña activa con `captureStream()` y comprobar
  quitar/cerrar/acoplar el monitor. **Validado manualmente con YouTube.**
- La prueba con una segunda pestaña **falló**: sustituye a la fuente actual y
  el encuadre/tamaño no permanece uniforme.
- Nuevo spike implementado: un único Document PiP propietario, dos slots fijos,
  captura del slot 1 local y envío WebRTC local del slot 2. Primer intento falló
  con `NotAllowedError` por esperar storage antes de inyectar; corregido para
  invocar `executeScript()` en el evento del ícono, pendiente de revalidación.
- Mantener cajas con ratio 16:9 y `object-fit: contain`; comprobar con fuentes
  de distinta resolución/ratio que el grid no se deforme.
- No avanzar a la cola de tres fuentes hasta demostrar que dos coexisten sin
  reemplazarse.
- En el spike multi-fuente, medir el costo de captura y transporte de frames;
  si se usa WebRTC, observar explícitamente el costo de encode/decode.
- Verificar cómo una selección de calidad en YouTube se refleja en la copia
  recibida; los controles del sitio pertenecen a la fuente, no al monitor.
- Comprobar YouTube; ampliar a Twitch después de validar el flujo base.
- Validar pausa/reanudación, ruta de audio, mute/restauración y mezcla.
- Añadir tres fuentes y observar ciclo de vida y rendimiento.

**Puerta de salida:** resultados E1–E7 del [POC](./POC.md) y decisión explícita
de continuar, replantear o detener.

## Fase 1 — Esqueleto del POC

**Solo tras aprobar la Fase 0.**

- Manifest mínimo para Chromium.
- Flujo de clic del ícono a la página/ventana monitor.
- Una fuente en una caja con presentación del video validada.
- Errores visibles para pestaña no compatible y fallo de apertura/captura.

**Salida:** un clic abre el monitor y presenta un video de prueba sin capturar
la página completa.

## Fase 2 — Multi-fuente y layout

- Hasta tres fuentes simultáneas.
- Layout fila/columna.
- Reordenación con controles subir/bajar.
- Añadir/eliminar por ícono y X.
- Rechazo claro al superar el límite.

**Salida:** tres fuentes coexisten; una fuente retirada no afecta a las otras.

## Fase 3 — Controles y audio

- Pausa/reanudación sobre la fuente real.
- Mezcla de audio y volumen individual.
- Silencio de audio fuente para evitar duplicación.
- Restauración del estado al retirar una fuente.
- Definir respuesta ante reproductores incompatibles y selección entre varios
  videos.

**Salida:** comportamiento demostrado inicialmente en YouTube, con limitaciones
registradas.

## Fase 4 — Robustez del MVP

- Manejo de pestañas cerradas, recargadas, navegadas o descartadas.
- Manejo de cierre de la ventana monitor y recuperación de estado.
- Presets y preferencias solo si se priorizan después del POC.
- Medición y optimización de resolución/FPS basadas en datos, no supuestos.
- Mensajes de incompatibilidad/DRM y límites observados.
- Accesibilidad, empaquetado y preparación de publicación cuando se acuerde.

**Salida:** sesión de uso de duración y umbrales de rendimiento acordados,
sin pérdida silenciosa de fuentes ni estado de audio.

## Dependencias y riesgos principales

1. **Componer videos de varias pestañas.** Bloqueo actual: abrir Document PiP
   desde cada pestaña reemplaza el contenido previo. Se necesita un propietario
   único de la ventana y una vía para componer/encaminar cada fuente.
2. **Gesto para abrir Document PiP.** El requisito de producto exige que el clic
   del ícono baste desde el primer uso.
3. **Control de reproductores de terceros.** DOM variable, iframes, políticas de
   los sitios y controles propios pueden limitar pausa o selección.
4. **Audio.** Mezcla, autoplay, mute reversible y cambios concurrentes del sitio
   requieren pruebas específicas.
5. **Geometría de frames.** Las fuentes pueden tener resoluciones y ratios
   distintos; cada caja debe conservar proporción sin cambiar el tamaño del
   monitor.
6. **Costo con tres fuentes.** La viabilidad visual no garantiza fluidez ni
   consumo aceptable.

## Estimación

La estimación anterior de 13–17 días no se conserva como compromiso: asumía una
arquitectura de captura de pestañas que no satisface el requisito de mostrar
solo el video. Reestimar las fases de implementación después de la Fase 0.
