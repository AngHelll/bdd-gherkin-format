# Mental extension pack (ForgeOne)

Format and Guardian are both on the Marketplace. The installable pack is a **separate** extension, [extension-pack/package.json](../extension-pack/package.json), not a contribution of this VSIX.

| Install | Role |
|---------|------|
| `anghelll.bdd-gherkin-format` | Presentation — layout + syntax colors |
| `anghelll.bdd-guardian` | Map — step ↔ binding (in the pack) |
| `anghelll.bdd-pilot` | Run (optional, not in the pack) |
| `anghelll.bdd-jarvis` | Insights (optional, not in the pack) |

`extensionPack` in the separate manifest:

```json
["anghelll.bdd-gherkin-format", "anghelll.bdd-guardian"]
```

Hard `extensionDependencies` are intentionally **not** set on Format or on the pack. Publish `extension-pack/` with its own `vsce package`. Do not publish it from `npm run publish:marketplace` at the repository root.

**Split:** Format owns how `.feature` looks; Guardian owns what steps mean. Format must not index bindings; Guardian must not own TextMate presentation (delegated to Format as of v0.2).
