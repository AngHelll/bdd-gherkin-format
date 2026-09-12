import * as vscode from 'vscode';
import { formatGherkin, type FormatOptions } from '../core/formatGherkin';

function isEnabled(): boolean {
  return vscode.workspace.getConfiguration('bddGherkinFormat').get<boolean>('enabled', true);
}

export function resolveWorkspaceFormatOptions(
  editorOptions: vscode.FormattingOptions
): FormatOptions {
  const config = vscode.workspace.getConfiguration('bddGherkinFormat');
  const indentSize = config.get<number | null>('indentSize', null);
  return {
    indentSize: indentSize ?? editorOptions.tabSize ?? 2,
    alignNumbers: config.get<boolean>('alignNumbers', true),
  };
}

function fullDocumentEdit(
  document: vscode.TextDocument,
  formatOptions: FormatOptions
): vscode.TextEdit[] {
  const original = document.getText();
  const formatted = formatGherkin(original, formatOptions);
  if (formatted === original) {
    return [];
  }
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(original.length)
  );
  return [vscode.TextEdit.replace(fullRange, formatted)];
}

function rangeEdit(
  document: vscode.TextDocument,
  range: vscode.Range,
  formatOptions: FormatOptions
): vscode.TextEdit[] {
  const original = document.getText();
  const formatted = formatGherkin(original, {
    ...formatOptions,
    range: {
      startLine: range.start.line,
      endLine: range.end.line,
    },
  });
  if (formatted === original) {
    return [];
  }
  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(original.length)
  );
  // Range format may only change lines in range but we rewrite via full-text
  // compare so surrounding lines stay identical.
  return [vscode.TextEdit.replace(fullRange, formatted)];
}

export class GherkinFormattingProvider
  implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider
{
  provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (!isEnabled()) {
      return [];
    }
    return fullDocumentEdit(document, resolveWorkspaceFormatOptions(options));
  }

  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range,
    options: vscode.FormattingOptions
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (!isEnabled()) {
      return [];
    }
    return rangeEdit(document, range, resolveWorkspaceFormatOptions(options));
  }
}

export const formattingDocumentSelector: vscode.DocumentSelector = [
  { language: 'gherkin' },
  { language: 'feature' },
  { pattern: '**/*.feature' },
];
