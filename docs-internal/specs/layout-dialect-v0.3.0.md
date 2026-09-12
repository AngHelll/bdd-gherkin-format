# Feature: v0.3.0 — dialecto EN + language config + layout settings

**Estado:** implementado  
**Versión:** v0.3.0  
**Fecha:** 2026-09-12

**Relacionado:** MVP format v0.1.0 · grammar v0.2.0 · thesis presentación muda

---

## Alineación

| Campo | Valor |
|-------|-------|
| Idea | Cerrar huecos de presentación: sinónimos EN, editor language config, indentSize / alignNumbers. Sin mapa. |
| Fuera de scope | Índice, LSP, matching, i18n completa, outline, snippets |

**North star:** *presentación muda* — el `.feature` se escribe como lenguaje, no como texto plano.

---

## Comportamiento

- Classifier + grammar: `Example`, `Scenario Template`, `Scenarios`, `Business Need`, `Ability`, `*`
- `language-configuration.json`: fold off-side, onEnter / indentationRules, wordPattern `@tag` / `<placeholder>`
- `bddGherkinFormat.indentSize` (null → editor tab size) + `[gherkin].editor.tabSize` 2
- Tablas: números a la derecha (opt-out `alignNumbers: false`); `\|` no parte celdas

**Anti-scope:** bindings, undefined-step, generate, semantic tokens de mapa.
