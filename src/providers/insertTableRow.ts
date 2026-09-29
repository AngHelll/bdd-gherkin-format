/**
 * Enter at the end of a `|` row inserts a skeleton row with the same column count.
 */

import * as vscode from 'vscode';
import { tableRowSkeleton } from '../core/alignTables';

const CONTEXT_KEY = 'bddGherkinFormat.caretAtTableRowEnd';
const TABLE_ROW = /^\s*\|/;

function isGherkin(document: vscode.TextDocument): boolean {
  return document.languageId === 'gherkin' || document.languageId === 'feature';
}

function caretAtTableRowEnd(editor: vscode.TextEditor | undefined): boolean {
  if (!editor || !isGherkin(editor.document) || editor.selections.length !== 1) {
    return false;
  }
  const { selection } = editor;
  if (!selection.isEmpty) {
    return false;
  }
  const text = editor.document.lineAt(selection.active.line).text;
  return TABLE_ROW.test(text) && selection.active.character >= text.trimEnd().length;
}

export function registerTableRowContext(context: vscode.ExtensionContext): void {
  let current = false;
  const update = (editor: vscode.TextEditor | undefined): void => {
    const next = caretAtTableRowEnd(editor);
    if (next !== current) {
      current = next;
      void vscode.commands.executeCommand('setContext', CONTEXT_KEY, next);
    }
  };
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.window.onDidChangeTextEditorSelection((event) => update(event.textEditor))
  );
  update(vscode.window.activeTextEditor);
}

export async function insertTableRow(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const line = editor.document.lineAt(editor.selection.active.line);
  const skeleton = caretAtTableRowEnd(editor) ? tableRowSkeleton(line.text) : null;
  if (!skeleton) {
    await vscode.commands.executeCommand('type', { text: '\n' });
    return;
  }
  const indent = line.text.match(/^[ \t]*/)?.[0] ?? '';
  const inserted = `\n${indent}${skeleton.row}`;
  const applied = await editor.edit((builder) => {
    builder.insert(line.range.end, inserted);
  });
  if (!applied) {
    return;
  }
  const caret = new vscode.Position(line.lineNumber + 1, indent.length + skeleton.caret);
  editor.selection = new vscode.Selection(caret, caret);
}
