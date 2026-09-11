/**
 * Capa B dogfood (automated slice): format real sibling .feature files.
 * Asserts: no step-text corruption, idempotent second pass.
 * Does not require Cucumber Official / alexkrechik.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatGherkin } from '../core';

const REPOS = join(__dirname, '..', '..', '..');

function collectFeatures(root: string, acc: string[] = []): string[] {
  if (!existsSync(root)) {
    return acc;
  }
  for (const name of readdirSync(root)) {
    if (name === 'node_modules' || name === 'bin' || name === 'obj') {
      continue;
    }
    const p = join(root, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      collectFeatures(p, acc);
    } else if (name.endsWith('.feature')) {
      acc.push(p);
    }
  }
  return acc;
}

const dogfoodRoots = [
  join(REPOS, 'bdd-guardian', 'samples'),
  join(REPOS, 'automation-web-csharp', 'AkSolutions.Tests', 'Features'),
].filter((p) => existsSync(p));

const features = dogfoodRoots.flatMap((r) => collectFeatures(r));

describe('Capa B dogfood corpus', () => {
  it('finds Guardian samples + automation-web-csharp features', () => {
    expect(features.length).toBeGreaterThan(0);
    expect(features.some((f) => f.includes('binding-demo'))).toBe(true);
  });

  for (const file of features) {
    const label = file.replace(REPOS + '/', '');
    it(`formats without corrupting steps: ${label}`, () => {
      const original = readFileSync(file, 'utf8');
      const stepLines = original
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => /^(Given|When|Then|And|But)\b/i.test(l));

      const once = formatGherkin(original);
      const twice = formatGherkin(once);

      expect(twice).toBe(once);

      for (const step of stepLines) {
        expect(once).toContain(step.replace(/^\s*/, '').trim());
      }

      // Mute: formatter output must not invent binding/index jargon
      expect(once).not.toMatch(/\bundefined.step\b/i);
      expect(once).not.toMatch(/\bcucumber\.glue\b/i);
    });
  }
});
