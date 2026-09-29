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
| ✅ Shipped | **v0.8.0** — outline, folding, selección, grammar, snippets, layout opt-in, placeholder highlight, i18n `en`/`es`/`pt` |
| ✅ Shipped | **v0.9** — pack manifest aparte (`extension-pack/`), sin dependency en esta extensión |
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

## Plan v0.5 → v0.9

Detalle: [docs-internal/specs/plan-presentation-v0.5-v0.9.md](./docs-internal/specs/plan-presentation-v0.5-v0.9.md). Implementado en **0.8.0** de esta extensión. El pack vive en [extension-pack/](./extension-pack/) y se publica aparte.

Dogfood 30d sigue decidiendo si alguna política de layout (`blankLines`, `tagLayout`, `alignStepKeywords`, `indentDocStrings`, `keywordSpacing`) pasa de opt-in a default.

---

*MVP 2026-09-11 · presentation grammar 2026-09-11 · pretty comments 2026-09-24 · plan v0.5–v0.9 implementado 2026-09-28*
