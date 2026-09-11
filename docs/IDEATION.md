# Ideación — BDD Gherkin Format

> **Modo:** producto · Stage 1 IDEAR  
> **Repo:** `bdd-gherkin-format` (companion de [bdd-guardian](../bdd-guardian))  
> **No** vive en el ROADMAP de Guardian.

## Qué es

Extensión VS Code **separada** de BDD Guardian: Format Document / Format Selection en `.feature` (indent + alinear tablas). Sin índice, sin matching, sin Coach, sin Pilot.

**Anti-scope (MVP):** fancy pretty-print, i18n keywords, LSP, generate, grammar completa, índice/bindings.

*(Rule + DocString fence indent shipped in v0.1.0 as early hardening.)*


## Por qué aparte

- Guardian = mapa step ↔ binding; format = layout. Mezclarlos diluye el north star.
- Publicar / versionar sin acoplar releases de matching.
- El usuario puede quitar Cucumber oficial / Full Support y conservar Format.

## Diferenciador (no “mejor formatter”)

Los incumbentes ganan por **bundle** (grammar + format + F12 genérico). No competimos ahí.

**Diferenciador ForgeOne:** *format que no arrastra un segundo indexador*.

| Extensión | Format | Side effect típico |
|-----------|--------|--------------------|
| Cucumber oficial | Sí | LSP + `undefined-step` + globs `cucumber.glue` |
| Full Support (alexkrechik) | Sí | Autocomplete / validación con globs manuales |
| **BDD Gherkin Format** | Sí | **Ninguno** — no indexa bindings |

Thesis: el dolor real al “quitar la oficial” no es echar de menos el prettier; es **dejar de pelearse con dos resolvers**. Un formatter mudo cierra el hueco de layout sin reabrir el conflicto de mapa.

Secondary (opcional v0.2+): recommendation cruzada / `extensionPack` mental — Format + Guardian + Pilot = stack sin Cucumber oficial.

## Métrica de oportunidad

**KPI primario (dogfood / suite propia):**

> `% de repos ForgeOne / samples donde Format Document en `.feature` funciona **sin** `CucumberOpen.cucumber-official` ni `alexkrechik.cucumberautocomplete` instaladas.

- Baseline hoy: ~0 % (depende de tercero o no-op).
- Target companion MVP: **100 %** en samples Guardian + 1 repo real de dogfood.

**KPI secundario (Marketplace — débil, no gate):**

| Señal | Umbral “vale la pena seguir” | Umbral “mantener modo mantenimiento” |
|-------|------------------------------|--------------------------------------|
| Installs 90d | ≥ 200 *y* ≥ 30 % co-install con Guardian (si telemetría/Marketplace lo permite aproximar) | < 50 installs / 90d |
| Issues “rompe mi feature” | 0 P0 en 30d post-MVP | Cualquier P0 de corrupción de layout |

**No usar** installs absolutos vs Cucumber oficial como éxito — el mercado está saturado; el éxito es **independencia del stack Guardian**.

## Estimación MVP

| Pieza | Esfuerzo |
|-------|----------|
| Clasificador de líneas + indent + pad tablas | 0.5–1 d |
| `DocumentFormattingEditProvider` + tests fixtures | 0.5 d |
| README + recommendation cruzada Guardian | 0.5 d |
| **Total** | **~1.5–2 d** |

## Gate

- *solo backlog* — ✅ ideación movida aquí (2026-09-11)
- *alineado, pasa a spec* — spec MVP en este repo
- *pospuesto* — no publicar; reabrir si dogfood echa de menos Format al quitar la oficial
