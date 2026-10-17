import * as vscode from 'vscode';

import { computeFoldingRanges, FoldRange, LineSource } from './FoldingRanges';

// Memoization cache: one scan per document version, not per fold click.
// WeakMap so a closed document (and its ranges) is garbage-collected; the
// stored version number invalidates entries when the document changes.
const cache = new WeakMap<
  vscode.TextDocument,
  { version: number; ranges: vscode.FoldingRange[] }
>();

export class FoldingProvider implements vscode.FoldingRangeProvider {
  provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
    const cached = cache.get(document);
    if (cached !== undefined && cached.version === document.version) {
      return cached.ranges;
    }

    // Streaming accessor built from lineCount/lineAt — never document.getText(),
    // which throws above ~256M characters. lineAt(i).text has no line terminator,
    // so CRLF files are handled by construction (trailing `\r` never appears).
    const lines: LineSource = {
      lineCount: document.lineCount,
      line: (i: number) => document.lineAt(i).text,
    };

    // computeFoldingRanges yields 0-based inclusive {start, end} pairs;
    // vscode.FoldingRange(start, end) takes exactly those (VS Code keeps the
    // start line visible when collapsed), so the mapping is 1:1.
    const toFoldingRange = (range: FoldRange): vscode.FoldingRange =>
      new vscode.FoldingRange(range.start, range.end);

    const ranges = computeFoldingRanges(lines).map(toFoldingRange);
    cache.set(document, { version: document.version, ranges });
    return ranges;
  }
}
