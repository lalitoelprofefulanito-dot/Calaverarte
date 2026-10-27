# Modelo de datos (esquema v2)

Definido en `src/core/poem-model.js`. Fechas en ISO 8601 (UTC). Identificadores con prefijo: `obra_`, `est_`, `ver_`.

## Obra (`Poem`)

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | texto | Identificador estable de la obra. |
| `schemaVersion` | número | Versión del esquema (actual: 2). |
| `title` | texto (≤120) | Título. |
| `createdAt`, `updatedAt` | ISO 8601 | Creación y última modificación. |
| `status` | `borrador` \| `final` | Estado. |
| `favorite` | booleano | Marcada como favorita. |
| `params` | objeto | Parámetros originales de generación (ver abajo). |
| `engine` | objeto \| null | `{ seed, ending: 'L'\|'E'\|'F', figure, engineVersion }`: permite reproducir la variante y mantener coherencia al regenerar. |
| `protagonists` | texto[] | Nombres separados. |
| `stanzas` | Estrofa[] | 1 a 8 estrofas, en orden. |
| `versions` | Versión[] | Hasta 50 instantáneas (se descartan las más antiguas). |
| `evaluation` | objeto \| null | Último informe del evaluador (metadato; no forma parte del texto). |
| `design` | objeto | Preferencias de la hoja: `preset, fontFamily, fontSize, align, lineHeight, border, ornaments, layout`. |

## Estrofa

`{ id, locked, verses: texto[] }`. 1 a 8 versos. `locked: true` impide editar, eliminar, regenerar y que las variantes la cambien.

## Versión

`{ id, label, createdAt, snapshot: { title, stanzas, params, engine } }`. Restaurar una versión guarda antes el estado actual como otra versión.

## Parámetros de generación

`names, gender ('o'|'a'), oficio, gusto, cualidad, lugar, anecdota, tone, audience ('general'|'educativo'), level, stanzas (2–8), verses (2–8), scheme ('pareada'|'alternada'|'abrazada'|'libre'), ending ('auto'|'L'|'E'|'F'), preferDialogue, mustInclude, avoid`.

## Archivo de respaldo

```json
{ "format": "calaverarte-respaldo", "schemaVersion": 2, "exportedAt": "…", "app": "CalaverArte", "poems": [ … ] }
```

Al importar se valida cada obra con una lista blanca de campos, se descartan las inválidas (con motivo), se migran las antiguas y los identificadores repetidos requieren una estrategia explícita: **omitir**, **copia** (nuevo id y «(importada)») o **reemplazar** (con confirmación). Límites: 5 MB y 2000 obras por archivo.

## Migraciones

`src/storage/migrations.js`. **v1 → v2:** las estrofas pasaban de arreglos de texto a objetos con `id` y `locked`; se añaden `design`, `favorite`, `versions`, `engine` y `evaluation`. La migración se aplica al leer de IndexedDB y al importar, no muta la entrada y es idempotente. Un registro de una versión futura se rechaza con un mensaje claro. La estructura de la base (almacén `poems` con índice `updatedAt`) tiene su propia versión `DB_VERSION = 1`.
