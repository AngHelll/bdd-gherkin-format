# Feature: v0.4.0 — indent contextual de `#` y descripciones

**Estado:** implementado  
**Versión:** v0.4.0  
**Fecha:** 2026-09-24

**Relacionado:** MVP format v0.1.0 · layout dialect v0.3.0 · thesis presentación muda

---

## Alineación

| Campo | Valor |
|-------|-------|
| Idea | Indent de comentarios `#` y texto libre (`other`) por ancla contextual (look-ahead / look-back), como tags. |
| Fuera de scope | EOL comments en steps, blank-line policy, grammar changes, mapa/bindings |

**North star:** *presentación muda* — el `#` se alinea con el bloque al que pertenece.

---

## Comportamiento

1. Tras calcular indent estructural, resolver `comment` y `other` por ancla.
2. **Look-ahead:** saltar `blank`, `comment` y `other`; tomar la siguiente línea ancla y copiar su nivel.
3. **Look-back:** si no hay ancla (EOF), usar el indent de la última línea no-blank / no-comment / no-other.
4. DocString body: sin cambio (`preserveOriginal`).
5. Mid-line `#` en steps: texto del step (Gherkin); no se trata como comentario.

### Criterio de éxito

Format Document alinea `# language:`, notas pre-Scenario y descripciones libres con su bloque; idempotente; sin tocar texto de steps ni scopes TextMate.

**Anti-scope:** bindings, undefined-step, generate, semantic tokens de mapa.
