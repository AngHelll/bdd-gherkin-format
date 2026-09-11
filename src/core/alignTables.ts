/**
 * Align consecutive Gherkin table rows by padding cells.
 * Only padding — never reorder rows or columns.
 */

export function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|')) {
    return null;
  }
  // Split on | ; drop leading/trailing empties from outer pipes
  const parts = trimmed.split('|');
  if (parts.length < 2) {
    return null;
  }
  // First and last are empty when line is | a | b |
  const cells = parts.slice(1, parts[parts.length - 1] === '' ? -1 : undefined);
  return cells.map((c) => c.trim());
}

export function formatTableRow(cells: string[], widths: number[]): string {
  const padded = cells.map((cell, i) => {
    const w = widths[i] ?? cell.length;
    return ` ${cell.padEnd(w, ' ')} `;
  });
  return `|${padded.join('|')}|`;
}

/**
 * Given a contiguous block of table lines (already de-indented content starting with |),
 * return aligned lines (still without outer indent).
 */
export function alignTableBlock(tableLines: string[]): string[] {
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
    return formatTableRow(normalized, widths);
  });
}
