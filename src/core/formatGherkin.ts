/**
 * Mute Gherkin formatter: indent + align tables + opt-in layout policies.
 * Pure TypeScript — no vscode, no binding index.
 */

import { alignTableBlock } from './alignTables';
import { classifyLine, indentLevelFor, stripIndent, type LineKind } from './classify';
import { detectDialectId, resolveDialect, type DialectKeywords } from './dialects';
import {
  applyAlignStepKeywords,
  applyBlankLines,
  applyKeywordSpacing,
  applyTagLayout,
  docstringBodyText,
  type PolicyLine,
} from './layoutPolicy';
import { parseDocument, smallestContainingBlock } from './structure';

export const DEFAULT_INDENT_SIZE = 2;
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
  /** Spaces per indent unit. Default 2 (Gherkin reference). */
  indentSize?: number;
  /** Right-align numeric table cells. Default true (Cucumber Official / Excel). */
  alignNumbers?: boolean;
  /** One space after step keywords; `: ` before a title. Default false. */
  keywordSpacing?: boolean;
  /** Pad step keywords so the step text shares a column. Default false. */
  alignStepKeywords?: boolean;
  /** `preserve` (default) or `onePerLine`. */
  tagLayout?: 'preserve' | 'onePerLine';
  /** Reindent DocString bodies relative to the fence. Default false. */
  indentDocStrings?: boolean;
  /** `preserve` (default) or `pretty`. */
  blankLines?: 'preserve' | 'pretty';
}

export function resolveIndentSize(indentSize?: number): number {
  if (indentSize == null || !Number.isFinite(indentSize) || indentSize < 1) {
    return DEFAULT_INDENT_SIZE;
  }
  return Math.min(8, Math.floor(indentSize));
}

function applyIndent(level: number, content: string, unit: string): string {
  if (content === '') {
    return '';
  }
  return unit.repeat(level) + content;
}

interface WorkLine extends PolicyLine {
  kind: LineKind;
}

function fenceMarker(content: string): string {
  return content.startsWith('```') ? '```' : '"""';
}

function isContextualKind(kind: LineKind): boolean {
  return kind === 'comment' || kind === 'other';
}

function isSkippableForAnchor(kind: LineKind): boolean {
  return kind === 'blank' || kind === 'comment' || kind === 'other';
}

/**
 * Resolve indent for `#` comments and free-text descriptions by anchoring to
 * the next (or previous) structural line — same idea as tag look-ahead.
 */
function resolveContextualIndents(lines: WorkLine[]): void {
  const n = lines.length;

  const findLookAhead = (from: number): number | null => {
    for (let j = from + 1; j < n; j++) {
      if (lines[j].preserveOriginal || lines[j].inDocString) {
        continue;
      }
      if (isSkippableForAnchor(lines[j].kind)) {
        continue;
      }
      return j;
    }
    return null;
  };

  const findLookBack = (from: number): number | null => {
    for (let j = from - 1; j >= 0; j--) {
      if (lines[j].preserveOriginal || lines[j].inDocString) {
        continue;
      }
      if (isSkippableForAnchor(lines[j].kind)) {
        continue;
      }
      return j;
    }
    return null;
  };

  for (let i = 0; i < n; i++) {
    if (lines[i].preserveOriginal || lines[i].inDocString || !isContextualKind(lines[i].kind)) {
      continue;
    }
    const ahead = findLookAhead(i);
    if (ahead !== null) {
      lines[i].level = lines[ahead].level;
      continue;
    }
    const behind = findLookBack(i);
    lines[i].level = behind !== null ? lines[behind].level : 0;
  }
}

function buildWorkLines(text: string, dialect: DialectKeywords): WorkLine[] {
  const rawLines = text.split(/\r?\n/);
  const lines: WorkLine[] = rawLines.map((original, sourceIndex) => {
    const kind = classifyLine(original, dialect);
    const content = kind === 'blank' ? '' : stripIndent(original);
    return {
      kind,
      content,
      original,
      level: 0,
      preserveOriginal: false,
      inDocString: false,
      sourceIndex,
    };
  });

  let inRule = false;
  let inDocString = false;
  let docStringBase = 3;
  let openMarker = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const { kind, content } = line;

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
        line.level = docStringBase;
      } else if (content.startsWith(openMarker)) {
        line.level = docStringBase;
        inDocString = false;
        openMarker = '';
      } else {
        line.level = docStringBase;
      }
      continue;
    }

    if (inDocString) {
      line.preserveOriginal = true;
      line.inDocString = true;
      continue;
    }

    if (kind === 'blank') {
      line.level = 0;
      continue;
    }

    if (isContextualKind(kind)) {
      continue;
    }

    if (kind === 'tag') {
      let nextStructural: LineKind | null = null;
      for (let j = i + 1; j < lines.length; j++) {
        const k = lines[j].kind;
        if (k === 'blank' || k === 'comment' || k === 'tag') {
          continue;
        }
        if (lines[j].inDocString) {
          continue;
        }
        nextStructural = k;
        break;
      }
      line.level =
        nextStructural === 'feature' || nextStructural === null
          ? 0
          : indentLevelFor('tag', { inRule, inDocString: false, docStringBase });
      continue;
    }

    line.level = indentLevelFor(kind, { inRule, inDocString: false, docStringBase });
  }

  resolveContextualIndents(lines);
  return lines;
}

function layoutEnabled(options: FormatOptions): boolean {
  return Boolean(
    options.keywordSpacing ||
      options.alignStepKeywords ||
      options.indentDocStrings ||
      options.tagLayout === 'onePerLine' ||
      options.blankLines === 'pretty'
  );
}

