# BDD Gherkin Format — Roadmap

> Companion de [BDD Guardian](https://github.com/AngHelll/bdd-guardian): **presentación** `.feature` (layout + syntax).  
> Ideación: [docs/IDEATION.md](./docs/IDEATION.md) · Specs: [docs-internal/specs/](./docs-internal/specs/)

## At a glance

| Status | Item |
|--------|------|
| ✅ Shipped | **v0.1.0** — indent + table align |
| ✅ Shipped | **v0.2.0** — TextMate syntax highlighting (presentation mute) |
| ✅ Shipped | **v0.3.0** — dialecto EN, language config, indentSize / alignNumbers |
| ✅ Shipped | **v0.4.0** — indent contextual de `#` y descripciones |
| 🎯 Next | Dogfood 30d / outline + snippets estructurales |
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

## Post-v0.4

| Item | Notes |
|------|-------|
| Outline / sticky scroll | Estructura del archivo, no mapa |
| Snippets estructurales | Feature / Scenario / Outline — sin steps indexados |
| Pretty blank-line policy | Solo si dogfood lo pide |
| i18n keywords (grammar + classifier) | Solo si dogfood lo pide |
| extensionPack VSIX | Opcional |

---

*MVP 2026-09-11 · presentation grammar 2026-09-11 · pretty comments 2026-09-24*
