import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const grammarPath = join(here, '..', '..', 'syntaxes', 'gherkin.tmLanguage.json');

describe('gherkin TextMate grammar', () => {
  const grammar = JSON.parse(readFileSync(grammarPath, 'utf8')) as {
    scopeName: string;
    patterns: unknown[];
    repository: Record<string, unknown>;
  };

  it('has expected scopeName and core repository entries', () => {
    expect(grammar.scopeName).toBe('text.gherkin.feature');
    expect(grammar.patterns.length).toBeGreaterThan(0);
    for (const key of [
      'comment',
      'tag',
      'feature',
      'rule',
      'scenario',
      'step',
      'table',
      'docstring_triple',
    ]) {
      expect(grammar.repository[key], key).toBeDefined();
    }
  });

  it('uses theme-friendly scopes (no binding semantics)', () => {
    const raw = readFileSync(grammarPath, 'utf8');
    expect(raw).toMatch(/keyword\.control\./);
    expect(raw).toMatch(/keyword\.other\.step/);
    expect(raw).toMatch(/comment\.line/);
    expect(raw).toMatch(/entity\.name\.tag/);
    expect(raw).not.toMatch(/bound|unbound|ambiguous|orphan/i);
  });
});
