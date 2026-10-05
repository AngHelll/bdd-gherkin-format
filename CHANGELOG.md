# Changelog

## [0.9.0] — 2026-10-05

### Added

- Tab / Shift+Tab move between table cells and realign the table; Tab on the last cell adds a row. Yields to completion, inline suggestions, snippets, multi-line selections, and Tab-moves-focus. Setting `tableTabNavigation`
- Align as you type: closing a cell with `|` pads its column without moving the caret. Setting `alignTablesOnType`; `editor.formatOnType` is on by default for `[gherkin]`
- Paste as Table: TSV from Excel or Google Sheets, or CSV with `,` or `;`, becomes an aligned Gherkin table. Quoted cells, embedded pipes (`\|`), and line breaks (`\n`) are handled. Pasting inside a table appends rows
- Copy Table for Excel: TSV that pastes back into the same grid
- Column commands: insert left / right, move left / right, delete; sort rows by column (header row fixed, numbers by value)
- **Gherkin Table** submenu in the editor context menu

### Changed

- Parse cache shared by structure providers and table commands

## [0.8.2] — 2026-10-05

### Changed

- Own Marketplace icon (document, indent steps, aligned table) instead of the Guardian shield. Same ForgeOne tile and stroke system; source in `media/icon-marketplace.svg`, exported with `npm run icon:export`
- ForgeOne pack (`extension-pack/`) gets its own icon, README, and repository metadata for Marketplace

## [0.8.1] — 2026-09-28

### Performance

- Activates only when a Gherkin document opens (`workspaceContains:**/*.feature` removed; Guardian, Pilot, and Jarvis already scan for it)
- Outline, folding, selection, and highlight share one parse per document version
- Format Document replaces only the changed lines instead of the whole document, so cursor, markers, and undo stay local and listeners in other extensions see small change events

### Fixed

- Enter on a table row now works: it only intercepts the key at the end of a row, and never while the suggest widget or an inline suggestion is visible

## [0.8.0] — 2026-09-28

### Added

- Outline, breadcrumbs, and sticky scroll for Feature, Rule, Background, Scenario, Scenario Outline, and Examples
- Folding by those keywords (replaces indent-based folding)
- Expand selection from a placeholder or step line up through the enclosing blocks
- Placeholder and number scopes inside table cells
- DocString injection for `json`, `xml`, `sql`, `yaml`/`yml`, and `html`
- Enter on a table row inserts a skeleton row with the same column count
- Structural snippets (`feature`, `rule`, `background`, `scenario`, `outline`, `examples`, `docstring`)
- Highlight of a `<placeholder>` and its Examples header cell, limited to the current Scenario Outline
- Dialects `en`, `es`, and `pt` from `# language:`, shared by the classifier and the TextMate grammar
- Opt-in layout settings, all off by default: `keywordSpacing`, `alignStepKeywords`, `tagLayout`, `indentDocStrings`, `blankLines`
- Separate ForgeOne pack manifest in `extension-pack/` (Format + Guardian only). This extension still has no `extensionDependencies`

## [0.4.0] — 2026-09-24

### Changed

- `#` comments and free-text descriptions (`other`) use contextual indent: look-ahead to the next structural line (skipping blanks / comments / descriptions), look-back at EOF — same idea as tags

## [0.3.0] — 2026-09-12

### Added

- Official EN dialect synonyms in classifier + TextMate grammar: `Example`, `Scenario Template`, `Scenarios`, `Business Need`, `Ability`, `*`
- Language configuration: off-side folding, indent / on-Enter after keywords, word pattern for `@tags` and `<placeholders>`
- Settings `bddGherkinFormat.indentSize` (null → editor tab size) and `bddGherkinFormat.alignNumbers` (default true)
- `[gherkin]` defaults `editor.tabSize: 2` and `editor.insertSpaces: true`

### Changed

- Numeric table cells are right-aligned by default (Cucumber Official / Excel)
- Table split keeps escaped `\|` inside a cell

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
