import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

describe('extension boundaries', () => {
  it('does not hard-depend on another ForgeOne extension', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      extensionDependencies?: string[];
      contributes?: { extensionPack?: string[] };
    };
    expect(pkg.extensionDependencies).toBeUndefined();
    expect(pkg.contributes?.extensionPack).toBeUndefined();
  });

  it('activates only when a Gherkin document opens', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      activationEvents: string[];
    };
    expect(pkg.activationEvents.every((event) => event.startsWith('onLanguage:'))).toBe(true);
  });

  it('binds Enter only through a context key the extension owns', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      contributes: { keybindings: { key: string; when: string }[] };
    };
    const enter = pkg.contributes.keybindings.filter((binding) => binding.key === 'enter');
    for (const binding of enter) {
      expect(binding.when).toContain('bddGherkinFormat.caretAtTableRowEnd');
      expect(binding.when).toContain('!suggestWidgetVisible');
      expect(binding.when).toContain('!inlineSuggestionVisible');
      expect(binding.when).not.toContain('editorLineText');
    }
  });

  it('binds Tab in tables only where it cannot steal completion, snippets, or indent', () => {
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
      contributes: { keybindings: { key: string; when: string }[] };
    };
    const tabs = pkg.contributes.keybindings.filter((binding) => /^(shift\+)?tab$/.test(binding.key));
    expect(tabs).toHaveLength(2);
    for (const binding of tabs) {
      for (const guard of [
        'bddGherkinFormat.inTableRow',
        '!suggestWidgetVisible',
        '!inlineSuggestionVisible',
        '!inSnippetMode',
        '!editorTabMovesFocus',
        'config.bddGherkinFormat.tableTabNavigation',
      ]) {
        expect(binding.when).toContain(guard);
      }
    }
  });

  it('keeps the ForgeOne pack in a separate manifest', () => {
    const pack = JSON.parse(readFileSync(join(root, 'extension-pack/package.json'), 'utf8')) as {
      extensionPack: string[];
      extensionDependencies?: string[];
    };
    expect(pack.extensionDependencies).toBeUndefined();
    expect(pack.extensionPack).toEqual([
      'anghelll.bdd-gherkin-format',
      'anghelll.bdd-guardian',
    ]);
    expect(pack.extensionPack.join(' ')).not.toMatch(/pilot|jarvis/);
  });
});