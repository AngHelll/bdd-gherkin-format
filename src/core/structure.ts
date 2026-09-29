/**
 * Structural walk of a .feature file: Feature / Rule / Scenario / Examples.
 * Shared by outline, folding, selection, and placeholder highlights.
 * Pure — no vscode. Never indexes bindings.
 */

import { tableCellSpans } from './alignTables';
import {
  classifyLine,
  isStructuralKind,
  matchHeading,
  stripIndent,
  type LineKind,
} from './classify';
import {
  detectDialectId,
  resolveDialect,
  type DialectKeywords,
} from './dialects';

export type BlockKind =
  | 'feature'
  | 'rule'
  | 'background'
  | 'scenario'
  | 'scenario_outline'
  | 'examples';

export interface GherkinBlock {
  kind: BlockKind;
  keyword: string;
  title: string;
  /** 0-based line of the keyword. */
  keywordLine: number;
  /** 0-based start, including immediately preceding tags. */
  startLine: number;
  /** 0-based inclusive end (line before the next sibling). */
  endLine: number;
  children: GherkinBlock[];
}

export interface ClassifiedLine {
  line: number;
  kind: LineKind;
  content: string;
  raw: string;
  inDocString: boolean;
}

export interface ParsedDocument {
  dialectId: string;
  lines: ClassifiedLine[];
  blocks: GherkinBlock[];
}

export interface TextSpan {
  startLine: number;
  startChar: number;
  endLine: number;
  endChar: number;
}

export interface HighlightSpan {
  line: number;
  start: number;
  end: number;
}

/** Editor lines: a trailing newline does not create an extra row. */
export function editorLines(text: string): string[] {
  const lines = text.split(/\r?\n/);
  if ((text.endsWith('\n') || text.endsWith('\r\n')) && lines.length > 0) {
    lines.pop();
  }
  return lines.length > 0 ? lines : [''];
}

function fenceMarker(content: string): string {
  return content.startsWith('```') ? '```' : '"""';
}

function classifyDocument(text: string, dialect: DialectKeywords): ClassifiedLine[] {
  const rawLines = editorLines(text);
  const lines: ClassifiedLine[] = [];
  let inDocString = false;
  let openMarker = '';

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const content = raw.trim() === '' ? '' : stripIndent(raw);
    const kind = classifyLine(raw, dialect);
    if (kind === 'docstring_fence' && !inDocString) {
      inDocString = true;
      openMarker = fenceMarker(content);
      lines.push({ line: i, kind, content, raw, inDocString: false });
      continue;
    }
    if (inDocString) {
      const closes = kind === 'docstring_fence' && content.startsWith(openMarker);
      lines.push({ line: i, kind, content, raw, inDocString: !closes });
      if (closes) {
        inDocString = false;
        openMarker = '';
      }
      continue;
    }
    lines.push({ line: i, kind, content, raw, inDocString: false });
  }
  return lines;
}

function startIncludingTags(lines: ClassifiedLine[], keywordLine: number): number {
  let start = keywordLine;
  for (let i = keywordLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.inDocString) {
      break;
    }
    if (line.kind === 'tag') {
      start = i;
      continue;
    }
    if (line.kind === 'blank') {
      continue;
    }
    break;
  }
  return start;
}

function canContain(parent: BlockKind, child: BlockKind): boolean {
  switch (parent) {
    case 'feature':
      return child !== 'feature';
    case 'rule':
      return (
        child === 'background' ||
        child === 'scenario' ||
        child === 'scenario_outline' ||
        child === 'examples'
      );
    case 'scenario':
    case 'scenario_outline':
      return child === 'examples';
    default:
      return false;
  }
}

function assignEnds(blocks: GherkinBlock[], parentEnd: number): void {
  for (let i = 0; i < blocks.length; i++) {
    const nextStart = i + 1 < blocks.length ? blocks[i + 1].startLine : parentEnd + 1;
    const end = Math.max(blocks[i].keywordLine, nextStart - 1);
    blocks[i].endLine = Math.min(end, parentEnd);
    assignEnds(blocks[i].children, blocks[i].endLine);
  }
}

export function parseDocument(text: string): ParsedDocument {
  const dialectId = detectDialectId(text);
  const dialect = resolveDialect(dialectId);
  const lines = classifyDocument(text, dialect);
  const headers: GherkinBlock[] = [];

  for (const line of lines) {
    if (line.inDocString || !isStructuralKind(line.kind)) {
      continue;
    }
    const kind = line.kind as BlockKind;
    const heading = matchHeading(line.content, kind, dialect);
    headers.push({
      kind,
      keyword: heading?.keyword ?? line.content,
      title: heading?.title ?? '',
      keywordLine: line.line,
      startLine: startIncludingTags(lines, line.line),
      endLine: line.line,
      children: [],
    });
  }

  const roots: GherkinBlock[] = [];
  const stack: GherkinBlock[] = [];
  for (const header of headers) {
    while (stack.length > 0 && !canContain(stack[stack.length - 1].kind, header.kind)) {
      stack.pop();
    }
    if (stack.length === 0) {
      roots.push(header);
    } else {
      stack[stack.length - 1].children.push(header);
    }
    stack.push(header);
  }

  const parentEnd = Math.max(0, lines.length - 1);
  assignEnds(roots, parentEnd);
  return { dialectId, lines, blocks: roots };
}

