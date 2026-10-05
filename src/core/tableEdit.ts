/**
 * Spreadsheet-style table editing: cell navigation, column operations, sort,
 * and conversion from / to delimited text. Pure — no vscode.
 */

import { formatTableRow, isNumericCell, parseTableRow, tableCellSpans } from './alignTables';
import type { ParsedDocument } from './structure';

export interface TableBlock {
  startLine: number;
  /** Inclusive. */
  endLine: number;
  indent: string;
  rows: string[][];
}

export interface CellSelection {
  line: number;
  start: number;
  end: number;
}

export interface TableRewrite {
  startLine: number;
  /** Inclusive, in the original document. */
  endLine: number;
  lines: string[];
  selection: CellSelection;
}

export interface TableEditOptions {
  alignNumbers?: boolean;
}

export interface CellEdit {
  line: number;
  start: number;
  end: number;
  text: string;
}

function isTableRow(doc: ParsedDocument, line: number): boolean {
  const row = doc.lines[line];
  return row !== undefined && row.kind === 'table' && !row.inDocString;
}

export function tableAt(doc: ParsedDocument, line: number): TableBlock | null {
  if (!isTableRow(doc, line)) {
    return null;
  }
  let startLine = line;
  while (startLine > 0 && isTableRow(doc, startLine - 1)) {
    startLine--;
  }
  let endLine = line;
  while (isTableRow(doc, endLine + 1)) {
    endLine++;
  }
  const rows: string[][] = [];
  for (let i = startLine; i <= endLine; i++) {
    rows.push(parseTableRow(doc.lines[i].raw) ?? ['']);
  }
  const indent = doc.lines[startLine].raw.match(/^[ \t]*/)?.[0] ?? '';
  return { startLine, endLine, indent, rows };
}

/** Index of the cell that contains `character` on a table line. */
export function cellIndexAt(rawLine: string, character: number): number {
  const spans = tableCellSpans(rawLine) ?? [];
  for (let i = 0; i < spans.length; i++) {
    if (character <= spans[i].interiorEnd) {
      return i;
    }
  }
  return Math.max(0, spans.length - 1);
}

function columnCount(rows: string[][]): number {
  return Math.max(1, ...rows.map((row) => row.length));
}

function normalize(rows: string[][]): string[][] {
  const count = columnCount(rows);
  return rows.map((row) => [...row, ...Array<string>(count - row.length).fill('')]);
}

export function renderTable(
  rows: string[][],
  indent: string,
  options: TableEditOptions = {}
): string[] {
  const full = normalize(rows);
  const widths = full[0].map((_, col) => Math.max(0, ...full.map((row) => row[col].length)));
  return full.map((row) => indent + formatTableRow(row, widths, options));
}

function selectCell(lines: string[], startLine: number, row: number, col: number): CellSelection {
  const text = lines[row];
  const spans = tableCellSpans(text) ?? [];
  const span = spans[Math.min(col, spans.length - 1)];
  if (!span) {
    return { line: startLine + row, start: text.length, end: text.length };
  }
  if (span.text === '') {
    return { line: startLine + row, start: span.interiorStart + 1, end: span.interiorStart + 1 };
  }
  return { line: startLine + row, start: span.start, end: span.end };
}

function rewrite(
  table: TableBlock,
  rows: string[][],
  row: number,
  col: number,
  options: TableEditOptions
): TableRewrite {
  const lines = renderTable(rows, table.indent, options);
  return {
    startLine: table.startLine,
    endLine: table.endLine,
    lines,
    selection: selectCell(lines, table.startLine, row, col),
  };
}

interface Cursor {
  table: TableBlock;
  row: number;
  col: number;
}

function cursorAt(doc: ParsedDocument, line: number, character: number): Cursor | null {
  const table = tableAt(doc, line);
  if (!table) {
    return null;
  }
  return { table, row: line - table.startLine, col: cellIndexAt(doc.lines[line].raw, character) };
}

/**
 * Tab / Shift+Tab: realign, then select the next or previous cell.
 * Tab on the last cell appends an empty row.
 */
export function navigateCell(
  doc: ParsedDocument,
  line: number,
  character: number,
  direction: 1 | -1,
  options: TableEditOptions = {}
): TableRewrite | null {
  const at = cursorAt(doc, line, character);
  if (!at) {
    return null;
  }
  const rows = normalize(at.table.rows);
  const count = rows[0].length;
  let { row, col } = at;
  col += direction;
  if (col >= count) {
    col = 0;
    row++;
    if (row >= rows.length) {
      rows.push(Array<string>(count).fill(''));
    }
  } else if (col < 0) {
    if (row === 0) {
      col = 0;
    } else {
      row--;
      col = count - 1;
    }
  }
  return rewrite(at.table, rows, row, col, options);
}

export function alignTableAt(
  doc: ParsedDocument,
  line: number,
  character: number,
  options: TableEditOptions = {}
): TableRewrite | null {
  const at = cursorAt(doc, line, character);
  return at ? rewrite(at.table, at.table.rows, at.row, at.col, options) : null;
}

export function insertColumn(
  doc: ParsedDocument,
  line: number,
  character: number,
  side: 'left' | 'right',
  options: TableEditOptions = {}
): TableRewrite | null {
  const at = cursorAt(doc, line, character);
  if (!at) {
    return null;
  }
  const col = side === 'left' ? at.col : at.col + 1;
  const rows = normalize(at.table.rows).map((row) => [...row.slice(0, col), '', ...row.slice(col)]);
  return rewrite(at.table, rows, at.row, col, options);
}

