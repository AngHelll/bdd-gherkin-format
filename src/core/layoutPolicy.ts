/**
 * Opt-in layout passes. Defaults leave the document unchanged.
 * Pure — no vscode. Never indexes bindings.
 */

import { isStructuralKind, matchHeading, matchStep, type LineKind } from './classify';
import type { DialectKeywords } from './dialects';

export interface PolicyLine {
  kind: LineKind;
  content: string;
  original: string;
  level: number;
  preserveOriginal: boolean;
  inDocString: boolean;
  sourceIndex: number;
  /** True when this blank was inserted by the pretty-blank pass. */
  inserted?: boolean;
}

const BLANK_BEFORE = new Set<LineKind>([
  'rule',
  'background',
  'scenario',
  'scenario_outline',
  'examples',
]);

export function applyKeywordSpacing(lines: PolicyLine[], dialect: DialectKeywords): void {
  for (const line of lines) {
    if (line.preserveOriginal || line.inDocString || line.kind === 'blank') {
      continue;
    }
    if (line.kind === 'step') {
      const step = matchStep(line.content, dialect);
      if (!step) {
        continue;
      }
      line.content = step.text === '' ? step.keyword : `${step.keyword} ${step.text}`;
      continue;
    }
    if (!isStructuralKind(line.kind)) {
      continue;
    }
    const heading = matchHeading(line.content, line.kind, dialect);
    if (!heading) {
      continue;
    }
    line.content =
      heading.title === '' ? `${heading.keyword}:` : `${heading.keyword}: ${heading.title}`;
  }
}

export function applyAlignStepKeywords(lines: PolicyLine[], dialect: DialectKeywords): void {
  const flush = (group: number[]) => {
    const matches = group
      .map((index) => matchStep(lines[index].content, dialect))
      .filter((step): step is NonNullable<typeof step> => step !== null && step.text !== '');
    if (matches.length === 0) {
      return;
    }
    const width = Math.max(...matches.map((step) => step.keyword.length));
    for (const index of group) {
      const step = matchStep(lines[index].content, dialect);
      if (!step || step.text === '') {
        continue;
      }
      const gap = ' '.repeat(width - step.keyword.length + 1);
      lines[index].content = `${step.keyword}${gap}${step.text}`;
    }
  };

  let group: number[] = [];
  const reset = () => {
    flush(group);
    group = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.inDocString || line.preserveOriginal) {
      continue;
    }
    if (
      line.kind === 'feature' ||
      line.kind === 'rule' ||
      line.kind === 'background' ||
      line.kind === 'scenario' ||
      line.kind === 'scenario_outline'
    ) {
      reset();
      continue;
    }
    if (line.kind === 'step') {
      group.push(i);
    }
  }
  reset();
}

export function applyTagLayout(lines: PolicyLine[]): PolicyLine[] {
  const out: PolicyLine[] = [];
  for (const line of lines) {
    if (line.kind !== 'tag' || line.inDocString || line.preserveOriginal) {
      out.push(line);
      continue;
    }
    const tags = line.content.match(/@\S+/g);
    if (!tags || tags.length <= 1) {
      out.push(line);
      continue;
    }
    for (const tag of tags) {
      out.push({ ...line, content: tag, inserted: false });
    }
  }
  return out;
}

export function docstringBodyText(
  lines: PolicyLine[],
  index: number,
  indentSize: number
): string | null {
  if (!lines[index].inDocString || lines[index].kind === 'docstring_fence') {
    return null;
  }
  let fence = index - 1;
  while (fence >= 0 && lines[fence].inDocString) {
    fence -= 1;
  }
  if (fence < 0 || lines[fence].kind !== 'docstring_fence') {
    return null;
  }
  let end = index + 1;
  while (end < lines.length && lines[end].inDocString) {
    end += 1;
  }
  const body: number[] = [];
  for (let i = fence + 1; i < end; i++) {
    if (lines[i].inDocString) {
      body.push(i);
    }
  }
  const leads = body
    .map((i) => lines[i].original)
    .filter((text) => text.trim() !== '')
    .map((text) => text.match(/^[ \t]*/)?.[0].length ?? 0);
  const minLead = leads.length > 0 ? Math.min(...leads) : 0;
  const base = lines[fence].level * indentSize + indentSize;
  const original = lines[index].original;
  if (original.trim() === '') {
    return '';
  }
  const lead = original.match(/^[ \t]*/)?.[0].length ?? 0;
  const relative = Math.max(0, lead - minLead);
  return ' '.repeat(base + relative) + original.slice(lead);
}

const CLUSTER = new Set<LineKind>(['tag', 'comment']);

export function applyBlankLines(lines: PolicyLine[]): PolicyLine[] {
  const collapsed = collapseBlankRuns(lines);
  const unstuck = removeStructuralBlanks(collapsed);
  return ensureBlankBefore(unstuck);
}

function collapseBlankRuns(lines: PolicyLine[]): PolicyLine[] {
  const out: PolicyLine[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (
      line.kind === 'blank' &&
      !line.inDocString &&
      prev &&
      prev.kind === 'blank' &&
      !prev.inDocString
    ) {
      continue;
    }
    out.push(line);
  }
  return out;
}

function neighbor(
  lines: PolicyLine[],
  index: number,
  direction: -1 | 1,
  skip: Set<LineKind>
): PolicyLine | null {
  for (let i = index + direction; i >= 0 && i < lines.length; i += direction) {
    const line = lines[i];
    if (line.inDocString) {
      return null;
    }
    if (line.kind === 'blank' || skip.has(line.kind)) {
      continue;
    }
    return line;
  }
  return null;
}

function removeStructuralBlanks(lines: PolicyLine[]): PolicyLine[] {
  const drop = new Set<number>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.kind !== 'blank' || line.inDocString) {
      continue;
    }
    const leftStep = neighbor(lines, i, -1, new Set(['comment']));
    const rightStep = neighbor(lines, i, 1, new Set(['comment']));
    if (leftStep?.kind === 'step' && rightStep?.kind === 'step') {
      drop.add(i);
      continue;
    }
    const leftTag = neighbor(lines, i, -1, new Set(['comment']));
    const rightKeyword = neighbor(lines, i, 1, new Set(['comment']));
    if (leftTag?.kind === 'tag' && rightKeyword && BLANK_BEFORE.has(rightKeyword.kind)) {
      drop.add(i);
    }
  }
  return lines.filter((_, index) => !drop.has(index));
}

function ensureBlankBefore(lines: PolicyLine[]): PolicyLine[] {
  const out: PolicyLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.inDocString && BLANK_BEFORE.has(line.kind)) {
      let cluster = i;
      while (cluster > 0) {
        const prev = lines[cluster - 1];
        if (prev.inDocString || !CLUSTER.has(prev.kind)) {
          break;
        }
        cluster -= 1;
      }
      const clusterLen = i - cluster;
      const insertAt = out.length - clusterLen;
      const prev = insertAt > 0 ? out[insertAt - 1] : undefined;
      if (cluster > 0 && prev && prev.kind !== 'blank') {
        out.splice(insertAt, 0, {
          kind: 'blank',
          content: '',
          original: '',
          level: 0,
          preserveOriginal: false,
          inDocString: false,
          sourceIndex: lines[cluster].sourceIndex,
          inserted: true,
        });
      }
    }
    out.push(line);
  }
  return out;
}
