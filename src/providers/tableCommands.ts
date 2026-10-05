/**
 * Spreadsheet-style table commands and align-on-type for `|`.
 */

import * as vscode from 'vscode';
import {
  alignOnTypeEdits,
  alignTableAt,
  deleteColumn,
  insertColumn,
  moveColumn,
  navigateCell,
  parseDelimited,
  renderTable,
  sortByColumn,
  tableAt,
  tableToTsv,
  type TableEditOptions,
  type TableRewrite,
} from '../core/tableEdit';
import type { ParsedDocument } from '../core/structure';
import { formattingDocumentSelector } from './gherkinFormattingProvider';
import { caretInTableRow } from './insertTableRow';
import { parsed } from './parseCache';

type TableOperation = (
  doc: ParsedDocument,
  line: number,
  character: number,
  options: TableEditOptions
) => TableRewrite | null;

function tableOptions(): TableEditOptions {
  return {
    alignNumbers: vscode.workspace.getConfiguration('bddGherkinFormat').get<boolean>('alignNumbers', true),
  };
}

async function applyRewrite(editor: vscode.TextEditor, result: TableRewrite): Promise<void> {
  const { document } = editor;
  const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  const range = new vscode.Range(result.startLine, 0, result.endLine, document.lineAt(result.endLine).text.length);
  const applied = await editor.edit((builder) => builder.replace(range, result.lines.join(eol)));
  if (applied) {
    const { line, start, end } = result.selection;
    editor.selection = new vscode.Selection(line, start, line, end);
    editor.revealRange(editor.selection);
  }
}

function runOnTable(operation: TableOperation, fallback?: string): () => Promise<void> {
  return async () => {
    const editor = vscode.window.activeTextEditor;
    const result = caretInTableRow(editor)
      ? operation(parsed(editor.document), editor.selection.active.line, editor.selection.active.character, tableOptions())
      : null;
    if (result && editor) {
      await applyRewrite(editor, result);
    } else if (fallback) {
      await vscode.commands.executeCommand(fallback);
    }
  };
}

function lineIndent(document: vscode.TextDocument, line: number, unit: string): string {
  const text = document.lineAt(line).text;
  if (text.trim() !== '') {
    return text.match(/^[ \t]*/)?.[0] ?? '';
  }
  if (text.length > 0) {
    return text;
  }
  for (let i = line - 1; i >= 0; i--) {
    const previous = document.lineAt(i).text;
    if (previous.trim() !== '') {
      return (previous.match(/^[ \t]*/)?.[0] ?? '') + unit;
    }
  }
  return '';
}

async function pasteAsTable(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const rows = parseDelimited(await vscode.env.clipboard.readText());
  if (!rows) {
    void vscode.window.showInformationMessage('Clipboard has no table (TSV, CSV, or Gherkin rows).');
    return;
  }
  const { document, selection } = editor;
  const options = tableOptions();
  const eol = document.eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n';
  const unit = editor.options.insertSpaces === false ? '\t' : ' '.repeat(Number(editor.options.tabSize) || 2);
  const existing = selection.isEmpty ? tableAt(parsed(document), selection.active.line) : null;

  let range: vscode.Range;
  let lines: string[];
  if (existing) {
    lines = renderTable([...existing.rows, ...rows], existing.indent, options);
    range = new vscode.Range(existing.startLine, 0, existing.endLine, document.lineAt(existing.endLine).text.length);
  } else if (!selection.isEmpty) {
    lines = renderTable(rows, lineIndent(document, selection.start.line, unit), options);
    range = new vscode.Range(selection.start.line, 0, selection.end.line, document.lineAt(selection.end.line).text.length);
  } else {
    const line = selection.active.line;
    const current = document.lineAt(line);
    if (current.isEmptyOrWhitespace) {
      lines = renderTable(rows, lineIndent(document, line, unit), options);
      range = current.range;
    } else {
      lines = ['', ...renderTable(rows, lineIndent(document, line, '') + unit, options)];
      range = new vscode.Range(current.range.end, current.range.end);
    }
  }
  await editor.edit((builder) => builder.replace(range, lines.join(eol)));
}

async function copyTableAsTsv(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  const table = caretInTableRow(editor) ? tableAt(parsed(editor.document), editor.selection.active.line) : null;
  if (!table) {
    return;
  }
  await vscode.env.clipboard.writeText(tableToTsv(table.rows));
  void vscode.window.setStatusBarMessage(`Copied ${table.rows.length} rows as TSV`, 3000);
}

export function registerTableCommands(context: vscode.ExtensionContext): void {
  const command = (id: string, run: () => Promise<void>) =>
    vscode.commands.registerCommand(`bddGherkinFormat.${id}`, run);

  context.subscriptions.push(
    command('nextCell', runOnTable((d, l, c, o) => navigateCell(d, l, c, 1, o), 'tab')),
    command('previousCell', runOnTable((d, l, c, o) => navigateCell(d, l, c, -1, o), 'outdent')),
    command('alignTable', runOnTable(alignTableAt)),
    command('insertColumnLeft', runOnTable((d, l, c, o) => insertColumn(d, l, c, 'left', o))),
    command('insertColumnRight', runOnTable((d, l, c, o) => insertColumn(d, l, c, 'right', o))),
    command('deleteColumn', runOnTable(deleteColumn)),
    command('moveColumnLeft', runOnTable((d, l, c, o) => moveColumn(d, l, c, -1, o))),
    command('moveColumnRight', runOnTable((d, l, c, o) => moveColumn(d, l, c, 1, o))),
    command('sortAscending', runOnTable((d, l, c, o) => sortByColumn(d, l, c, 'asc', o))),
    command('sortDescending', runOnTable((d, l, c, o) => sortByColumn(d, l, c, 'desc', o))),
    command('pasteAsTable', pasteAsTable),
    command('copyTableAsTsv', copyTableAsTsv),
    vscode.languages.registerOnTypeFormattingEditProvider(
      formattingDocumentSelector,
      {
        provideOnTypeFormattingEdits(document, position) {
          const config = vscode.workspace.getConfiguration('bddGherkinFormat');
          if (!config.get<boolean>('enabled', true) || !config.get<boolean>('alignTablesOnType', true)) {
            return [];
          }
          return alignOnTypeEdits(parsed(document), position.line, tableOptions()).map((edit) =>
            vscode.TextEdit.replace(new vscode.Range(edit.line, edit.start, edit.line, edit.end), edit.text)
          );
        },
      },
      '|'
    )
  );
}
