# Plan: presentación v0.5 → v0.9

**Estado:** implementado en 0.8.0 (pack aparte en `extension-pack/`)  
**Fecha:** 2026-09-28  
**Actual:** v0.8.0

**Tesis:** cada corte mejora cómo se ve o cómo se edita el `.feature`. Ninguno indexa bindings. Guardian sigue siendo el único mapa step ↔ código.

**Spec por corte:** al arrancar una versión, copiar su sección a `docs-internal/specs/<nombre>-v0.x.0.md` y marcar el gate. Este archivo es el orden, no el spec de implementación.

---

## Decisiones cerradas

| Decisión | Resolución |
|----------|------------|
| Modelo de estructura | Un solo recorrido de líneas clasificadas (`structure`) alimenta outline, folding, selección y resaltado de placeholders. El clasificador de `classify.ts` sigue siendo la fuente de keywords. |
| `bddGherkinFormat.enabled` | Apaga Format Document / Selection. No apaga grammar, snippets, outline, folding ni resaltado. |
| Políticas de layout (v0.6) | Todas opt-in, default `false` / `"preserve"`. Format-on-save no cambia el diff hasta que alguien las enciende. |
| Folding | `FoldingRangeProvider` por keyword reemplaza `folding.offSide`. Los dos a la vez duplican regiones. |
| Fila de tabla con Enter | Comando + keybinding. `onEnterRules.appendText` es estático y no conoce el número de columnas. |
| DocString embebido | Allowlist de content types. Un tipo desconocido se queda en `meta.embedded.docstring.gherkin`. |
| i18n | Tabla de dialectos compartida por clasificador y grammar. El grammar no se mantiene a mano en paralelo. |
| Pack | VSIX aparte, sin `extensionDependencies` en esta extensión. |
| Fuera de estas versiones | Reescribir `*` → `Given`, cambiar mayúsculas de keywords, ordenar tags, ordenar escenarios, colores bound/unbound, F12, autocomplete de steps, paleta propia. |

Dogfood de 30 días corre en paralelo. No bloquea v0.5 (no cambia la salida del formatter). Sí decide si alguna política de v0.6 pasa de opt-in a default.

---

## v0.5 — el `.feature` como lenguaje en el editor

Outline, movimiento por estructura, huecos de grammar y snippets. La salida de Format Document queda igual que en v0.4 salvo que el usuario no toque settings nuevos (no hay settings nuevos de layout).

### 1. Outline, breadcrumbs, sticky scroll

`DocumentSymbolProvider` sobre el recorrido de estructura.

| Símbolo | Origen |
|---------|--------|
| Feature | `Feature` / `Business Need` / `Ability` + título |
| Rule | `Rule` + título |
| Background | `Background` |
| Scenario | `Scenario` / `Example` + título |
| Scenario Outline | `Scenario Outline` / `Scenario Template` + título |
| Examples | `Examples` / `Scenarios` + título si existe |

El rango de un símbolo va de su línea (incluyendo tags inmediatamente anteriores) hasta la línea anterior al siguiente hermano. Steps y filas de tabla no son símbolos: el outline se llenaría de ruido.

Sticky scroll y breadcrumbs los pinta el editor a partir de esos símbolos. Default de lenguaje: `editor.stickyScroll.enabled: true` en `[gherkin]`.

### 2. Folding por keyword

`FoldingRangeProvider` con las mismas regiones que el outline (Feature, Rule, Background, Scenario, Scenario Outline, Examples). Quitar `folding.offSide` de `language-configuration.json`.

### 3. Rangos de selección

`SelectionRangeProvider`, de dentro hacia fuera:

1. `<placeholder>` si el cursor está dentro de uno
2. línea de step, tag, fila o fence
3. bloque Scenario / Background / Examples
4. Rule
5. Feature

### 4. Placeholders y números en tablas

En `syntaxes/gherkin.tmLanguage.json`, el patrón `table` hoy pinta cada celda como `string.unquoted`. Anidar los patrones que el step ya usa: `placeholder` (`variable.parameter.gherkin`) y `number` (`constant.numeric.gherkin`). El `\|` escapado sigue siendo parte de la celda.

### 5. Inyección de DocString

