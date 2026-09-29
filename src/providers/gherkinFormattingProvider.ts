import * as vscode from 'vscode';
import { formatGherkin, type FormatOptions } from '../core/formatGherkin';
import { minimalEdit } from '../core/minimalEdit';

function isEnabled(): boolean {
  return vscode.workspace.getConfiguration('bddGherkinFormat').get<boolean>('enabled', true);
}

export function resolveWorkspaceFormatOptions(
  editorOptions: vscode.FormattingOptions
): FormatOptions {
  const config = vscode.workspace.getConfiguration('bddGherkinFormat');
  const indentSize = config.get<number | null>('indentSize', null);
  const tagLayout = config.get<string>('tagLayout', 'preserve');
  const blankLines = config.get<string>('blankLines', 'preserve');
  return {
    indentSize: indentSize ?? editorOptions.tabSize ?? 2,
    alignNumbers: config.get<boolean>('alignNumbers', true),
    keywordSpacing: config.get<boolean>('keywordSpacing', false),
    alignStepKeywords: config.get<boolean>('alignStepKeywords', false),
    tagLayout: tagLayout === 'onePerLine' ? 'onePerLine' : 'preserve',
    indentDocStrings: config.get<boolean>('indentDocStrings', false),
    blankLines: blankLines === 'pretty' ? 'pretty' : 'preserve',
  };
}

function toTextEdits(
  document: vscode.TextDocument,
  original: string,
  formatted: string
): vscode.TextEdit[] {
  const edit = minimalEdit(original, formatted);
  if (!edit) {
    return [];
  }
  const range = new vscode.Range(document.positionAt(edit.start), document.positionAt(edit.end));
  return [vscode.TextEdit.replace(range, edit.text)];
}

function fullDocumentEdit(
  document: vscode.TextDocument,
  formatOptions: FormatOptions
): vscode.TextEdit[] {
  const original = document.getText();
  return toTextEdits(document, original, formatGherkin(original, formatOptions));
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
  return toTextEdits(document, original, formatted);
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
