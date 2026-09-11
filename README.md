# BDD Gherkin Format

VS Code / Cursor extension: **Format Document** for `.feature` files — indent + align tables.

**No binding index. No LSP. No step matching.** Companion to [BDD Guardian](https://github.com/AngHelll/bdd-guardian).

| | |
|--|--|
| **Marketplace** | `anghelll.bdd-gherkin-format` (v0.1.0) |
| **Publisher** | anghelll |

## Why a separate extension?

ForgeOne splits concerns on purpose:

| Extension | Role |
|-----------|------|
| **BDD Gherkin Format** (this) | Layout `.feature` — indent + table align |
| [**BDD Guardian**](https://github.com/AngHelll/bdd-guardian) | Step ↔ binding map (CodeLens, F12, Coach) |
| [**BDD Pilot**](https://github.com/AngHelll/bdd-pilot) | Run tests / TRX |
| [**BDD Jarvis**](https://github.com/AngHelll/bdd-jarvis) | Workspace insights / context packs |

Incumbent formatters (Cucumber Official, Full Support) ship format **bundled with** a second resolver. This extension is **mute**: it only touches whitespace so you can drop those bundles without fighting Guardian over the map.

## Install

1. Install from Marketplace: **BDD Gherkin Format**, or `Install from VSIX…` → `bdd-gherkin-format.vsix`
2. Recommended: also install [BDD Guardian](https://marketplace.visualstudio.com/items?itemName=anghelll.bdd-guardian) (language `gherkin` + bindings)
3. Open a `.feature` → **Format Document**

Disable with `bddGherkinFormat.enabled: false`.

## What it does

- Indent Feature / Rule / Scenario / steps / Examples / tables (2-space units)
- Align consecutive `|…|` table columns (padding only)
- Format Selection (range) for partial edits
- Basic DocString fence indent (body left intact)

## What it does **not** do

- Index or validate step bindings
- Autocomplete, diagnostics, generate binding, run tests
- Contribute a TextMate grammar (use Guardian for highlighting)
- Cucumber-official-style full pretty-print / i18n keywords

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
