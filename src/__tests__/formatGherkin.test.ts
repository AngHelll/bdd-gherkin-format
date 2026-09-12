import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  alignTableBlock,
  classifyLine,
  formatGherkin,
  parseTableRow,
} from '../core';

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

  it('classifies official EN synonyms and * steps', () => {
    expect(classifyLine('Business Need: Pay')).toBe('feature');
    expect(classifyLine('Ability: Charge')).toBe('feature');
    expect(classifyLine('Example: Visa')).toBe('scenario');
    expect(classifyLine('Examples:')).toBe('examples');
    expect(classifyLine('Scenario Template: Amounts')).toBe('scenario_outline');
    expect(classifyLine('Scenarios:')).toBe('examples');
    expect(classifyLine('* the cart is empty')).toBe('step');
  });
});

describe('alignTableBlock', () => {
  it('pads cells to max column width', () => {
    const aligned = alignTableBlock(['| a | bb |', '| ccc | d |'], { alignNumbers: false });
    expect(aligned).toEqual(['| a   | bb |', '| ccc | d  |']);
  });

  it('right-aligns numeric cells by default', () => {
    const aligned = alignTableBlock(['| name | age |', '| Ada | 36 |', '| Grace | 109 |']);
    expect(aligned).toEqual([
      '| name  | age |',
      '| Ada   |  36 |',
      '| Grace | 109 |',
    ]);
  });

  it('keeps escaped pipes inside a cell', () => {
    expect(parseTableRow('| a\\|b | 12 |')).toEqual(['a\\|b', '12']);
    const aligned = alignTableBlock(['| label | value |', '| a\\|b | 12 |', '| x | 3 |']);
    expect(aligned).toEqual(['| label | value |', '| a\\|b  |    12 |', '| x     |     3 |']);
  });
});

describe('formatGherkin fixtures', () => {
  const cases = [
    'messy-indent',
    'messy-tables',
    'tags',
    'rule',
    'docstring',
    'dialect-en',
    'escaped-pipes',
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

  it('honors indentSize', () => {
    const src = 'Feature: X\nScenario: Y\nGiven a step\n';
    const out = formatGherkin(src, { indentSize: 4 });
    expect(out).toBe('Feature: X\n    Scenario: Y\n        Given a step\n');
  });

  it('can left-align numeric table cells', () => {
    const src = 'Feature: T\n  Scenario: S\n    Given a table\n      | n |\n      | 1 |\n      | 10 |\n';
    const out = formatGherkin(src, { alignNumbers: false });
    expect(out).toContain('| 1  |');
    expect(out).toContain('| 10 |');
  });
});
