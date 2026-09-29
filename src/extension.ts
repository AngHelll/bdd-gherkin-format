import * as vscode from 'vscode';
import {
  GherkinFormattingProvider,
  formattingDocumentSelector,
} from './providers/gherkinFormattingProvider';
import { registerStructureProviders } from './providers/gherkinStructureProviders';
import { insertTableRow, registerTableRowContext } from './providers/insertTableRow';

export function activate(context: vscode.ExtensionContext): void {
  const provider = new GherkinFormattingProvider();

  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider(
      formattingDocumentSelector,
      provider
    ),
    vscode.languages.registerDocumentRangeFormattingEditProvider(
      formattingDocumentSelector,
      provider
    ),
    vscode.commands.registerCommand('bddGherkinFormat.insertTableRow', () => insertTableRow())
  );
  registerStructureProviders(context);
  registerTableRowContext(context);
}

export function deactivate(): void {
  // no-op
}
