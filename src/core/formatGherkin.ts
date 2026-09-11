/**
 * Mute Gherkin formatter: indent + align tables.
 * Pure TypeScript — no vscode, no binding index.
 */

import { alignTableBlock } from './alignTables';
import { classifyLine, indentLevelFor, stripIndent, type LineKind } from './classify';

export const INDENT_UNIT = '  ';

export interface FormatRange {
  /** 0-based start line inclusive */
  startLine: number;
  /** 0-based end line inclusive */
  endLine: number;
}

export interface FormatOptions {
  /** When set, only rewrite lines in this range (table align scoped to range). */
  range?: FormatRange;
}

function applyIndent(level: number, content: string): string {
  if (content === '') {
    return '';
  }
  return INDENT_UNIT.repeat(level) + content;
}

interface WorkLine {
  kind: LineKind;
  content: string;
  original: string;
}

function buildWorkLines(text: string): WorkLine[] {
  return text.split(/\r?\n/).map((original) => {
    const kind = classifyLine(original);
    const content = kind === 'blank' ? '' : stripIndent(original);
    return { kind, content, original };
  });
}

function fenceMarker(content: string): string {
  return content.startsWith('```') ? '```' : '"""';
}

/**
 * Format full Gherkin document (or a line range).
 * Preserves whether the input ended with a newline.
 */
export function formatGherkin(text: string, options: FormatOptions = {}): string {
  const hadTrailingNewline = /\r?\n$/.test(text);
  const lines = buildWorkLines(text);
  const n = lines.length;

  const rangeStart = options.range?.startLine ?? 0;
  const rangeEnd = options.range?.endLine ?? Math.max(0, n - 1);

  const levels: number[] = new Array(n).fill(0);
  /** When true, emit `original` unchanged (docstring body). */
  const preserveOriginal: boolean[] = new Array(n).fill(false);

  let inRule = false;
  let inDocString = false;
  let docStringBase = 3;
  let openMarker = '';

  for (let i = 0; i < n; i++) {
    const { kind, content } = lines[i];

    if (kind === 'feature') {
      inRule = false;
    }
    if (kind === 'rule') {
      inRule = true;
    }

    if (kind === 'docstring_fence') {
      const marker = fenceMarker(content);
      if (!inDocString) {
        inDocString = true;
        openMarker = marker;
        docStringBase = indentLevelFor('docstring_fence', {
          inRule,
          inDocString: false,
          docStringBase: 0,
        });
        levels[i] = docStringBase;
      } else if (content.startsWith(openMarker)) {
        levels[i] = docStringBase;
        inDocString = false;
        openMarker = '';
      } else {
        levels[i] = docStringBase;
      }
      continue;
    }

    if (inDocString) {
      // Body intact — only fence lines are re-indented
      preserveOriginal[i] = true;
      continue;
    }

    if (kind === 'blank') {
      levels[i] = 0;
      continue;
    }

    if (kind === 'tag') {
      let nextStructural: LineKind | null = null;
      for (let j = i + 1; j < n; j++) {
        const k = lines[j].kind;
        if (k === 'blank' || k === 'comment' || k === 'tag') {
          continue;
        }
        nextStructural = k;
        break;
      }
      levels[i] =
        nextStructural === 'feature' || nextStructural === null
          ? 0
          : indentLevelFor('tag', { inRule, inDocString: false, docStringBase });
      continue;
    }

    levels[i] = indentLevelFor(kind, { inRule, inDocString: false, docStringBase });
  }

  const alignedContent = lines.map((l) => l.content);

  let blockStart = -1;
  const lineInDocStringBody = (index: number): boolean => preserveOriginal[index];

  const flushBlock = (endExclusive: number) => {
    if (blockStart < 0) {
      return;
    }
    const blockEnd = endExclusive - 1;
    const touchesRange = blockEnd >= rangeStart && blockStart <= rangeEnd;
    if (touchesRange) {
      const slice = alignedContent.slice(blockStart, endExclusive);
      const aligned = alignTableBlock(slice);
      for (let k = 0; k < aligned.length; k++) {
        alignedContent[blockStart + k] = aligned[k];
      }
    }
    blockStart = -1;
  };

  for (let i = 0; i < n; i++) {
    if (lines[i].kind === 'table' && !lineInDocStringBody(i)) {
      if (blockStart < 0) {
        blockStart = i;
      }
    } else {
      flushBlock(i);
    }
  }
  flushBlock(n);

  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const inRange = i >= rangeStart && i <= rangeEnd;
    if (!inRange) {
      out.push(lines[i].original);
      continue;
    }

    if (preserveOriginal[i]) {
      out.push(lines[i].original);
      continue;
    }

    if (lines[i].kind === 'blank') {
      out.push('');
      continue;
    }

    out.push(applyIndent(levels[i], alignedContent[i]));
  }

  let result = out.join('\n');
  if (hadTrailingNewline && !result.endsWith('\n')) {
    result += '\n';
  }
  if (!hadTrailingNewline && result.endsWith('\n')) {
    result = result.replace(/\n$/, '');
  }
  return result;
}

export { classifyLine, alignTableBlock };
