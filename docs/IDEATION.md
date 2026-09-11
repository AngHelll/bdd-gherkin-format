# Ideación — BDD Gherkin Format

> **Modo:** producto · presentación muda  
> **Repo:** `bdd-gherkin-format` (companion de [bdd-guardian](https://github.com/AngHelll/bdd-guardian))  
> **No** vive en el ROADMAP de Guardian.

## Qué es

Extensión VS Code **separada** de BDD Guardian: **cómo se ve** el `.feature` —

1. Format Document / Selection (indent + alinear tablas)
2. Syntax highlighting TextMate (keywords, steps, comments, tags, tables, strings)

Sin índice, sin matching, sin Coach, sin Pilot. **Sin** colores bound/unbound.

**Anti-scope permanente:** índice/bindings, LSP, generate, semantic tokens de mapa, glue globs.

## Por qué aparte

- Guardian = mapa step ↔ binding; Format = presentación (layout + colores léxicos).
- Publicar / versionar highlighting y format sin acoplar releases de matching.
- El usuario puede quitar Cucumber oficial / Full Support y conservar **look + format** sin segundo resolver.

## Diferenciador

Los incumbentes ganan por **bundle** (grammar + format + F12 genérico / LSP).

**Diferenciador ForgeOne:** *presentación que no arrastra un segundo indexador*.

| Extensión | Format | Highlight | Side effect típico |
|-----------|--------|-----------|--------------------|
| Cucumber oficial | Sí | Sí | LSP + `undefined-step` + globs `cucumber.glue` |
| Full Support (alexkrechik) | Sí | Sí | Autocomplete / validación con globs |
| **BDD Gherkin Format** | Sí | Sí (léxico) | **Ninguno de mapa** — no indexa bindings |
| BDD Guardian | No | No (language id only) | Mapa step ↔ binding |

Thesis: el dolor al “quitar la oficial” es pelearse con **dos resolvers**. Format cierra layout **y** colores de sintaxis sin reabrir el conflicto de mapa. Guardian sigue siendo el único intérprete.

Secondary: recommendation cruzada / pack mental — Format + Guardian + Pilot.

## KPI

**Primario:** Format Document + highlighting en `.feature` **sin** Cucumber Official ni alexkrechik, con Guardian para el mapa.

**Secundario (débil):** Marketplace installs / co-install con Guardian.

## Gates

- v0.1.0 format — ✅ shipped
- v0.2.0 syntax grammar — ✅ spec + implement
