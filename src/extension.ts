import * as vscode from 'vscode';
import {
  GherkinFormattingProvider,
  formattingDocumentSelector,
} from './providers/gherkinFormattingProvider';

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
    )
  );
}

export function deactivate(): void {
  // no-op
}
