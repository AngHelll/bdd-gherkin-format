# BDD Gherkin Format — Roadmap

> Companion de [BDD Guardian](https://github.com/AngHelll/bdd-guardian): **solo** Format Document en `.feature`.  
> Ideación: [docs/IDEATION.md](./docs/IDEATION.md) · Spec MVP: [docs-internal/specs/mvp-format-v0.1.0.md](./docs-internal/specs/mvp-format-v0.1.0.md)

## At a glance

| Status | Item |
|--------|------|
| ✅ Shipped | **v0.1.0** — indent + table align + Rule/DocString basics |
| 🎯 Next | Dogfood 30d / mantenimiento |
| 📋 Gate | *alineado* (post-ship) |
| 🏁 Goal | Format `.feature` sin segundo indexador (stack ForgeOne sin Cucumber oficial) |

**No hace:** matching, F12, generate, Coach, run tests (eso es Guardian / Pilot).

## Plan MVP v0.1.0 — verificado

| # | Item | Status |
|---|------|--------|
| A | Clasificador + indent | ✅ |
| B | Alinear tablas `\|…\|` | ✅ |
| C | DocumentFormatting + Selection | ✅ |
| D | Fixtures + README ForgeOne | ✅ |
| Capas A–C | verify:local · dogfood corpus · publish | ✅ |

## Differentiator

Format **mudo**: no indexa bindings → no pelea con Guardian ni con Cucumber oficial por el mapa.

## Relación ForgeOne

| Extensión | Rol |
|-----------|-----|
| **bdd-gherkin-format** | Layout `.feature` |
| bdd-guardian | Mapa step ↔ binding |
| bdd-pilot | Ejecución |
| bdd-jarvis | Insights |

Mental pack: [docs/EXTENSION_PACK.md](./docs/EXTENSION_PACK.md)

## Post-MVP

| Item | Notes |
|------|-------|
| i18n keywords | Solo si dogfood lo pide |
| Published extensionPack VSIX | Opcional; hoy recommendation mental |

---

*Moved from bdd-guardian `docs-internal/ideas/` — 2026-09-11 · MVP shipped 2026-09-11*