export function blocksAt(blocks: GherkinBlock[], line: number): GherkinBlock[] {
  for (const block of blocks) {
    if (line >= block.startLine && line <= block.endLine) {
      return [block, ...blocksAt(block.children, line)];
    }
  }
  return [];
}

/** Smallest block that fully covers [startLine, endLine], if any. */
export function smallestContainingBlock(
  blocks: GherkinBlock[],
  startLine: number,
  endLine: number
): GherkinBlock | null {
  for (const block of blocks) {
    if (block.startLine <= startLine && block.endLine >= endLine) {
      return smallestContainingBlock(block.children, startLine, endLine) ?? block;
    }
  }
  return null;
}

function placeholderAt(
  raw: string,
  character: number
): { start: number; end: number; name: string } | null {
  const re = /<([^>\r\n]+)>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(raw))) {
    const start = match.index;
    const end = start + match[0].length;
    if (character >= start && character <= end) {
      return { start, end, name: match[1] };
    }
  }
  return null;
}

function headerName(text: string): string {
  const trimmed = text.trim();
  const wrapped = trimmed.match(/^<([^>]+)>$/);
  return wrapped ? wrapped[1] : trimmed;
}

function examplesHeaderLine(doc: ParsedDocument, examples: GherkinBlock): number | null {
  for (let i = examples.keywordLine + 1; i <= examples.endLine && i < doc.lines.length; i++) {
    const line = doc.lines[i];
    if (line.inDocString) {
      continue;
    }
    if (
      line.kind === 'blank' ||
      line.kind === 'comment' ||
      line.kind === 'tag' ||
      line.kind === 'other'
    ) {
      continue;
    }
    return line.kind === 'table' ? i : null;
  }
  return null;
}

function outlineAt(doc: ParsedDocument, line: number): GherkinBlock | null {
  const path = blocksAt(doc.blocks, line);
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].kind === 'scenario_outline') {
      return path[i];
    }
  }
  return null;
}

/**
 * Selection chain, innermost first: placeholder, step/tag/row/fence line,
 * then Examples / Scenario / Background, Rule, Feature.
 */
export function selectionRangesAt(
  doc: ParsedDocument,
  line: number,
  character: number
): TextSpan[] {
  if (line < 0 || line >= doc.lines.length) {
    return [];
  }
  const spans: TextSpan[] = [];
  const row = doc.lines[line];
  if (!row.inDocString) {
    const placeholder = placeholderAt(row.raw, character);
    if (placeholder) {
      spans.push({
        startLine: line,
        startChar: placeholder.start,
        endLine: line,
        endChar: placeholder.end,
      });
    }
    if (
      row.kind === 'step' ||
      row.kind === 'tag' ||
      row.kind === 'table' ||
      row.kind === 'docstring_fence'
    ) {
      spans.push({
        startLine: line,
        startChar: 0,
        endLine: line,
        endChar: row.raw.length,
      });
    }
  }
  const path = blocksAt(doc.blocks, line);
  for (let i = path.length - 1; i >= 0; i--) {
    const block = path[i];
    const endRaw = doc.lines[block.endLine]?.raw ?? '';
    spans.push({
      startLine: block.startLine,
      startChar: 0,
      endLine: block.endLine,
      endChar: endRaw.length,
    });
  }
  return spans;
}

/**
 * Highlights of one placeholder and its Examples header cell.
 * Scoped to the Scenario Outline that contains the cursor.
 */
export function placeholderHighlights(
  doc: ParsedDocument,
  line: number,
  character: number
): HighlightSpan[] {
  const outline = outlineAt(doc, line);
  if (!outline || line < 0 || line >= doc.lines.length) {
    return [];
  }
  const row = doc.lines[line];
  if (row.inDocString) {
    return [];
  }

  let name: string | null = null;
  if (row.kind === 'step') {
    name = placeholderAt(row.raw, character)?.name ?? null;
  } else if (row.kind === 'table') {
    for (const child of outline.children) {
      if (child.kind !== 'examples' || examplesHeaderLine(doc, child) !== line) {
        continue;
      }
      const cells = tableCellSpans(row.raw) ?? [];
      for (const cell of cells) {
        if (character >= cell.interiorStart && character < cell.interiorEnd) {
          const header = headerName(cell.text);
          name = header === '' ? null : header;
          break;
        }
      }
    }
  }
  if (!name) {
    return [];
  }

  const spans: HighlightSpan[] = [];
  const token = new RegExp(`<(${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})>`, 'g');
  for (let i = outline.startLine; i <= outline.endLine && i < doc.lines.length; i++) {
    const step = doc.lines[i];
    if (step.inDocString || step.kind !== 'step') {
      continue;
    }
    token.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = token.exec(step.raw))) {
      spans.push({ line: i, start: match.index, end: match.index + match[0].length });
    }
  }
  for (const child of outline.children) {
    if (child.kind !== 'examples') {
      continue;
    }
    const header = examplesHeaderLine(doc, child);
    if (header == null) {
      continue;
    }
    const cells = tableCellSpans(doc.lines[header].raw) ?? [];
    for (const cell of cells) {
      if (headerName(cell.text) === name && cell.end > cell.start) {
        spans.push({ line: header, start: cell.start, end: cell.end });
      }
    }
  }
  return spans;
}
