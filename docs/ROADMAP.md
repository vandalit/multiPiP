# Multi PiP — hoja de ruta inicial

La hoja de ruta está condicionada al resultado del spike. No se asignan
estimaciones de calendario hasta validar el mecanismo para presentar videos de
otras pestañas y abrir el monitor desde un único clic.

## Fase 0 — Spike de viabilidad

**Propósito:** resolver los riesgos que pueden invalidar el concepto o exigir
un cambio de UX.

- Probar el gesto del ícono para abrir Document PiP en el primer clic.
- Probar cómo presentar solo el video de una pestaña ajena dentro de una caja.
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

1. **Presentar exclusivamente el video de otra pestaña.** Bloqueo técnico
   principal; `tabCapture` captura la pestaña entera y no debe confundirse con
   la solución de producto.
2. **Gesto para abrir Document PiP.** El requisito de producto exige que el clic
   del ícono baste desde el primer uso.
3. **Control de reproductores de terceros.** DOM variable, iframes, políticas de
   los sitios y controles propios pueden limitar pausa o selección.
4. **Audio.** Mezcla, autoplay, mute reversible y cambios concurrentes del sitio
   requieren pruebas específicas.
5. **Costo con tres fuentes.** La viabilidad visual no garantiza fluidez ni
   consumo aceptable.

## Estimación

La estimación anterior de 13–17 días no se conserva como compromiso: asumía una
arquitectura de captura de pestañas que no satisface el requisito de mostrar
solo el video. Reestimar las fases de implementación después de la Fase 0.
