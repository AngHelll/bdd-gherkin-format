import { describe, expect, it } from 'vitest';
import { parseDocument } from '../core/structure';
import {
  alignOnTypeEdits,
  cellIndexAt,
  deleteColumn,
  insertColumn,
  moveColumn,
  navigateCell,
  parseDelimited,
  sortByColumn,
  tableAt,
  tableToTsv,
  type CellEdit,
} from '../core/tableEdit';

const feature = [
  'Feature: Tables',
  '  Scenario Outline: Login',
  '    Given user <name>',
  '    Examples:',
  '      | name | age |',
  '      | bob | 30 |',
  '      | alice | 7 |',
  '',
].join('\n');

const doc = parseDocument(feature);

describe('tableAt', () => {
  it('finds the contiguous table with its indent', () => {
    const table = tableAt(doc, 5)!;
    expect(table.startLine).toBe(4);
    expect(table.endLine).toBe(6);
    expect(table.indent).toBe('      ');
    expect(table.rows[1]).toEqual(['bob', '30']);
  });

  it('ignores pipes inside a DocString', () => {
    const withDocString = parseDocument(['Feature: X', '  Given text', '    """', '    | a |', '    """'].join('\n'));
    expect(tableAt(withDocString, 3)).toBeNull();
  });
});

describe('cellIndexAt', () => {
  it('maps a column to the cell that owns it', () => {
    const row = '| bob | 30 |';
    expect(cellIndexAt(row, 0)).toBe(0);
    expect(cellIndexAt(row, 3)).toBe(0);
    expect(cellIndexAt(row, 8)).toBe(1);
    expect(cellIndexAt(row, 20)).toBe(1);
  });
});

describe('navigateCell', () => {
  it('aligns the table and selects the next cell', () => {
    const result = navigateCell(doc, 5, 9, 1)!;
    expect(result.lines).toEqual([
      '      | name  | age |',
      '      | bob   |  30 |',
      '      | alice |   7 |',
    ]);
    expect(result.selection).toEqual({ line: 5, start: 17, end: 19 });
  });

  it('wraps to the next row and appends one on the last cell', () => {
    const wrap = navigateCell(doc, 4, 15, 1)!;
    expect(wrap.selection.line).toBe(5);
    const append = navigateCell(doc, 6, 16, 1)!;
    expect(append.lines).toHaveLength(4);
    expect(append.lines[3]).toBe('      |       |     |');
    expect(append.selection).toEqual({ line: 7, start: 8, end: 8 });
  });

  it('moves back and stops at the first cell', () => {
    expect(navigateCell(doc, 5, 15, -1)!.selection).toMatchObject({ line: 5, start: 8 });
    expect(navigateCell(doc, 5, 8, -1)!.selection).toMatchObject({ line: 4 });
    expect(navigateCell(doc, 4, 8, -1)!.selection).toMatchObject({ line: 4, start: 8 });
  });
});

describe('column operations', () => {
  it('inserts a column on either side', () => {
    expect(insertColumn(doc, 4, 8, 'right')!.lines[0]).toBe('      | name  |  | age |');
    expect(insertColumn(doc, 4, 8, 'left')!.lines[0]).toBe('      |  | name  | age |');
  });

  it('deletes a column but never the last one', () => {
    expect(deleteColumn(doc, 4, 15)!.lines).toEqual(['      | name  |', '      | bob   |', '      | alice |']);
    const single = parseDocument(['Feature: X', '  Given t', '    | a |', '    | b |'].join('\n'));
    expect(deleteColumn(single, 2, 6)).toBeNull();
  });

  it('moves a column and keeps the caret on it', () => {
    const moved = moveColumn(doc, 4, 8, 1)!;
    expect(moved.lines[0]).toBe('      | age | name  |');
    expect(moved.selection.start).toBe(moved.lines[0].indexOf('name'));
    expect(moveColumn(doc, 4, 8, -1)).toBeNull();
  });

  it('sorts data rows, numeric-aware, header fixed', () => {
    expect(sortByColumn(doc, 5, 15, 'asc')!.lines.map((l) => l.trim())).toEqual([
      '| name  | age |',
      '| alice |   7 |',
      '| bob   |  30 |',
    ]);
    expect(sortByColumn(doc, 5, 8, 'desc')!.lines[1].trim()).toBe('| bob   |  30 |');
  });
});

function applyEdits(text: string, edits: CellEdit[]): string[] {
  const lines = text.split('\n');
  for (const edit of [...edits].sort((a, b) => b.line - a.line || b.start - a.start)) {
    const line = lines[edit.line];
    lines[edit.line] = line.slice(0, edit.start) + edit.text + line.slice(edit.end);
  }
  return lines;
}

describe('alignOnTypeEdits', () => {
  it('pads closed cells and leaves the cell being typed alone', () => {
    const text = ['Feature: X', '  Given t', '    | name | age |', '    | bobby |', '    | al | 3'].join('\n');
    const lines = applyEdits(text, alignOnTypeEdits(parseDocument(text), 3));
    expect(lines.slice(2)).toEqual(['    | name  | age |', '    | bobby |', '    | al    | 3']);
  });

  it('returns nothing outside a table', () => {
    expect(alignOnTypeEdits(doc, 2)).toEqual([]);
  });
});

describe('parseDelimited', () => {
  it('reads TSV copied from Excel, including quoted cells', () => {
    expect(parseDelimited('name\tnote\r\nbob\t"two\nlines"\r\nal\t"say ""hi"""\r\n')).toEqual([
      ['name', 'note'],
      ['bob', 'two\\nlines'],
      ['al', 'say "hi"'],
    ]);
  });

  it('detects comma and semicolon CSV and escapes pipes', () => {
    expect(parseDelimited('a,b\n1,"x, y"')).toEqual([['a', 'b'], ['1', 'x, y']]);
    expect(parseDelimited('a;b\n1;a|b')).toEqual([['a', 'b'], ['1', 'a\\|b']]);
  });

  it('pads ragged rows and accepts an existing Gherkin table', () => {
    expect(parseDelimited('a\tb\tc\n1')).toEqual([['a', 'b', 'c'], ['1', '', '']]);
    expect(parseDelimited('| a | b |\n| 1 | 2 |')).toEqual([['a', 'b'], ['1', '2']]);
  });

  it('rejects plain text', () => {
    expect(parseDelimited('just a sentence')).toBeNull();
    expect(parseDelimited('  \n')).toBeNull();
  });
});

describe('tableToTsv', () => {
  it('unescapes Gherkin cells and quotes what Excel needs quoted', () => {
    expect(tableToTsv([['a', 'b'], ['x\\|y', 'two\\nlines']])).toBe('a\tb\nx|y\t"two\nlines"');
  });

  it('round-trips with parseDelimited', () => {
    const rows = [['name', 'note'], ['bob', 'a\\|b'], ['al', 'two\\nlines']];
    expect(parseDelimited(tableToTsv(rows))).toEqual(rows);
  });
});