export function deleteColumn(
  doc: ParsedDocument,
  line: number,
  character: number,
  options: TableEditOptions = {}
): TableRewrite | null {
  const at = cursorAt(doc, line, character);
  if (!at) {
    return null;
  }
  const rows = normalize(at.table.rows);
  if (rows[0].length <= 1) {
    return null;
  }
  const next = rows.map((row) => row.filter((_, i) => i !== at.col));
  return rewrite(at.table, next, at.row, Math.min(at.col, next[0].length - 1), options);
}

export function moveColumn(
  doc: ParsedDocument,
  line: number,
  character: number,
  direction: 1 | -1,
  options: TableEditOptions = {}
): TableRewrite | null {
  const at = cursorAt(doc, line, character);
  if (!at) {
    return null;
  }
  const rows = normalize(at.table.rows);
  const target = at.col + direction;
  if (target < 0 || target >= rows[0].length) {
    return null;
  }
  for (const row of rows) {
    [row[at.col], row[target]] = [row[target], row[at.col]];
  }
  return rewrite(at.table, rows, at.row, target, options);
}

function compareCells(a: string, b: string): number {
  if (isNumericCell(a) && isNumericCell(b)) {
    return Number(a) - Number(b);
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

/** Sort data rows by the column under the cursor. The first row is the header and stays put. */
export function sortByColumn(
  doc: ParsedDocument,
  line: number,
  character: number,
  order: 'asc' | 'desc',
  options: TableEditOptions = {}
): TableRewrite | null {
  const at = cursorAt(doc, line, character);
  if (!at || at.table.rows.length < 3) {
    return null;
  }
  const [header, ...data] = normalize(at.table.rows);
  const sign = order === 'asc' ? 1 : -1;
  const sorted = data
    .map((row, index) => ({ row, index }))
    .sort((a, b) => sign * compareCells(a.row[at.col], b.row[at.col]) || a.index - b.index)
    .map(({ row }) => row);
  return rewrite(at.table, [header, ...sorted], at.row, at.col, options);
}

/**
 * Cell-local padding for the table under `line`, used while typing `|`.
 * Only closed cells are touched, so the caret right after the typed pipe never moves.
 */
export function alignOnTypeEdits(
  doc: ParsedDocument,
  line: number,
  options: TableEditOptions = {}
): CellEdit[] {
  const table = tableAt(doc, line);
  if (!table) {
    return [];
  }
  const alignNumbers = options.alignNumbers ?? true;
  const closed: { line: number; spans: NonNullable<ReturnType<typeof tableCellSpans>> }[] = [];
  for (let i = table.startLine; i <= table.endLine; i++) {
    const raw = doc.lines[i].raw;
    const spans = (tableCellSpans(raw) ?? []).filter((span) => span.interiorEnd < raw.length);
    closed.push({ line: i, spans });
  }
  const widths: number[] = [];
  for (const { spans } of closed) {
    spans.forEach((span, col) => {
      widths[col] = Math.max(widths[col] ?? 0, span.text.length);
    });
  }
  const edits: CellEdit[] = [];
  for (const { line: rowLine, spans } of closed) {
    const raw = doc.lines[rowLine].raw;
    spans.forEach((span, col) => {
      const body =
        alignNumbers && isNumericCell(span.text)
          ? span.text.padStart(widths[col], ' ')
          : span.text.padEnd(widths[col], ' ');
      const text = ` ${body} `;
      if (raw.slice(span.interiorStart, span.interiorEnd) !== text) {
        edits.push({ line: rowLine, start: span.interiorStart, end: span.interiorEnd, text });
      }
    });
  }
  return edits;
}

function escapeCell(value: string): string {
  return value
    .trim()
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '\\n');
}

function unescapeCell(value: string): string {
  return value.replace(/\\(\||n|\\)/g, (_, ch: string) => (ch === 'n' ? '\n' : ch));
}

function splitDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
    } else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

function countOutsideQuotes(line: string, ch: string): number {
  let count = 0;
  let quoted = false;
  for (const c of line) {
    if (c === '"') {
      quoted = !quoted;
    } else if (c === ch && !quoted) {
      count++;
    }
  }
  return count;
}

/**
 * Rows from a Gherkin table, TSV (Excel / Sheets), or CSV (`,` or `;`).
 * Cells come back Gherkin-escaped. Returns null when the text is not tabular.
 */
export function parseDelimited(text: string): string[][] | null {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  if (normalized.trim() === '') {
    return null;
  }
  const lines = normalized.split('\n').filter((line) => line.trim() !== '');
  if (lines.every((line) => line.trim().startsWith('|'))) {
    const rows = lines.map((line) => parseTableRow(line));
    return rows.every((row) => row !== null) ? (rows as string[][]) : null;
  }
  let delimiter = '\t';
  if (!normalized.includes('\t')) {
    const commas = countOutsideQuotes(lines[0], ',');
    const semicolons = countOutsideQuotes(lines[0], ';');
    if (commas === 0 && semicolons === 0) {
      return null;
    }
    delimiter = semicolons > commas ? ';' : ',';
  }
  const rows = splitDelimited(normalized, delimiter)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => row.map(escapeCell));
  return rows.length > 0 ? normalize(rows) : null;
}

/** TSV that pastes back into Excel / Sheets as the same grid. */
export function tableToTsv(rows: string[][]): string {
  return normalize(rows)
    .map((row) =>
      row
        .map((cell) => {
          const value = unescapeCell(cell);
          return /[\t\n"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join('\t')
    )
    .join('\n');
}
