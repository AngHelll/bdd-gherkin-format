# Feature: MVP Format Document — indent + table align

**Estado:** alineado  
**Versión:** v0.1.0  
**Fecha:** 2026-09-11

**Relacionado:** [docs/IDEATION.md](../../docs/IDEATION.md) · companion ForgeOne (Guardian mapa / Pilot run)

---

## Alineación (Stage 2)

| Campo | Valor |
|-------|-------|
| Idea | Formatter **mudo** para `.feature`: indent + alinear tablas. Sin índice de bindings. |
| Roadmap | ✅ Next MVP indent + alinear tablas |
| Versión sugerida | **v0.1.0** |
| MVP | Clasificador + indent + pad tablas + Format Document/Selection + fixtures + README ForgeOne |
| Fuera de scope | Índice, LSP, matching, Coach, generate, run, grammar TextMate, pretty-print Cucumber oficial, i18n keywords |
| Riesgo producto | bajo (layout only; mitigar fixtures + dogfood) |
| Pilot vs Guardian | no aplica — companion layout; language `gherkin` de Guardian |

**Gate producto:** ☑ alineado, pasa a spec (2026-09-11)

**North star:** *format que no arrastra un segundo indexador*.

---

## Spec (Stage 3)

### Problema / usuario

Al quitar Cucumber Official / Full Support del stack ForgeOne, falta Format Document en `.feature` sin reinstalar un bundle que indexe bindings y pelee con Guardian.

### Comportamiento esperado

#### A — Clasificador + indent

- [x] Clasificar líneas: Feature, Background, Scenario / Scenario Outline, Examples, steps (Given/When/Then/And/But), tags, comments, filas `|…|`, blank, other.
- [x] Aplicar indent fijo (2 espacios): Feature 0 · Scenario/Background/Examples 1 · steps 2 · table rows 3.
- [x] No reordenar líneas; no cambiar texto de steps salvo whitespace de indent y padding de celdas.

#### B — Alinear tablas

- [x] En bloques consecutivos de filas `|…|`, pad celdas al ancho máximo por columna.
- [x] Solo padding; no reordenar columnas ni filas.

#### C — VS Code provider

- [x] `DocumentFormattingEditProvider` + Format Selection para `gherkin` / `.feature`.
- [x] Setting `bddGherkinFormat.enabled` (default `true`).
- [x] **No** contribuir TextMate grammar; **no** indexar bindings.

#### D — Tests + docs

- [x] Fixtures Vitest (messy indent, tablas, golden).
- [x] README ForgeOne + link a Guardian; CHANGELOG v0.1.0.

### No haremos (anti-scope MVP)

- Índice / matching / F12 / generate / Coach / Pilot run / Jarvis
- LSP / language server
- Grammar TextMate completa / pretty-print estilo Cucumber oficial
- i18n keywords Gherkin (solo EN en clasificador MVP)
- Hard `extensionDependencies` a Guardian

### Archivos probables

| Área | Archivos |
|------|----------|
| core | `src/core/formatGherkin.ts`, `classify.ts`, `alignTables.ts` |
| provider | `src/providers/gherkinFormattingProvider.ts`, `src/extension.ts` |
| tests | `src/__tests__/formatGherkin.test.ts`, `src/__tests__/fixtures/` |
| docs | README, ROADMAP, CHANGELOG, CONTRIBUTING, esta spec |

### Verificación automática (Capa A)

- [ ] `npm run verify:local`
- [ ] Tests fixtures indent + tables

### Criterios técnicos (desarrollo)

- [ ] Lógica en `src/core/` sin importar `vscode`
- [ ] Provider delgado en `src/providers/`
- [ ] Diff mínimo; sin APIs Index/Run

### Verificación manual (Capa B — fijos + extras)

**Siempre:**

- [ ] Instalar `bdd-gherkin-format.vsix` (Install from VSIX…)
- [ ] Abrir workspace con Guardian + `.feature` **sin** Cucumber Official / alexkrechik
- [ ] Format Document en un `.feature` → indent + tablas alineadas

**Extras MVP:**

- [ ] Format Selection en un bloque de tabla
- [ ] Samples Guardian (`binding-demo`) + 1 dogfood real (`automation-web-csharp` si disponible)
- [ ] Confirmar que no aparecen diagnostics/index propios de esta extensión

### Criterio “listo para ship”

Capa A verde · Capa B fijos + extras OK · CHANGELOG/ROADMAP/README actualizados · KPI dogfood Format sin terceros.

**Gate spec:** ☑ spec aprobada, implementa

---

## Implementación (Stage 4)

- Archivos tocados: `src/core/*`, `src/providers/gherkinFormattingProvider.ts`, `src/extension.ts`, `package.json`, scripts Capas, fixtures, README/CHANGELOG/CONTRIBUTING
- Tests: 20 (fixtures + dogfood Guardian samples + automation-web-csharp)
- VSIX generado: `bdd-gherkin-format.vsix` (v0.1.0)

## Verificación (Stage 5)

- Capa A: `npm run verify:local` verde
- Capa B (automatizada): dogfood corpus idempotente, step text intacto, sin Cucumber Official
- Capa B (manual UI): Install from VSIX + Format Document en editor — checklist en verify:local

## Ship (Stage 6)

- Tag: `v0.1.0`
- Marketplace: `anghelll.bdd-gherkin-format` v0.1.0
