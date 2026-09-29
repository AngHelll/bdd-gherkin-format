/**
 * Line classification for Gherkin layout.
 * Keywords come from the active dialect (default English).
 * Pure — no vscode. Never indexes bindings.
 */

import {
  DIALECTS,
  keywordAlternation,
  type DialectKeywords,
} from './dialects';

export type LineKind =
  | 'blank'
  | 'comment'
  | 'tag'
  | 'feature'
  | 'rule'
  | 'background'
  | 'scenario'
  | 'scenario_outline'
  | 'examples'
  | 'step'
  | 'table'
  | 'docstring_fence'
  | 'other';

const TAG = /^@\S/;
const TABLE = /^\|/;
const DOCSTRING_FENCE = /^("""|```)/;
const COMMENT = /^#/;

const STRUCTURAL_KINDS = new Set<LineKind>([
  'feature',
  'rule',
  'background',
  'scenario',
  'scenario_outline',
  'examples',
]);

export function isStructuralKind(kind: LineKind): boolean {
  return STRUCTURAL_KINDS.has(kind);
}

export function stripIndent(line: string): string {
  return line.replace(/^\s*/, '');
}

function wordsFor(
  dialect: DialectKeywords,
  kind: LineKind
): string[] {
  switch (kind) {
    case 'feature':
      return dialect.feature;
    case 'rule':
      return dialect.rule;
    case 'background':
      return dialect.background;
    case 'scenario':
      return dialect.scenario;
    case 'scenario_outline':
      return dialect.scenarioOutline;
    case 'examples':
      return dialect.examples;
    default:
      return [];
  }
}

function stepWords(dialect: DialectKeywords): string[] {
  return [
    ...dialect.given,
    ...dialect.when,
    ...dialect.then,
    ...dialect.and,
    ...dialect.but,
  ];
}

function matchKeyword(content: string, words: string[]): string | null {
  if (words.length === 0) {
    return null;
  }
  const re = new RegExp(`^(${keywordAlternation(words)})\\b`, 'i');
  const match = content.match(re);
  return match ? match[1] : null;
}

export function matchHeading(
  content: string,
  kind: LineKind,
  dialect: DialectKeywords = DIALECTS.en
): { keyword: string; title: string } | null {
  const words = wordsFor(dialect, kind);
  if (words.length === 0) {
    return null;
  }
  const re = new RegExp(`^(${keywordAlternation(words)})\\s*:(.*)$`, 'i');
  const match = content.match(re);
  if (!match) {
    const keyword = matchKeyword(content, words);
    return keyword ? { keyword, title: '' } : null;
  }
  return { keyword: match[1], title: match[2].trim() };
}

export interface StepMatch {
  keyword: string;
  text: string;
}

export function matchStep(
  content: string,
  dialect: DialectKeywords = DIALECTS.en
): StepMatch | null {
  const words = stepWords(dialect);
  const star = '(?:\\*)';
  const body = words.length > 0 ? `${keywordAlternation(words)}|${star}` : star;
  const re = new RegExp(`^(${body})(?:\\s+(.*))?$`, 'i');
  const match = content.match(re);
  if (!match) {
    return null;
  }
  return { keyword: match[1], text: (match[2] ?? '').trim() };
}

export function classifyLine(
  rawLine: string,
  dialect: DialectKeywords = DIALECTS.en
): LineKind {
  const trimmed = rawLine.trim();
  if (trimmed === '') {
    return 'blank';
  }
  const content = stripIndent(rawLine);
  if (COMMENT.test(content)) {
    return 'comment';
  }
  if (DOCSTRING_FENCE.test(content)) {
    return 'docstring_fence';
  }
  if (TABLE.test(content)) {
    return 'table';
  }
  if (TAG.test(content)) {
    return 'tag';
  }
  if (matchKeyword(content, dialect.feature)) {
    return 'feature';
  }
  if (matchKeyword(content, dialect.rule)) {
    return 'rule';
  }
  if (matchKeyword(content, dialect.background)) {
    return 'background';
  }
  if (matchKeyword(content, dialect.scenarioOutline)) {
    return 'scenario_outline';
  }
  if (matchKeyword(content, dialect.examples)) {
    return 'examples';
  }
  if (matchKeyword(content, dialect.scenario)) {
    return 'scenario';
  }
  if (matchStep(content, dialect)) {
    return 'step';
  }
  return 'other';
}

/** Indent level (0-based units) for a classified line given nesting. */
export function indentLevelFor(
  kind: LineKind,
  ctx: { inRule: boolean; inDocString: boolean; docStringBase: number }
): number {
  if (ctx.inDocString && kind !== 'docstring_fence') {
    return ctx.docStringBase;
  }

  // Rule nests Scenario/Background one level deeper under Feature.
  const nest = ctx.inRule ? 1 : 0;

  switch (kind) {
    case 'blank':
      return 0;
    case 'feature':
      return 0;
    case 'rule':
      return 1;
    case 'tag':
      return 1 + nest;
    case 'background':
    case 'scenario':
    case 'scenario_outline':
      return 1 + nest;
    case 'examples':
      // Same depth as steps (under Scenario / Scenario Outline)
      return 2 + nest;
    case 'step':
    case 'comment':
    case 'other':
      return 2 + nest;
    case 'table':
    case 'docstring_fence':
      return 3 + nest;
    default:
      return 2 + nest;
  }
}
