# Feature: v0.2.0 — Syntax highlighting (TextMate) as presentation layer

**Estado:** alineado  
**Versión:** v0.2.0  
**Fecha:** 2026-09-11

**Relacionado:** MVP format v0.1.0 · thesis ForgeOne presentation vs map

---

## Alineación (Stage 2)

| Campo | Valor |
|-------|-------|
| Idea | Format asume **presentación** del `.feature`: layout **+** colores léxicos (keywords, steps, comments, tags, tables, strings, docstrings). **No** bound/unbound. |
| Roadmap | 🆕 v0.2.0 presentation mute |
| Versión sugerida | **v0.2.0** |
| MVP | TextMate mínima EN + `contributes.languages` + `grammars`; docs thesis; coexistence Guardian |
| Fuera de scope | Índice, matching, LSP, semantic tokens bound/unbound, i18n keywords, paleta propia (usar scopes de theme) |
| Riesgo producto | bajo (declarativo; no pelea con Guardian map) |
| Pilot vs Guardian | Guardian = mapa; Format = look; Pilot unchanged |

**Gate producto:** ☑ alineado, pasa a spec (2026-09-11)

**North star:** *presentación muda* — format + syntax colors **sin** segundo intérprete.

---

## Spec (Stage 3)

### Problema / usuario

Al quitar Cucumber Official se pierde highlighting. Guardian aporta language id `gherkin` pero no grammar. El usuario quiere diferenciar keywords / steps / comentarios **sin** invadir el mapa de bindings.

### Comportamiento esperado

- [ ] TextMate grammar con scopes estándar de theme:
  - Keywords estructurales: `Feature`, `Rule`, `Background`, `Scenario`, `Scenario Outline`, `Examples`
  - Step keywords: `Given`, `When`, `Then`, `And`, `But`, `*`
  - Comments `#…`
  - Tags `@…`
  - Table rows `|…|`
  - Quoted strings in steps
  - DocString fences `"""` / ` ``` `
- [ ] `contributes.languages` id `gherkin` + ext `.feature` (Format solo también highlight)
- [ ] `contributes.grammars` → `language: gherkin`
- [ ] Docs: Format = layout + syntax; Guardian = map; **no** claim “Guardian highlighting”
- [ ] Guardian README: coexistence — Format owns presentation colors

### No haremos

- Colores bound/unbound / gutter / Problems
- Semantic token provider ligado a matching
- LSP / undefined-step
- Grammar i18n completa (EN only v0.2)
- Paleta de colores hardcodeada en la extensión

### Archivos

| Área | Path |
|------|------|
| grammar | `syntaxes/gherkin.tmLanguage.json` |
| package | `package.json` contributes languages + grammars + configurationDefaults |
| docs | README, CHANGELOG, ROADMAP, IDEATION, EXTENSION_PACK, esta spec |
| sibling | `bdd-guardian/README.md` coexistence |

### Verificación (Capa A)

- [ ] `npm run verify:local`
- [ ] Grammar JSON válido; VSIX incluye `syntaxes/`

### Criterio ship

Grammar en VSIX · docs thesis · Guardian coexistence note · Marketplace v0.2.0

**Gate spec:** ☑ spec aprobada, implementa
