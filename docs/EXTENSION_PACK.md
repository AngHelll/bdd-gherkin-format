# Mental extension pack (ForgeOne)

Not a published `extensionPack` VSIX — soft recommendations so Format stays installable alone.

| Install | Role |
|---------|------|
| `anghelll.bdd-gherkin-format` | Layout |
| `anghelll.bdd-guardian` | Map (recommended) |
| `anghelll.bdd-pilot` | Run (optional) |
| `anghelll.bdd-jarvis` | Insights (optional) |

Hard `extensionDependencies` are intentionally **not** set — Format must not require Guardian to activate (pattern `**/*.feature` selector).