Fences `"""` y `` ``` ``. El content type (texto tras el fence de apertura) elige el grammar embebido.

| Content type | Include |
|--------------|---------|
| `json` | `source.json` |
| `xml` | `text.xml` |
| `sql` | `source.sql` |
| `yaml` / `yml` | `source.yaml` |
| `html` | `text.html.basic` |
| vacío u otro | sin include; scope genérico actual |

El content type en la línea de apertura sigue con un scope de keyword léxico, no de comentario genérico.

### 6. Enter en una fila `|`

Comando `bddGherkinFormat.insertTableRow`. Keybinding Enter cuando `editorLangId == gherkin` y la línea actual coincide con `^\s*\|`.

Comportamiento: newline + fila esqueleto con el mismo número de columnas (`|  |  |`), caret en la primera celda. Si la línea no es una fila de tabla, Enter hace lo de siempre. No reformatea el bloque; el alineado sigue siendo Format Document.

### 7. Snippets estructurales

`snippets/gherkin.code-snippets`, lenguaje `gherkin`.

| Prefijo | Cuerpo |
|---------|--------|
| `feature` | Feature + descripción |
| `rule` | Rule |
| `background` | Background + un step vacío |
| `scenario` | Scenario + Given / When / Then con tabstops de texto libre |
| `outline` | Scenario Outline + Examples con una columna `<placeholder>` |
| `examples` | Examples + fila cabecera + fila de datos |
| `docstring` | fence `"""` con tabstop de content type |

Los tabstops de step son texto que escribe el usuario. No hay catálogo de steps ni sugerencias sacadas de bindings.

### Archivos

| Área | Archivos |
|------|----------|
| estructura | `src/core/structure.ts` (nuevo), `src/core/classify.ts` |
| providers | `src/providers/gherkinStructureProviders.ts` (nuevo), `src/providers/insertTableRow.ts` (nuevo), `src/extension.ts` |
| grammar | `syntaxes/gherkin.tmLanguage.json` |
| editor | `language-configuration.json`, `snippets/gherkin.code-snippets`, `package.json` (`contributes.snippets`, comando, keybinding, `configurationDefaults`) |
| tests | `src/__tests__/structure.test.ts`, `grammar.test.ts` |

### Hecho cuando

- Outline de un `.feature` con Rule + Outline + Examples muestra esa jerarquía y nada de steps.
- Folding pliega Scenario sin depender del indent de la descripción.
- Expand selection sube step → scenario → feature.
- Una celda `<email>` y un `10.5` dentro de `|` usan los scopes de placeholder y número.
- `"""json` inyecta `source.json`; `"""gherkin-no-such` no inyecta.
- Enter sobre `| a | b |` inserta una fila de 2 columnas.
- Snippets insertan esqueleto, sin frases de step precocinadas.
- `npm run verify:local`. Un fixture v0.4 formateado otra vez no cambia.

---

## v0.6 — políticas de layout, opt-in

Todas viven en `formatGherkin` (puro, sin `vscode`). El provider solo lee settings. Cada opción es idempotente: formatear dos veces da el mismo texto. Format Selection no reescribe líneas fuera del rango; una política que necesite el bloque entero (blank lines, alinear steps) aplica al bloque que toca el rango y deja el resto igual.

Orden dentro del formatter, después del indent contextual de v0.4:

1. Espacio canónico de keywords
2. Alinear columna del step
3. Política de tags
4. Indent relativo de DocString
5. Política de líneas en blanco
6. Alinear tablas (ya existe; sigue al final porque el ancho depende del texto de la celda)

### Settings

| Setting | Default | Valores |
|---------|---------|---------|
| `bddGherkinFormat.keywordSpacing` | `false` | `true`: un espacio tras keyword de step; en keywords con título, `": "` si hay título y `":"` si no hay. No cambia mayúsculas. No convierte `*`. |
| `bddGherkinFormat.alignStepKeywords` | `false` | `true`: dentro de cada bloque contiguo de steps (Background o Scenario), pad del keyword para que el texto empiece en la misma columna. `*`, `And` y `But` entran en el cálculo. |
| `bddGherkinFormat.tagLayout` | `"preserve"` | `"onePerLine"`: parte `@a @b` en una línea por tag, al indent que ya tenían. No ordena. |
| `bddGherkinFormat.indentDocStrings` | `false` | `true`: el cuerpo del fence conserva el indent relativo interno y se desplaza al indent del fence + `indentSize`. Líneas vacías siguen vacías. No se reformatea JSON, SQL ni ningún contenido. |
| `bddGherkinFormat.blankLines` | `"preserve"` | `"pretty"`: ver reglas abajo. |

### `blankLines: "pretty"`

- Cero líneas en blanco entre steps consecutivos.
- Cero líneas en blanco entre un bloque de tags y el keyword que califican.
- Una línea en blanco antes de `Rule`, `Background`, `Scenario`, `Scenario Outline` y `Examples`, cuando no es la primera línea de contenido.
- Una línea en blanco entre el fin de un escenario y el siguiente (los tags del siguiente quedan pegados a él, con la línea en blanco encima de los tags).
- No colapsar ni inventar líneas en blanco dentro de un DocString.
- Comentarios `#` se quedan en su sitio; no se separan de la línea estructural a la que el indent contextual ya los ancló. Como máximo una línea en blanco seguida.

### Archivos

`src/core/formatGherkin.ts`, `src/providers/gherkinFormattingProvider.ts`, `package.json` (settings), `src/__tests__/formatGherkin.test.ts`, README, CHANGELOG.

### Hecho cuando

- Con todos los defaults, la salida es idéntica a v0.5.
- Cada setting, encendido solo, tiene fixture messy → golden → segunda pasada idéntica.
- Combinación de los cinco encendidos también es idempotente.
- `npm run verify:local`.

---

## v0.7 — placeholder ↔ columna de Examples

`DocumentHighlightProvider`. Solo dentro del Scenario Outline que contiene el cursor.

Si el cursor está en `<email>` en un step, o en la celda cabecera `email` de Examples, resaltar:

- cada `<email>` de los steps de ese Outline
- la celda cabecera `email` (nombre sin `<>`)
- no otras columnas
- no un `<email>` de otro Outline del mismo archivo

Lectura léxica del archivo. No consulta bindings ni abre código de steps.

Depende del recorrido de estructura de v0.5 para saber cuál es el Outline contenedor y cuál bloque Examples le pertenece (el Examples que sigue a ese Outline antes del siguiente Scenario / Rule / Feature).

### Archivos

`src/core/structure.ts`, `src/providers/gherkinStructureProviders.ts`, `src/__tests__/structure.test.ts`, `src/extension.ts`.

### Hecho cuando

- Dos Outlines con `<email>` en el mismo archivo: el highlight no cruza del uno al otro.
- Un step sin Outline no resalta columnas.
- `npm run verify:local`.

---

## v0.8 — keywords i18n

El dialecto activo sale de la primera línea `# language: <iso>` (comentario de idioma de Gherkin). Sin esa línea, el dialecto es `en`, igual que hoy.

### Mecanismo

- `src/core/dialects.ts`: mapa iso → keywords (feature, rule, background, scenario, scenarioOutline, examples, given, when, then, and, but). Datos, no regex copiados en tres sitios.
- `classify.ts` y `indent` usan el dialecto del documento.
- Un script `scripts/generate-grammar-keywords.mjs` vuelca las alternaciones de keywords al grammar (o a un fragmento incluido por él) desde el mismo mapa. `grammar.test.ts` comprueba que el grammar contiene los keywords del mapa, no una lista escrita a mano.
- Primer datos: `en` (los sinónimos ya shippeados: Example, Scenario Template, Scenarios, Business Need, Ability), `es`, `pt`. Añadir otro iso es una fila de datos más el regenerate, no un cambio de proveedor.

Los providers de v0.5 y el highlight de v0.7 tienen que clasificar con el dialecto del documento. Si v0.5 construye la estructura solo con regex EN, v0.8 cambia esa entrada para recibir el dialecto. No un segundo clasificador.

Políticas de v0.6 (`keywordSpacing`, `alignStepKeywords`) usan los keywords del dialecto activo.

### Archivos

`src/core/dialects.ts`, `src/core/classify.ts`, `scripts/generate-grammar-keywords.mjs`, `syntaxes/gherkin.tmLanguage.json`, tests de classify + grammar + un fixture `# language: es`.

### Hecho cuando

- Sin `# language:`, el comportamiento es el de v0.7.
- Un feature en `es` indenta, pliega y resalta `Característica` / `Escenario` / `Dado` como sus equivalentes EN.
- Un iso desconocido cae a `en` y no rompe el format.
- `npm run verify:local`.

---

## v0.9 — extension pack (opcional, VSIX aparte)

No vive en el `package.json` de esta extensión. Un paquete mínimo, repo o carpeta aparte, cuya única contribución es:

```json
"extensionPack": [
  "anghelll.bdd-gherkin-format",
  "anghelll.bdd-guardian"
]
```

Pilot y Jarvis quedan fuera del pack duro: siguen siendo opcionales, como en `docs/EXTENSION_PACK.md`. Sin `extensionDependencies` en Format ni en Guardian.

**Gate para publicarlo:** Format y Guardian publicados en Marketplace con ids estables. Si el gate no se cumple, esta versión no se corta y el pack mental del markdown sigue siendo el contrato.

No hay cambio de formatter ni de grammar en este corte.

---

## Orden

```
v0.5 estructura + grammar + snippets + Enter en tablas
        │
        ├─ v0.6 políticas de layout (no depende de símbolos; sí del formatter actual)
        │
        └─ v0.7 highlight de placeholders (depende de structure)
                │
                └─ v0.8 i18n (el clasificador que usa structure pasa a ser dialect-aware)
v0.9 pack, cuando el gate de Marketplace se cumpla; no bloquea 0.5–0.8
```

v0.6 puede implementarse en paralelo a v0.5 si no toca `structure.ts`. v0.7 espera a que el recorrido de estructura exista. v0.8 espera a v0.7 para no rehacer el highlight en EN y otra vez en dialecto.

## Anti-scope de todo el plan

Índice de bindings, LSP, F12, generate, autocomplete de frases de step, diagnósticos undefined-step, semantic tokens bound/unbound, paleta de colores propia, hard dependency entre extensiones ForgeOne.
