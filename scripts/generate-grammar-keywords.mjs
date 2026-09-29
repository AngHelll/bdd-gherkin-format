/**
 * Writes keyword alternations from src/core/dialects.json into the TextMate
 * grammar and the language-configuration indent / onEnter patterns.
 * DocString injection and table patterns are left untouched.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dialects = JSON.parse(readFileSync(join(root, 'src/core/dialects.json'), 'utf8'));

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function alternation(words) {
  const unique = [...new Set(words)];
  unique.sort((a, b) => b.length - a.length || a.localeCompare(b));
  return unique.map(escapeRegex).join('|');
}

function all(field) {
  const seen = [];
  for (const dialect of Object.values(dialects)) {
    for (const word of dialect[field]) {
      if (!seen.includes(word)) {
        seen.push(word);
      }
    }
  }
  return seen;
}

const HEADING_FIELDS = ['feature', 'rule', 'background', 'scenarioOutline', 'scenario', 'examples'];
const STEP_FIELDS = ['given', 'when', 'then', 'and', 'but'];

function heading(field) {
  return `^(\\s*)(${alternation(all(field))})(:)(.*)$`;
}

const stepWords = STEP_FIELDS.flatMap((field) => all(field));
const headingWords = HEADING_FIELDS.flatMap((field) => all(field));
const headingAlt = alternation(headingWords);
const stepAlt = `${alternation(stepWords)}|\\*`;

const grammarPath = join(root, 'syntaxes/gherkin.tmLanguage.json');
const grammar = JSON.parse(readFileSync(grammarPath, 'utf8'));
grammar.repository.feature.match = heading('feature');
grammar.repository.rule.match = heading('rule');
grammar.repository.background.match = heading('background');
grammar.repository.scenario_outline.match = heading('scenarioOutline');
grammar.repository.scenario.match = heading('scenario');
grammar.repository.examples.match = heading('examples');
grammar.repository.step.match = `^(\\s*)(${stepAlt})(\\s+)(.*)$`;
writeFileSync(grammarPath, `${JSON.stringify(grammar, null, 2)}\n`);

const configPath = join(root, 'language-configuration.json');
const config = JSON.parse(readFileSync(configPath, 'utf8'));
delete config.folding;
config.indentationRules.increaseIndentPattern = `^\\s*(${headingAlt})\\b.*:.*$`;
config.indentationRules.decreaseIndentPattern = `^\\s*(${headingAlt})\\b`;
const rules = config.onEnterRules ?? [];
if (rules[0]?.action?.indent === 'indent') {
  rules[0].beforeText = `^\\s*(${headingAlt})\\b.*:.*$`;
}
const stepRule = rules.find((rule) => rule.action?.indent === 'none' && rule.beforeText.includes('Given'));
if (stepRule) {
  stepRule.beforeText = `^\\s*(${stepAlt})\\s+.*$`;
}
writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log('grammar keywords regenerated from src/core/dialects.json');
