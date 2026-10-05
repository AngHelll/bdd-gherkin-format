# BDD ForgeOne

Two extensions for `.feature` files that work together without fighting over the same job:

| Extension | What it does |
|-----------|--------------|
| [BDD Gherkin Format](https://marketplace.visualstudio.com/items?itemName=anghelll.bdd-gherkin-format) | Format Document, syntax colors, outline, folding, table helpers. No step index. |
| [BDD Guardian](https://marketplace.visualstudio.com/items?itemName=anghelll.bdd-guardian) | Step ↔ binding map: go to definition, CodeLens, unbound and ambiguous diagnostics, Coach. |

Format owns how the file looks. Guardian is the only extension that resolves steps to bindings, so you do not get two resolvers disagreeing (the usual pain with Cucumber Official or Cucumber Full Support installed next to a navigator).

Works with Reqnroll, SpecFlow, Cucumber (JS / Java), Godog, and Behave.

## Optional

- [BDD Pilot](https://marketplace.visualstudio.com/items?itemName=anghelll.bdd-pilot) — run tests and read TRX results. Not included; install it if you want execution inside the editor.

## Maintainers

This folder is published on its own (`npx @vscode/vsce publish` from `extension-pack/`). It is not part of the `bdd-gherkin-format` VSIX, and neither member sets `extensionDependencies`.
