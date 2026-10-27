# CalaverArte: autoría, referencia APA y registro de prompts

**Fecha del registro:** 27 de octubre de 2026.  
**Autor y responsable del proyecto:** Eduardo Kantún Martínez.  
**URL de la aplicación:** https://lalitoelprofefulanito-dot.github.io/calaverarte/

## Referencia bibliográfica en formato APA 7

Kantún Martínez, E. (2026). *CalaverArte: Generador, editor y taller de calaveritas literarias* [Aplicación web]. GitHub Pages. https://lalitoelprofefulanito-dot.github.io/calaverarte/

### Cita dentro del texto

- Parentética: (Kantún Martínez, 2026).
- Narrativa: Kantún Martínez (2026).

La referencia identifica la versión del proyecto documentada en 2026. Se debe actualizar si cambia el año de publicación o la dirección pública.

## Autoría y reconocimiento del apoyo de IA

CalaverArte es un proyecto concebido y dirigido por Eduardo Kantún Martínez. Durante su desarrollo se utilizaron ChatGPT, de OpenAI, y Claude, de Anthropic, como herramientas de apoyo para estructurar requisitos, planificar la arquitectura, preparar instrucciones de desarrollo y analizar problemas técnicos.

El diseño del propósito, la selección de funciones y las decisiones sobre el proyecto corresponden a su autor. La asistencia de IA no sustituye la revisión humana, ni constituye por sí sola evidencia de que cada función esté implementada o verificada.

**Transparencia de funcionamiento:** ChatGPT y Claude se utilizaron como apoyo durante el proceso de desarrollo. El motor local de CalaverArte usa reglas, plantillas y vocabulario; no utiliza un modelo de IA para generar las calaveritas ni envía los textos del usuario a servicios externos.

## Registro de prompts documentados

El siguiente registro contiene los prompts principales identificados en la conversación de planificación y diagnóstico. No es una exportación automática de una sesión externa de Claude.

### 1. Plan de creación

**Herramienta:** ChatGPT.  
**Finalidad:** definir el propósito y plan de desarrollo desde cero.

> Crea un plan para hacer desde cero una aplicación que genere calaveritas literarias

### 2. Plan técnico definitivo

**Herramienta:** ChatGPT.  
**Finalidad:** definir arquitectura, módulos, estructura, flujos y criterios de aceptación.

> Desarrolla el plan técnico definitivo y la especificación funcional de CalaverArte con estas decisiones: plataforma=web; propósito=ambos; generación=prototipo; almacenamiento=local; alcance inicial=avanzada. Define arquitectura, módulos, estructura de archivos, flujos de usuario, criterios de aceptación y orden exacto de implementación. No afirmes que la aplicación ya está construida.

### 3. Preparación del prompt para Claude

**Herramienta:** ChatGPT.  
**Finalidad:** solicitar la consolidación de los acuerdos en una instrucción integral de desarrollo.

> Dame en un prompt todo lo que me has explicado hasta ahora en esta conversación para que Claude IA realice el diseño del código y cree toda la app ya completa

### 4. Prompt maestro de implementación

**Destinatario:** Claude; el prompt fue preparado con apoyo de ChatGPT.  
**Finalidad:** solicitar una aplicación modular completa, no solamente una maqueta.

La instrucción maestra pidió que se construyera CalaverArte como aplicación web adaptable, con generación local basada en reglas, editor por estrofas, bloqueo y versionado, evaluación literaria no destructiva, modo educativo, biblioteca con IndexedDB, diseñador visual, exportación, pruebas, documentación y criterios de aceptación verificables. También indicó que no se declararan pruebas, compilaciones o publicaciones como realizadas si no se habían comprobado.

La especificación pidió usar Vite, JavaScript con módulos ES, Vitest y Playwright; mantener una separación entre interfaz, motor literario, evaluación, almacenamiento y exportación; evitar código muerto, funciones duplicadas y botones sin funcionamiento; y seguir un orden incremental de implementación.

**Nota de alcance:** este apartado documenta el alcance y las instrucciones principales del prompt maestro creado en la conversación. No es una transcripción certificada palabra por palabra del texto que se haya pegado en una sesión de Claude.

### 5. Diagnóstico de la publicación

**Herramienta:** ChatGPT.  
**Finalidad:** solicitar ayuda cuando el sitio publicado aparecía sin estilos y los controles no parecían ejecutar acciones. La solicitud estuvo acompañada de una captura de pantalla.

> NO tiene un buen html y la app no funciona ya la subi a github y además tiene esta presentación que no ejecuta nada podrías ayudarme po favor

## Referencias de las herramientas utilizadas

Anthropic. (2026). *Claude* [Modelo de lenguaje]. https://claude.ai/

OpenAI. (2026). *ChatGPT* [Modelo de lenguaje]. https://chatgpt.com/

Estas entradas identifican las herramientas utilizadas como apoyo durante el proceso de desarrollo; no implican que sean autoras de la aplicación. Para una cita académica más específica, puede añadirse el nombre o la versión exacta del modelo únicamente cuando se conozca y pueda comprobarse.

## Alcance y responsabilidad

Este registro no implica que la lista de prompts sea una transcripción completa de todas las conversaciones mantenidas con herramientas externas. Las funciones de la aplicación deben considerarse verificadas solo cuando existan resultados de pruebas o comprobaciones de ejecución. La responsabilidad sobre la versión publicada corresponde a la persona que la mantiene y despliega.
