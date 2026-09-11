# Mental extension pack (ForgeOne)

Not a published `extensionPack` VSIX — soft recommendations so each extension stays installable alone.

| Install | Role |
|---------|------|
| `anghelll.bdd-gherkin-format` | Presentation — layout + syntax colors |
| `anghelll.bdd-guardian` | Map — step ↔ binding (recommended) |
| `anghelll.bdd-pilot` | Run (optional) |
| `anghelll.bdd-jarvis` | Insights (optional) |

Hard `extensionDependencies` are intentionally **not** set.

**Split:** Format owns how `.feature` looks; Guardian owns what steps mean. Format must not index bindings; Guardian must not own TextMate presentation (delegated to Format as of v0.2).
