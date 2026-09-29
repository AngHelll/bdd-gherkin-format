/**
 * Gherkin keyword tables shared by the classifier and the TextMate grammar.
 * Star (`*`) is a step keyword in every dialect and is not listed here.
 * Never indexes bindings.
 */

import rawDialects from './dialects.json';

export interface DialectKeywords {
  feature: string[];
  rule: string[];
  background: string[];
  scenario: string[];
  scenarioOutline: string[];
  examples: string[];
  given: string[];
  when: string[];
  then: string[];
  and: string[];
  but: string[];
}

export const DIALECTS = rawDialects as Record<string, DialectKeywords>;

export const DEFAULT_DIALECT_ID = 'en';

export const HEADING_FIELDS = [
  'feature',
  'rule',
  'background',
  'scenarioOutline',
  'scenario',
  'examples',
] as const;

export const STEP_FIELDS = ['given', 'when', 'then', 'and', 'but'] as const;

export type HeadingField = (typeof HEADING_FIELDS)[number];
export type StepField = (typeof STEP_FIELDS)[number];

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Longest keyword first so `Scenario Outline` wins over `Scenario`. */
export function keywordAlternation(words: readonly string[]): string {
  const unique = [...new Set(words)];
  unique.sort((a, b) => b.length - a.length || a.localeCompare(b));
  return unique.map(escapeRegex).join('|');
}

export function resolveDialect(id: string | null | undefined): DialectKeywords {
  if (!id) {
    return DIALECTS[DEFAULT_DIALECT_ID];
  }
  return DIALECTS[id.toLowerCase()] ?? DIALECTS[DEFAULT_DIALECT_ID];
}

/**
 * Dialect from the first non-blank `# language: <iso>` line.
 * Unknown iso falls back to English.
 */
export function detectDialectId(text: string): string {
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') {
      continue;
    }
    const match = line.match(/^\s*#\s*language:\s*([A-Za-z0-9-]+)\s*$/i);
    if (!match) {
      return DEFAULT_DIALECT_ID;
    }
    const id = match[1].toLowerCase();
    return DIALECTS[id] ? id : DEFAULT_DIALECT_ID;
  }
  return DEFAULT_DIALECT_ID;
}

export function allDialectWords(
  field: keyof DialectKeywords
): string[] {
  const seen: string[] = [];
  for (const dialect of Object.values(DIALECTS)) {
    for (const word of dialect[field]) {
      if (!seen.includes(word)) {
        seen.push(word);
      }
    }
  }
  return seen;
}

export function allStepWords(): string[] {
  const seen: string[] = [];
  for (const dialect of Object.values(DIALECTS)) {
    for (const field of STEP_FIELDS) {
      for (const word of dialect[field]) {
        if (!seen.includes(word)) {
          seen.push(word);
        }
      }
    }
  }
  return seen;
}

export function allHeadingWords(): string[] {
  const seen: string[] = [];
  for (const dialect of Object.values(DIALECTS)) {
    for (const field of HEADING_FIELDS) {
      for (const word of dialect[field]) {
        if (!seen.includes(word)) {
          seen.push(word);
        }
      }
    }
  }
  return seen;
}
