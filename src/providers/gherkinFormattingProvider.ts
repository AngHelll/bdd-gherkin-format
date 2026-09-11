import * as vscode from 'vscode';
import { formatGherkin } from '../core/formatGherkin';

function isEnabled(): boolean {
  return vscode.workspace.getConfiguration('bddGherkinFormat').get<boolean>('enabled', true);
}

function fullDocumentEdit(document: vscode.TextDocument): vscode.TextEdit[] {
  const original = document.getText();
  const formatted = formatGherkin(original);
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
  range: vscode.Range
): vscode.TextEdit[] {
  const original = document.getText();
  const formatted = formatGherkin(original, {
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
    document: vscode.TextDocument
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (!isEnabled()) {
      return [];
    }
    return fullDocumentEdit(document);
  }

  provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.ProviderResult<vscode.TextEdit[]> {
    if (!isEnabled()) {
      return [];
    }
    return rangeEdit(document, range);
  }
}

export const formattingDocumentSelector: vscode.DocumentSelector = [
  { language: 'gherkin' },
  { language: 'feature' },
  { pattern: '**/*.feature' },
];
