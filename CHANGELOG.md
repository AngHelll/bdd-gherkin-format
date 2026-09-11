# Changelog

## [0.1.0] — 2026-09-11

### Added

- Mute **Format Document** / **Format Selection** for Gherkin `.feature` files
- Line classifier + fixed indent (Feature / Rule / Scenario / steps / Examples / tables)
- Align consecutive `|…|` table columns (padding only)
- Basic `Rule:` nesting and DocString fence indent (body preserved)
- Setting `bddGherkinFormat.enabled` (default `true`)
- Vitest fixtures + `verify:local` / `publish:check` ForgeOne Capas

### Notes

- Does **not** index bindings, contribute TextMate grammar, or run tests
- Companion to BDD Guardian (map) and BDD Pilot (run)
