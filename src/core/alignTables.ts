/**
 * Align consecutive Gherkin table rows by padding cells.
 * Only padding — never reorder rows or columns.
 * Splits on unescaped `|` so `\|` stays inside a cell (Gherkin spec).
 */

export interface AlignTableOptions {
  /** Right-align cells that are integers or decimals (Excel / Cucumber Official). */
  alignNumbers?: boolean;
}

const NUMERIC = /^-?\d+(\.\d+)?$/;

export function isNumericCell(value: string): boolean {
  return NUMERIC.test(value);
}

/**
 * Split a table line on `|` that are not escaped by `\`.
 */
export function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) {
    return null;
  }

  const cells: string[] = [];
  let current = '';
  let i = 1;

  while (i < trimmed.length) {
    const ch = trimmed[i];
    if (ch === '\\' && i + 1 < trimmed.length) {
      current += ch + trimmed[i + 1];
      i += 2;
      continue;
    }
    if (ch === '|') {
      cells.push(current.trim());
      current = '';
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }

  if (current.trim() !== '' || !trimmed.endsWith('|')) {
    cells.push(current.trim());
  }

  return cells.length > 0 ? cells : null;
}

export interface TableCellSpan {
  /** Trimmed cell text. */
  text: string;
  /** Start index of the trimmed text in the original line. */
  start: number;
  /** Exclusive end index of the trimmed text. */
  end: number;
  /** Index just after the opening pipe. */
  interiorStart: number;
  /** Index of the closing pipe, or the line length. */
  interiorEnd: number;
}

/**
 * Cell spans for a table line, including character offsets into `line`.
 * Returns null when `line` is not a Gherkin table row.
 */
export function tableCellSpans(line: string): TableCellSpan[] | null {
  const pipe = line.indexOf('|');
  if (pipe < 0 || line.slice(0, pipe).trim() !== '') {
    return null;
  }

  const cells: TableCellSpan[] = [];
  let i = pipe + 1;
  let interiorStart = i;
  let current = '';

  const push = (interiorEnd: number) => {
    const trimmed = current.trim();
    const lead = current.length - current.trimStart().length;
    const start = interiorStart + lead;
    cells.push({
      text: trimmed,
      start,
      end: start + trimmed.length,
      interiorStart,
      interiorEnd,
    });
  };

  while (i < line.length) {
    const ch = line[i];
    if (ch === '\\' && i + 1 < line.length) {
      current += ch + line[i + 1];
      i += 2;
      continue;
    }
    if (ch === '|') {
      push(i);
      current = '';
      i += 1;
      interiorStart = i;
      continue;
    }
    current += ch;
    i += 1;
  }

  if (current.trim() !== '' || !line.endsWith('|')) {
    push(line.length);
  }

  return cells.length > 0 ? cells : null;
}

/**
 * Skeleton row with the same column count. Caret sits in the first cell.
 * Returns null when `line` is not a table row.
 */
export function tableRowSkeleton(line: string): { row: string; caret: number } | null {
  const cells = parseTableRow(line);
  if (!cells || cells.length === 0) {
    return null;
  }
  return { row: `|${'  |'.repeat(cells.length)}`, caret: 2 };
}

export function formatTableRow(
  cells: string[],
  widths: number[],
  options: AlignTableOptions = {}
): string {
  const alignNumbers = options.alignNumbers ?? true;
  const padded = cells.map((cell, i) => {
    const w = widths[i] ?? cell.length;
    const body =
      alignNumbers && isNumericCell(cell) ? cell.padStart(w, ' ') : cell.padEnd(w, ' ');
    return ` ${body} `;
  });
  return `|${padded.join('|')}|`;
}

/**
 * Given a contiguous block of table lines (already de-indented content starting with |),
 * return aligned lines (still without outer indent).
 */
export function alignTableBlock(
  tableLines: string[],
  options: AlignTableOptions = {}
): string[] {
  if (tableLines.length === 0) {
    return [];
  }

  const rows = tableLines.map((line) => parseTableRow(line));
  if (rows.some((r) => r === null)) {
    return tableLines;
  }

  const parsed = rows as string[][];
  const colCount = Math.max(...parsed.map((r) => r.length));
  const widths = Array.from({ length: colCount }, (_, col) =>
    Math.max(0, ...parsed.map((r) => (r[col] ?? '').length))
  );

  return parsed.map((cells) => {
    const normalized = [...cells];
    while (normalized.length < colCount) {
      normalized.push('');
    }
    return formatTableRow(normalized, widths, options);
  });
}
