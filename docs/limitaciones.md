# Limitaciones conocidas

## Motor literario
- **No es inteligencia artificial.** Combina 313 versos escritos a mano con huecos, repartidos en 14 familias de rima. No comprende el significado de lo que el usuario escribe: si el gusto se escribe como «el futbol» en vez de «jugar futbol», un verso como «quería el futbol a cada momento» puede sonar mal. El formulario da ejemplos para evitarlo.
- **Poemas largos.** Con 6 a 8 estrofas de 6 a 8 versos el repertorio se estira: aparecen más versos genéricos y la historia se alarga sin avanzar. Para la mejor calidad se recomiendan de 3 a 5 estrofas de 4 versos.
- **Rima:** en los 30 casos de prueba rima el 98,8 % de las parejas. Cuando no hay opción natural el verso queda sin rimar y se avisa.
- **Varios protagonistas** se tratan como «la pandilla de…» (femenino singular) para mantener la concordancia; no se generan versos con verbos en plural.
- **Género:** solo concordancia masculina o femenina; no hay opción de lenguaje neutro.
- **Métrica:** las plantillas no tienen medida fija y los datos del usuario alargan los versos, así que el evaluador suele marcar «Ritmo» para revisión.
- **Huecos libres:** los datos se insertan tal cual se escriben (solo se pasa a minúscula la primera letra). Si se escriben con faltas o con otra estructura, el verso lo reflejará.

## Evaluador
- La separación silábica sigue reglas generales: no conoce palabras extranjeras, trata la «h» intercalada como consonante y asume seseo.
- La métrica no resuelve sinéresis, diéresis, dialefas ni sinalefas bloqueadas por acento.
- La presencia de rasgos se comprueba buscando sus palabras; un sinónimo no cuenta.
- La lista de términos no aptos para menores es corta y no entiende el contexto.
- La calidad literaria, el humor y la coherencia global se declaran siempre «No verificable automáticamente».

## Aplicación
- Los datos solo existen en el navegador del dispositivo, sin cifrar; se pierden si se borran los datos del navegador. Algunas ventanas privadas no permiten IndexedDB: la app lo informa.
- No hay sincronización entre dispositivos; para pasar obras se usa el respaldo JSON.
- **PDF:** la app abre el diálogo de impresión del navegador; el PDF lo genera el navegador con «Guardar como PDF». La app no crea archivos PDF.
- Las sugerencias del evaluador se aplican editando el verso (botón «Editar este verso»); no hay corrección automática.
- La versión de un solo archivo (`dist-single`) no incluye la política de seguridad, porque esta no admite código incrustado. El código es el mismo y no hace peticiones de red.
- Las pruebas de extremo a extremo se ejecutaron en Chromium (escritorio y emulación de Pixel 7). No se probaron Firefox ni Safari.
