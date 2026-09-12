import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const configPath = join(here, '..', '..', 'language-configuration.json');

describe('gherkin language configuration', () => {
  const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
    comments?: { lineComment?: string };
    folding?: { offSide?: boolean };
    indentationRules?: { increaseIndentPattern?: string; decreaseIndentPattern?: string };
    onEnterRules?: Array<{ beforeText: string; action: { indent: string } }>;
    wordPattern?: string;
  };

  it('keeps # comments and off-side folding', () => {
    expect(config.comments?.lineComment).toBe('#');
    expect(config.folding?.offSide).toBe(true);
  });

  it('indents after structural keywords and keeps step/table indent', () => {
    expect(config.indentationRules?.increaseIndentPattern).toMatch(/Scenario Template/);
    expect(config.indentationRules?.decreaseIndentPattern).toMatch(/Business Need/);
    const before = (config.onEnterRules ?? []).map((r) => r.beforeText);
    expect(before.some((p) => p.includes('Scenario Outline'))).toBe(true);
    expect(before.some((p) => p.includes('Given'))).toBe(true);
    expect(before.some((p) => p.includes('\\|'))).toBe(true);
  });

  it('treats @tags and <placeholders> as words', () => {
    expect(config.wordPattern).toMatch(/@\[\\w/);
    expect(config.wordPattern).toMatch(/<\[\^>\]\+>/);
  });
});
