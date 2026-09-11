# Changelog

## [0.2.0] — 2026-09-11

### Added

- **Syntax highlighting** via TextMate grammar (`syntaxes/gherkin.tmLanguage.json`)
  - Structural keywords, step keywords, comments, tags, tables, strings, DocString fences
  - Theme-friendly scopes only — no bound/unbound semantics
- Language contribution `gherkin` + `.feature` + language configuration
- Default formatter / format-on-save for `[gherkin]` → this extension

### Changed

- Product thesis: Format = **presentation** (layout + syntax); Guardian = **map**
- README / ForgeOne docs no longer claim Guardian provides highlighting

## [0.1.0] — 2026-09-11

### Added

- Mute **Format Document** / **Format Selection** for Gherkin `.feature` files
- Line classifier + fixed indent (Feature / Rule / Scenario / steps / Examples / tables)
- Align consecutive `|…|` table columns (padding only)
- Basic `Rule:` nesting and DocString fence indent (body preserved)
- Setting `bddGherkinFormat.enabled` (default `true`)
- Vitest fixtures + `verify:local` / `publish:check` ForgeOne Capas

### Notes

- Does **not** index bindings or run tests
- Companion to BDD Guardian (map) and BDD Pilot (run)