interface EmittedLine {
  text: string;
  sourceIndex: number;
  inserted?: boolean;
}

/**
 * Format full Gherkin document (or a line range).
 * Preserves whether the input ended with a newline.
 */
export function formatGherkin(text: string, options: FormatOptions = {}): string {
  const hadTrailingNewline = /\r?\n$/.test(text);
  const dialect = resolveDialect(detectDialectId(text));
  let lines = buildWorkLines(text, dialect);
  const originalLines = text.split(/\r?\n/);

  const rangeStart = options.range?.startLine ?? 0;
  const rangeEnd = options.range?.endLine ?? Math.max(0, lines.length - 1);
  let emitStart = rangeStart;
  let emitEnd = rangeEnd;

  if (options.range && layoutEnabled(options)) {
    const doc = parseDocument(text);
    const container = smallestContainingBlock(doc.blocks, rangeStart, rangeEnd);
    if (container) {
      emitStart = Math.min(emitStart, container.startLine);
      emitEnd = Math.max(emitEnd, container.endLine);
    }
  }

  if (options.keywordSpacing) {
    applyKeywordSpacing(lines, dialect);
  }
  if (options.alignStepKeywords) {
    applyAlignStepKeywords(lines, dialect);
  }
  if (options.tagLayout === 'onePerLine') {
    lines = applyTagLayout(lines);
  }

  const indentSize = resolveIndentSize(options.indentSize);
  const unit = ' '.repeat(indentSize);
  const alignNumbers = options.alignNumbers ?? true;
  const alignedContent = lines.map((line) => line.content);

  let blockStart = -1;
  const flushBlock = (endExclusive: number) => {
    if (blockStart < 0) {
      return;
    }
    const blockEnd = endExclusive - 1;
    const touchesRange = blockEnd >= emitStart && blockStart <= emitEnd;
    if (touchesRange) {
      const slice = alignedContent.slice(blockStart, endExclusive);
      const aligned = alignTableBlock(slice, { alignNumbers });
      for (let k = 0; k < aligned.length; k++) {
        alignedContent[blockStart + k] = aligned[k];
      }
    }
    blockStart = -1;
  };

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].kind === 'table' && !lines[i].inDocString) {
      if (blockStart < 0) {
        blockStart = i;
      }
    } else {
      flushBlock(i);
    }
  }
  flushBlock(lines.length);

  if (options.blankLines === 'pretty') {
    lines = applyBlankLines(lines);
    // Table alignment already written into alignedContent by old index.
    // Rebuild content array after line-count changes: copy by identity.
  }

  const contentByLine = new Map<WorkLine, string>();
  if (options.blankLines === 'pretty') {
    // alignedContent was indexed before blank insertion. Re-align tables
    // on the post-blank line list so indices stay paired.
    const contents = lines.map((line) => line.content);
    let start = -1;
    const flush = (endExclusive: number) => {
      if (start < 0) {
        return;
      }
      const aligned = alignTableBlock(contents.slice(start, endExclusive), { alignNumbers });
      for (let k = 0; k < aligned.length; k++) {
        contents[start + k] = aligned[k];
      }
      start = -1;
    };
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].kind === 'table' && !lines[i].inDocString) {
        if (start < 0) {
          start = i;
        }
      } else {
        flush(i);
      }
    }
    flush(lines.length);
    lines.forEach((line, index) => contentByLine.set(line, contents[index]));
  } else {
    lines.forEach((line, index) => contentByLine.set(line, alignedContent[index]));
  }

  const emitted: EmittedLine[] = lines.map((line) => {
    if (line.kind === 'blank') {
      return { text: '', sourceIndex: line.sourceIndex, inserted: line.inserted };
    }
    if (line.preserveOriginal && !options.indentDocStrings) {
      return { text: line.original, sourceIndex: line.sourceIndex };
    }
    if (options.indentDocStrings && line.inDocString) {
      const body = docstringBodyText(lines, lines.indexOf(line), indentSize);
      if (body !== null) {
        return { text: body, sourceIndex: line.sourceIndex };
      }
    }
    if (line.preserveOriginal) {
      return { text: line.original, sourceIndex: line.sourceIndex };
    }
    const content = contentByLine.get(line) ?? line.content;
    return {
      text: applyIndent(line.level, content, unit),
      sourceIndex: line.sourceIndex,
    };
  });

  let outLines: string[];
  if (!options.range) {
    outLines = emitted.map((line) => line.text);
  } else if (!layoutEnabled(options)) {
    outLines = emitted.map((line, index) => {
      const inRange = index >= rangeStart && index <= rangeEnd;
      return inRange ? line.text : originalLines[index] ?? line.text;
    });
  } else {
    const before = originalLines.slice(0, emitStart);
    const after = originalLines.slice(emitEnd + 1);
    const middle = emitted.filter(
      (line) => line.sourceIndex >= emitStart && line.sourceIndex <= emitEnd
    );
    if (
      middle.length > 0 &&
      middle[0].inserted &&
      middle[0].text === '' &&
      before.length > 0 &&
      before[before.length - 1].trim() === ''
    ) {
      middle.shift();
    }
    outLines = [...before, ...middle.map((line) => line.text), ...after];
  }

  let result = outLines.join('\n');
  if (hadTrailingNewline && !result.endsWith('\n')) {
    result += '\n';
  }
  if (!hadTrailingNewline && result.endsWith('\n')) {
    result = result.replace(/\n$/, '');
  }
  return result;
}

export { classifyLine, alignTableBlock };
