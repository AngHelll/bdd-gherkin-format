# BDD Gherkin Format

VS Code / Cursor extension: **mute presentation** for `.feature` files —

1. **Format Document** — indent + align tables  
2. **Syntax highlighting** — keywords, steps, comments, tags, tables, strings (theme scopes)

**No binding index. No LSP. No step matching.** Companion to [BDD Guardian](https://github.com/AngHelll/bdd-guardian).

| | |
|--|--|
| **Marketplace** | `anghelll.bdd-gherkin-format` |
| **Version** | **0.9.0** |
| **Publisher** | anghelll |

## Why a separate extension?

ForgeOne splits concerns on purpose:

| Extension | Role |
|-----------|------|
| **BDD Gherkin Format** (this) | How `.feature` **looks** — layout + syntax colors |
| [**BDD Guardian**](https://github.com/AngHelll/bdd-guardian) | What steps **mean** — step ↔ binding map |
| [**BDD Pilot**](https://github.com/AngHelll/bdd-pilot) | Run tests / TRX |
| [**BDD Jarvis**](https://github.com/AngHelll/bdd-jarvis) | Workspace insights / context packs |

Incumbents (Cucumber Official, Full Support) bundle format + highlighting **with** a second resolver. This extension stays **mute on the map**: presentation only, so you can drop those bundles without fighting Guardian.

## Install

1. Marketplace: **BDD Gherkin Format**, or Install from VSIX → `bdd-gherkin-format.vsix`
2. Recommended: [BDD Guardian](https://marketplace.visualstudio.com/items?itemName=anghelll.bdd-guardian) for bindings
3. Open a `.feature` → syntax colors apply; **Format Document** / format-on-save (defaults for `[gherkin]`)

If another formatter is installed (e.g. Cucumber Official), pick this one:

```json
"[gherkin]": {
  "editor.defaultFormatter": "anghelll.bdd-gherkin-format",
  "editor.formatOnSave": true
}
```

Disable formatting with `bddGherkinFormat.enabled: false` (highlighting stays).

## What it does

- Indent Feature / Rule / Scenario / steps / Examples / tables (2-space default; `indentSize` or editor tab size)
- Contextual indent for `#` comments and free-text descriptions (look-ahead / look-back, like tags)
- Official EN synonyms: `Example`, `Scenario Template`, `Scenarios`, `Business Need`, `Ability`, `*`
- Align consecutive `|…|` table columns (padding only; numeric cells right-aligned; `\|` stays in-cell)
- Format Selection
- Editor language config: Enter after keywords, `#` comments, `@tag` / `<placeholder>` word pattern
- Folding, outline, breadcrumbs, and sticky scroll by Feature / Rule / Scenario / Examples
- Expand selection from a placeholder or step up to the enclosing scenario and feature
- TextMate highlighting: structural keywords, step keywords, `#` comments, `@tags`, tables (including `<placeholders>` and numbers), quotes, DocString fences
- DocString content types `json`, `xml`, `sql`, `yaml`/`yml`, and `html` use the embedded grammar
- Enter on a `|` row inserts another row with the same number of columns
- Structural snippets: `feature`, `rule`, `background`, `scenario`, `outline`, `examples`, `docstring`
- `# language:` selects keyword dialect `en` (default), `es`, or `pt`
- Language id `gherkin` for `.feature` (works even without Guardian)

## Tables like a spreadsheet

- **Tab / Shift+Tab** move between cells and realign the table; Tab on the last cell adds a row. Tab keeps its usual job when a completion, an inline suggestion (Copilot), or a snippet is active
- **Align as you type** — closing a cell with `|` pads the column without moving the caret
- **Paste as Table** — paste a range copied from Excel, Google Sheets, or a CSV (`,` or `;`) as an aligned Gherkin table. Pasting inside a table appends rows. Pipes and line breaks in cells become `\|` and `\n`
- **Copy Table for Excel** — the table under the caret goes to the clipboard as TSV
- **Columns** — insert left / right, move left / right, delete
- **Sort rows** by the column under the caret, ascending or descending, numbers by value. The first row is treated as the header and stays put

All of these live in the editor context menu under **Gherkin Table** and in the Command Palette (`Gherkin:`).

## What it does **not** do

- Index or validate step bindings (no bound/unbound colors — that is Guardian)
- Autocomplete, diagnostics, generate binding, run tests
- LSP / undefined-step / glue globs
- Custom color palette (uses your VS Code theme scopes)
- Keyword dialects beyond `en`, `es`, and `pt`

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `bddGherkinFormat.enabled` | `true` | Enable Format Document / Selection |
| `bddGherkinFormat.indentSize` | `null` | Spaces per indent unit. `null` uses the editor tab size (Gherkin defaults to 2) |
| `bddGherkinFormat.alignNumbers` | `true` | Right-align numeric table cells (integers and decimals) |
| `bddGherkinFormat.alignTablesOnType` | `true` | Realign the table when you type `\|` (uses `editor.formatOnType`, on by default for Gherkin) |
| `bddGherkinFormat.tableTabNavigation` | `true` | Tab / Shift+Tab move between table cells |
| `bddGherkinFormat.keywordSpacing` | `false` | One space after a step keyword, and `: ` before a title |
| `bddGherkinFormat.alignStepKeywords` | `false` | Pad step keywords so the step text shares a column |
| `bddGherkinFormat.tagLayout` | `preserve` | `onePerLine` puts each `@tag` on its own line |
| `bddGherkinFormat.indentDocStrings` | `false` | Reindent a DocString body relative to its fence |
| `bddGherkinFormat.blankLines` | `preserve` | `pretty` puts one blank line before scenarios, rules, and examples |

## Develop

```bash
npm install
npm run verify:local   # lint + tests + VSIX (Capa A)
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) · [ROADMAP.md](./ROADMAP.md) · [docs/IDEATION.md](./docs/IDEATION.md) · [docs/EXTENSION_PACK.md](./docs/EXTENSION_PACK.md)

## License

MIT
