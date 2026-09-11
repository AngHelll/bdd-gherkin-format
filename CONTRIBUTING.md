# Contributing to BDD Gherkin Format

Companion ForgeOne extension: **Format Document** for `.feature` files only.  
**Never** add binding index, LSP, matching, Coach, or test run here — that is Guardian / Pilot / Jarvis.

## Prerequisites

- Node.js 20+
- VS Code / Cursor 1.85+

## Setup

```bash
npm install
npm run compile
npm test
```

Press **F5** to launch the Extension Development Host.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile TypeScript → `out/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (core fixtures) |
| `npm run package` | Build `bdd-gherkin-format.vsix` |
| `npm run verify:local` | Capa A: lint + test + VSIX + Capa B checklist |
| `npm run publish:check` | Capa C preflight |
| `npm run publish:marketplace` | Marketplace publish (maintainers, explicit order) |

## Architecture

| Layer | Role |
|-------|------|
| `src/core/` | Pure formatter — **no** `vscode` imports |
| `src/providers/` | VS Code formatting provider |
| `src/extension.ts` | Activation |

## Workflow (ForgeOne)

1. Ideation → gate *alineado, pasa a spec* (`docs-internal/specs/`)
2. Implement → `npm run verify:local` (Capa A)
3. Dogfood VSIX (Capa B) without Cucumber Official
4. Ship only after Capa B OK + explicit publish order

## Anti-scope (permanent)

No binding index, step matching, glue globs, diagnostics for unbound steps, generate binding, or run tests.
