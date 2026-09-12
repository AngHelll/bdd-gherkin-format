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
