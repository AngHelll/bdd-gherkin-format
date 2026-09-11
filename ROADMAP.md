# BDD Gherkin Format — Roadmap

> Companion de [BDD Guardian](https://github.com/AngHelll/bdd-guardian): **presentación** `.feature` (layout + syntax).  
> Ideación: [docs/IDEATION.md](./docs/IDEATION.md) · Specs: [docs-internal/specs/](./docs-internal/specs/)

## At a glance

| Status | Item |
|--------|------|
| ✅ Shipped | **v0.1.0** — indent + table align |
| ✅ Shipped | **v0.2.0** — TextMate syntax highlighting (presentation mute) |
| 🎯 Next | Dogfood 30d / settings de layout opcionales |
| 🏁 Goal | Look del `.feature` sin segundo indexador |

**No hace:** matching, F12, generate, Coach, run tests, colores bound/unbound (Guardian).

## Relación ForgeOne

| Extensión | Rol |
|-----------|-----|
| **bdd-gherkin-format** | Layout + syntax colors |
| bdd-guardian | Mapa step ↔ binding |
| bdd-pilot | Ejecución |
| bdd-jarvis | Insights |

Mental pack: [docs/EXTENSION_PACK.md](./docs/EXTENSION_PACK.md)

## Post-v0.2

| Item | Notes |
|------|-------|
| Layout settings (`indentSize`, …) | Opcional v0.3 |
| i18n keywords (grammar + classifier) | Solo si dogfood lo pide |
| extensionPack VSIX | Opcional |

---

*MVP 2026-09-11 · presentation grammar 2026-09-11*
