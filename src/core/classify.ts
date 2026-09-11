/**
 * Line classification for Gherkin layout (English keywords).
 * Pure — no vscode. Never indexes bindings.
 */

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

const FEATURE = /^Feature\b/i;
const RULE = /^Rule\b/i;
const BACKGROUND = /^Background\b/i;
const SCENARIO_OUTLINE = /^Scenario\s+Outline\b/i;
const SCENARIO = /^Scenario\b/i;
const EXAMPLES = /^Examples\b/i;
const STEP = /^(Given|When|Then|And|But)\b/i;
const TAG = /^@\S/;
const TABLE = /^\|/;
const DOCSTRING_FENCE = /^("""|```)/;
const COMMENT = /^#/;

export function stripIndent(line: string): string {
  return line.replace(/^\s*/, '');
}

export function classifyLine(rawLine: string): LineKind {
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
  if (FEATURE.test(content)) {
    return 'feature';
  }
  if (RULE.test(content)) {
    return 'rule';
  }
  if (BACKGROUND.test(content)) {
    return 'background';
  }
  if (SCENARIO_OUTLINE.test(content)) {
    return 'scenario_outline';
  }
  if (SCENARIO.test(content)) {
    return 'scenario';
  }
  if (EXAMPLES.test(content)) {
    return 'examples';
  }
  if (STEP.test(content)) {
    return 'step';
  }
  return 'other';
}

/** Indent level (0-based units of 2 spaces) for a classified line given nesting. */
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
