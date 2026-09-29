import { describe, expect, it } from 'vitest';
import { minimalEdit } from '../core/minimalEdit';
import { formatGherkin } from '../core/formatGherkin';

function apply(original: string, formatted: string): string {
  const edit = minimalEdit(original, formatted);
  if (!edit) {
    return original;
  }
  return original.slice(0, edit.start) + edit.text + original.slice(edit.end);
}

describe('minimalEdit', () => {
  it('returns null when nothing changes', () => {
    expect(minimalEdit('a\nb\n', 'a\nb\n')).toBeNull();
  });

  it('touches only the changed lines', () => {
    const original = 'Feature: X\n\n  Scenario: Y\n  Given a\n    When b\n';
    const formatted = 'Feature: X\n\n  Scenario: Y\n    Given a\n    When b\n';
    const edit = minimalEdit(original, formatted)!;
    expect(edit.start).toBe(original.indexOf('  Given a'));
    expect(edit.end).toBeLessThanOrEqual(original.indexOf('    When b'));
    expect(apply(original, formatted)).toBe(formatted);
  });

  it('snaps to line starts so CRLF pairs are never split', () => {
    const original = 'Feature: X\r\n  Given a\r\nEnd\r\n';
    const formatted = 'Feature: X\r\n    Given a\r\nEnd\r\n';
    const edit = minimalEdit(original, formatted)!;
    expect(original[edit.start - 1]).toBe('\n');
    expect(original[edit.end - 1]).toBe('\n');
    expect(apply(original, formatted)).toBe(formatted);
  });

  it('handles insertions and deletions at the edges', () => {
    for (const [a, b] of [
      ['', 'x\n'],
      ['x\n', ''],
      ['a\n', 'a\nb\n'],
      ['a\nb\n', 'b\n'],
      ['a\na\n', 'a\n'],
      ['no newline', 'no newline!'],
    ]) {
      expect(apply(a, b)).toBe(b);
    }
  });

  it('round-trips the formatter output', () => {
    const original = [
      'Feature: Tables',
      'Scenario: A',
      'Given rows',
      '| a | bb |',
      '| 1 | 22 |',
      '',
    ].join('\n');
    const formatted = formatGherkin(original, { indentSize: 2 });
    expect(apply(original, formatted)).toBe(formatted);
  });
});
