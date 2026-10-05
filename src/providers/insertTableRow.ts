/**
 * Enter at the end of a `|` row inserts a skeleton row with the same column count.
 */

import * as vscode from 'vscode';
import { tableRowSkeleton } from '../core/alignTables';

const AT_ROW_END_KEY = 'bddGherkinFormat.caretAtTableRowEnd';
const IN_ROW_KEY = 'bddGherkinFormat.inTableRow';
const TABLE_ROW = /^\s*\|/;

function isGherkin(document: vscode.TextDocument): boolean {
  return document.languageId === 'gherkin' || document.languageId === 'feature';
}

export function caretInTableRow(editor: vscode.TextEditor | undefined): editor is vscode.TextEditor {
  if (
    !editor ||
    !isGherkin(editor.document) ||
    editor.selections.length !== 1 ||
    !editor.selection.isSingleLine
  ) {
    return false;
  }
  return TABLE_ROW.test(editor.document.lineAt(editor.selection.active.line).text);
}

function caretAtTableRowEnd(editor: vscode.TextEditor | undefined): boolean {
  if (!caretInTableRow(editor) || !editor.selection.isEmpty) {
    return false;
  }
  const text = editor.document.lineAt(editor.selection.active.line).text;
  return editor.selection.active.character >= text.trimEnd().length;
}

export function registerTableRowContext(context: vscode.ExtensionContext): void {
  let inRow = false;
  let atEnd = false;
  const update = (editor: vscode.TextEditor | undefined): void => {
    const nextInRow = caretInTableRow(editor);
    const nextAtEnd = nextInRow && caretAtTableRowEnd(editor);
    if (nextInRow !== inRow) {
      inRow = nextInRow;
      void vscode.commands.executeCommand('setContext', IN_ROW_KEY, nextInRow);
    }
    if (nextAtEnd !== atEnd) {
      atEnd = nextAtEnd;
      void vscode.commands.executeCommand('setContext', AT_ROW_END_KEY, nextAtEnd);
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
