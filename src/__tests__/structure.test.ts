import { describe, expect, it } from 'vitest';
import { tableRowSkeleton } from '../core';
import {
  parseDocument,
  placeholderHighlights,
  selectionRangesAt,
  type GherkinBlock,
} from '../core/structure';

const SAMPLE = `@billing
Feature: Pay
  Rule: Cards
    @fast
    Scenario Outline: Amount
      Given <amount>
      Examples:
        | amount | note |
        | 10 | ok |
    Scenario: Cash
      Given cash
`;

function titles(blocks: GherkinBlock[]): string[] {
  return blocks.map((block) => `${block.kind}:${block.title || block.keyword}`);
}

describe('parseDocument', () => {
  const doc = parseDocument(SAMPLE);

  it('builds Feature / Rule / Outline / Examples without step symbols', () => {
    expect(doc.blocks).toHaveLength(1);
    const feature = doc.blocks[0];
    expect(feature.kind).toBe('feature');
    expect(feature.title).toBe('Pay');
    expect(feature.startLine).toBe(0);
    expect(feature.keywordLine).toBe(1);
    expect(titles(feature.children)).toEqual(['rule:Cards']);
    const rule = feature.children[0];
    expect(titles(rule.children)).toEqual(['scenario_outline:Amount', 'scenario:Cash']);
    const outline = rule.children[0];
    expect(outline.startLine).toBe(3);
    expect(titles(outline.children)).toEqual(['examples:Examples']);
    const kinds = JSON.stringify(doc.blocks);
    expect(kinds).not.toContain('"kind":"step"');
  });

  it('ends a block on the line before the next sibling', () => {
    const rule = doc.blocks[0].children[0];
    const outline = rule.children[0];
    const cash = rule.children[1];
    expect(outline.endLine).toBe(cash.startLine - 1);
    expect(cash.endLine).toBe(doc.lines.length - 1);
  });

  it('classifies Spanish keywords when # language: es is set', () => {
    const es = parseDocument(
      '# language: es\nCaracterística: Pago\n  Escenario: Tarjeta\n    Dado un tarjeta\n'
    );
    expect(es.dialectId).toBe('es');
    expect(es.blocks[0].kind).toBe('feature');
    expect(es.blocks[0].keyword).toBe('Característica');
    expect(es.blocks[0].children[0].kind).toBe('scenario');
    expect(es.lines[3].kind).toBe('step');
  });

  it('falls back to English for an unknown language iso', () => {
    const docUnknown = parseDocument('# language: zz\nFeature: X\n  Scenario: Y\n');
    expect(docUnknown.dialectId).toBe('en');
    expect(docUnknown.blocks[0].kind).toBe('feature');
  });
});

describe('selectionRangesAt', () => {
  const doc = parseDocument(SAMPLE);

  it('walks placeholder, step line, outline, rule, feature', () => {
    const line = doc.lines.findIndex((row) => row.raw.includes('<amount>'));
    const character = doc.lines[line].raw.indexOf('<amount>') + 1;
    const chain = selectionRangesAt(doc, line, character);
    expect(chain.map((span) => [span.startLine, span.endLine])).toEqual([
      [line, line],
      [line, line],
      [3, doc.blocks[0].children[0].children[0].endLine],
      [2, doc.blocks[0].children[0].endLine],
      [0, doc.blocks[0].endLine],
    ]);
    expect(chain[0].startChar).toBe(doc.lines[line].raw.indexOf('<amount>'));
  });
});

describe('placeholderHighlights', () => {
  const text = `Feature: Mail
  Scenario Outline: One
    Given <email>
    Examples:
      | email | name |
      | a | Ada |
  Scenario Outline: Two
    Given <email>
    Examples:
      | email |
      | b |
  Scenario: Plain
    Given <email>
`;

  it('stays inside the outline under the cursor', () => {
    const doc = parseDocument(text);
    const line = doc.lines.findIndex((row) => row.raw.includes('Given <email>'));
    const character = doc.lines[line].raw.indexOf('<email>') + 1;
    const spans = placeholderHighlights(doc, line, character);
    const lines = spans.map((span) => span.line);
    expect(lines).toContain(line);
    const header = doc.lines.findIndex((row) => row.raw.includes('| email | name |'));
    expect(lines).toContain(header);
    const other = doc.lines.findIndex(
      (row, index) => index !== line && row.raw.includes('Given <email>')
    );
    expect(lines).not.toContain(other);
  });

  it('does not highlight a placeholder outside an outline', () => {
    const doc = parseDocument(text);
    const line = doc.lines.findIndex((row) => row.raw.includes('Scenario: Plain')) + 1;
    const character = doc.lines[line].raw.indexOf('<email>') + 1;
    expect(placeholderHighlights(doc, line, character)).toEqual([]);
  });
});

describe('tableRowSkeleton', () => {
  it('inserts a row with the same column count', () => {
    expect(tableRowSkeleton('| a | b |')).toEqual({ row: '|  |  |', caret: 2 });
    expect(tableRowSkeleton('| a\\|b | c |')?.row).toBe('|  |  |');
  });
});
