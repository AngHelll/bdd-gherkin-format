# BDD Gherkin Format

VS Code / Cursor extension: **mute presentation** for `.feature` files —

1. **Format Document** — indent + align tables  
2. **Syntax highlighting** — keywords, steps, comments, tags, tables, strings (theme scopes)

**No binding index. No LSP. No step matching.** Companion to [BDD Guardian](https://github.com/AngHelll/bdd-guardian).

| | |
|--|--|
| **Marketplace** | `anghelll.bdd-gherkin-format` |
| **Version** | **0.2.0** |
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

- Indent Feature / Rule / Scenario / steps / Examples / tables (2-space units)
- Align consecutive `|…|` table columns (padding only)
- Format Selection
- TextMate highlighting: structural keywords, step keywords, `#` comments, `@tags`, tables, quotes, DocString fences
- Language id `gherkin` for `.feature` (works even without Guardian)

## What it does **not** do

- Index or validate step bindings (no bound/unbound colors — that is Guardian)
- Autocomplete, diagnostics, generate binding, run tests
- LSP / undefined-step / glue globs
- Custom color palette (uses your VS Code theme scopes)
- Full i18n Gherkin keyword sets (English keywords in v0.2)

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `bddGherkinFormat.enabled` | `true` | Enable Format Document / Selection |

## Develop

```bash
npm install
npm run verify:local   # lint + tests + VSIX (Capa A)
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) · [ROADMAP.md](./ROADMAP.md) · [docs/IDEATION.md](./docs/IDEATION.md) · [docs/EXTENSION_PACK.md](./docs/EXTENSION_PACK.md)

## License

MIT
