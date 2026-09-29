import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { allDialectWords, allStepWords } from '../core/dialects';

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

  it('highlights keywords from the shared dialect table', () => {
    const alternatives = (match: string) => {
      const group = [...match.matchAll(/\(([^()]*)\)/g)]
        .map((item) => item[1])
        .find((value) => value.includes('|'));
      return (group ?? '').split('|');
    };
    const feature = String((grammar.repository.feature as { match: string }).match);
    const step = String((grammar.repository.step as { match: string }).match);
    const outline = String((grammar.repository.scenario_outline as { match: string }).match);
    for (const word of allDialectWords('feature')) {
      expect(alternatives(feature)).toContain(word);
    }
    for (const word of allDialectWords('scenarioOutline')) {
      expect(alternatives(outline)).toContain(word);
    }
    for (const word of allStepWords()) {
      expect(alternatives(step)).toContain(word);
    }
    expect(step).toContain('\\*');
  });

  it('highlights placeholders and numbers inside tables and injects docstring languages', () => {
    const table = grammar.repository.table as { patterns: Array<{ include?: string }> };
    const includes = table.patterns.map((pattern) => pattern.include);
    expect(includes).toContain('#placeholder');
    expect(includes).toContain('#number');
    const json = grammar.repository.docstring_json_triple as { patterns: Array<{ include?: string }> };
    expect(json.patterns.map((pattern) => pattern.include)).toContain('source.json');
    expect(grammar.repository.docstring_sql_triple).toBeDefined();
    expect(grammar.repository.docstring_triple).toBeDefined();
    const generic = grammar.repository.docstring_triple as {
      beginCaptures: { '3': { name: string } };
    };
    expect(generic.beginCaptures['3'].name).toMatch(/comment/);
    const typed = grammar.repository.docstring_json_triple as {
      beginCaptures: { '3': { name: string } };
    };
    expect(typed.beginCaptures['3'].name).toBe('keyword.other.content-type.gherkin');
  });
});
