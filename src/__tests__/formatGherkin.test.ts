import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { alignTableBlock, classifyLine, formatGherkin } from '../core';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = (name: string) => readFileSync(join(here, 'fixtures', name), 'utf8');

describe('classifyLine', () => {
  it('classifies structural keywords', () => {
    expect(classifyLine('Feature: X')).toBe('feature');
    expect(classifyLine('  Rule: Y')).toBe('rule');
    expect(classifyLine('Scenario Outline: Z')).toBe('scenario_outline');
    expect(classifyLine('Given foo')).toBe('step');
    expect(classifyLine('| a | b |')).toBe('table');
    expect(classifyLine('  """')).toBe('docstring_fence');
    expect(classifyLine('@tag')).toBe('tag');
    expect(classifyLine('# comment')).toBe('comment');
  });
});

describe('alignTableBlock', () => {
  it('pads cells to max column width', () => {
    const aligned = alignTableBlock(['| a | bb |', '| ccc | d |']);
    expect(aligned).toEqual(['| a   | bb |', '| ccc | d  |']);
  });
});

describe('formatGherkin fixtures', () => {
  const cases = [
    'messy-indent',
    'messy-tables',
    'tags',
    'rule',
    'docstring',
  ] as const;

  for (const name of cases) {
    it(`formats ${name}`, () => {
      const input = fixture(`${name}.feature`);
      const golden = fixture(`${name}.golden.feature`);
      expect(formatGherkin(input)).toBe(golden);
    });
  }

  it('is idempotent on golden fixtures', () => {
    for (const name of cases) {
      const golden = fixture(`${name}.golden.feature`);
      expect(formatGherkin(golden)).toBe(golden);
    }
  });

  it('formats a line range only', () => {
    const input = fixture('messy-tables.feature');
    const full = formatGherkin(input);
    const partial = formatGherkin(input, { range: { startLine: 4, endLine: 6 } });
    // Table lines (indices 4-6) should match full format; earlier lines stay as input
    const inputLines = input.split(/\r?\n/);
    const partialLines = partial.split(/\r?\n/);
    const fullLines = full.split(/\r?\n/);
    expect(partialLines[0]).toBe(inputLines[0]);
    expect(partialLines[4]).toBe(fullLines[4]);
    expect(partialLines[5]).toBe(fullLines[5]);
    expect(partialLines[6]).toBe(fullLines[6]);
  });

  it('does not invent bindings or change step text', () => {
    const src = 'Feature: X\n  Scenario: Y\n    Given I have 5 cucumbers\n';
    const out = formatGherkin(src);
    expect(out).toContain('Given I have 5 cucumbers');
    expect(out).not.toMatch(/binding|undefined.step|glue/i);
  });
});
