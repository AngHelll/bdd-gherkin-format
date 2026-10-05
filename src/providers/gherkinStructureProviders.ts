/**
 * Outline, folding, selection, and placeholder highlights.
 * Structural only — no binding index.
 */

import * as vscode from 'vscode';
import { placeholderHighlights, selectionRangesAt, type GherkinBlock } from '../core/structure';
import { formattingDocumentSelector } from './gherkinFormattingProvider';
import { parsed, registerParseCache } from './parseCache';

function symbolKind(kind: GherkinBlock['kind']): vscode.SymbolKind {
  switch (kind) {
    case 'feature':
      return vscode.SymbolKind.Module;
    case 'rule':
      return vscode.SymbolKind.Namespace;
    case 'background':
      return vscode.SymbolKind.Field;
    case 'examples':
      return vscode.SymbolKind.Array;
    default:
      return vscode.SymbolKind.Function;
  }
}

function toSymbol(document: vscode.TextDocument, block: GherkinBlock): vscode.DocumentSymbol {
  const endLine = Math.min(block.endLine, Math.max(0, document.lineCount - 1));
  const keywordLine = Math.min(block.keywordLine, endLine);
  const end = new vscode.Position(endLine, document.lineAt(endLine).text.length);
  const symbol = new vscode.DocumentSymbol(
    block.title || block.keyword,
    block.keyword,
    symbolKind(block.kind),
    new vscode.Range(new vscode.Position(block.startLine, 0), end),
    new vscode.Range(keywordLine, 0, keywordLine, document.lineAt(keywordLine).text.length)
  );
  symbol.children = block.children.map((child) => toSymbol(document, child));
  return symbol;
}

function foldingRanges(blocks: GherkinBlock[], into: vscode.FoldingRange[]): void {
  for (const block of blocks) {
    if (block.endLine > block.startLine) {
      into.push(
        new vscode.FoldingRange(block.startLine, block.endLine, vscode.FoldingRangeKind.Region)
      );
    }
    foldingRanges(block.children, into);
  }
}

export function registerStructureProviders(context: vscode.ExtensionContext): void {
  registerParseCache(context);
  context.subscriptions.push(
    vscode.languages.registerDocumentSymbolProvider(formattingDocumentSelector, {
      provideDocumentSymbols(document) {
        return parsed(document).blocks.map((block) => toSymbol(document, block));
      },
    }),
    vscode.languages.registerFoldingRangeProvider(formattingDocumentSelector, {
      provideFoldingRanges(document) {
        const ranges: vscode.FoldingRange[] = [];
        foldingRanges(parsed(document).blocks, ranges);
        return ranges;
      },
    }),
    vscode.languages.registerSelectionRangeProvider(formattingDocumentSelector, {
      provideSelectionRanges(document, positions) {
        const doc = parsed(document);
        return positions.map((position) => {
          const spans = selectionRangesAt(doc, position.line, position.character);
          let current: vscode.SelectionRange | undefined;
          for (const span of [...spans].reverse()) {
            current = new vscode.SelectionRange(
              new vscode.Range(span.startLine, span.startChar, span.endLine, span.endChar),
              current
            );
          }
          if (!current) {
            const line = document.lineAt(position.line);
            current = new vscode.SelectionRange(line.range);
          }
          return current;
        });
      },
    }),
    vscode.languages.registerDocumentHighlightProvider(formattingDocumentSelector, {
      provideDocumentHighlights(document, position) {
        return placeholderHighlights(parsed(document), position.line, position.character).map(
          (span) =>
            new vscode.DocumentHighlight(
              new vscode.Range(span.line, span.start, span.line, span.end),
              vscode.DocumentHighlightKind.Text
            )
        );
      },
    })
  );
}
