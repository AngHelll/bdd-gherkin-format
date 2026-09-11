#!/usr/bin/env bash
# Capa A: verificación automática local (sin UI VS Code).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

SPEC_HINT="${1:-mvp-format-v0.1.0.md}"

echo "== BDD Gherkin Format verify:local (Capa A) =="

echo ""
echo "-- lint --"
npm run lint

echo ""
echo "-- unit tests --"
npm test

echo ""
echo "-- compile --"
npm run compile

echo ""
echo "-- package VSIX --"
npm run package
if [[ ! -f bdd-gherkin-format.vsix ]]; then
  echo "error: bdd-gherkin-format.vsix not found" >&2
  exit 1
fi
echo "VSIX OK: bdd-gherkin-format.vsix ($(wc -c < bdd-gherkin-format.vsix | tr -d ' ') bytes)"

echo ""
echo "=============================================="
echo "  CAPA B — CHECKLIST MANUAL (tu intervención)"
echo "=============================================="
echo ""
echo "  [ ] 1. Instalar bdd-gherkin-format.vsix"
echo "         Cursor → Extensions → ... → Install from VSIX..."
echo "         Ruta: $ROOT/bdd-gherkin-format.vsix"
echo ""
echo "  [ ] 2. Abrir .feature CON Guardian y SIN Cucumber Official / alexkrechik"
echo "         p.ej. bdd-guardian/samples/binding-demo"
echo ""
echo "  [ ] 3. Format Document → indent + tablas alineadas; sin diagnostics propios"
echo ""
if [[ -n "$SPEC_HINT" ]]; then
  echo "  Spec: docs-internal/specs/$SPEC_HINT"
  echo ""
fi
echo "  Cuando OK: di \"verificado, ship\" o pide más cambios."
echo "  Git (commit/push/tag): solo con orden explícita."
echo ""
echo "  Tras ship docs + Capa B OK:"
echo "  npm run publish:check"
echo "  npm run publish:marketplace  # solo con orden explícita \"publish\""
echo ""
