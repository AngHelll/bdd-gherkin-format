import * as vscode from 'vscode';
import { parseDocument, type ParsedDocument } from '../core/structure';

const cache = new Map<string, { version: number; parsed: ParsedDocument }>();

/** One parse per document version, shared by every provider and command. */
export function parsed(document: vscode.TextDocument): ParsedDocument {
  const key = document.uri.toString();
  const hit = cache.get(key);
  if (hit && hit.version === document.version) {
    return hit.parsed;
  }
  const fresh = parseDocument(document.getText());
  cache.set(key, { version: document.version, parsed: fresh });
  return fresh;
}

export function registerParseCache(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => cache.delete(document.uri.toString())),
    { dispose: () => cache.clear() }
  );
}
