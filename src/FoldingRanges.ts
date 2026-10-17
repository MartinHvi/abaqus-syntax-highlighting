// Pure folding-range computation for Abaqus input files.
// Pure module: no vscode import here (fully editor-independent).
//
// Unified block model — every keyword line opens a fold whose extent depends
// on the keyword's class:
//   wrapper   — opener through its matching `*END …` line, inclusive
//   container — through the line before the first following keyword line
//               that is not a recognized child
//   ordinary  — the keyword line plus its contiguous data-line run
//               (blank lines stay inside the run; comments terminate it)
// Malformed-file rules: unmatched `*END X` is ordinary; an opener whose `*END`
// never comes folds to the next wrapper-opener line or EOF; no fold hides
// fewer than 2 lines.

import {
  classifyLine,
  closerNameFor,
  isChildOf,
  isWrapperCloser,
  isWrapperName,
  keywordClass,
  LineInfo,
} from './FoldingKeywords';

/** Plain 0-based inclusive fold span: the folded region is [start, end]. */
export interface FoldRange {
  start: number;
  end: number;
}

/** Minimal line accessor — huge documents are never materialized as arrays. */
export interface LineSource {
  readonly lineCount: number;
  // eslint-disable-next-line no-unused-vars -- index parameter of the accessor signature
  line: (i: number) => string;
}

/** No fold is emitted whose collapsed region hides fewer than 2 lines. */
const MIN_HIDDEN_LINES = 2;

export function computeFoldingRanges(lines: LineSource): FoldRange[] {
  const lineTotal = lines.lineCount;
  if (lineTotal === 0) return [];

  const ranges: FoldRange[] = [];
  const push = (start: number, end: number): void => {
    if (end - start >= MIN_HIDDEN_LINES) ranges.push({ start, end });
  };

  // Pass 1: pair wrapper openers with their `*END …` closers (case-insensitive
  // stack; an `*END X` closes the most recent unclosed opener of the same
  // name). Records opener line -> closer line, plus every wrapper-opener line
  // so that unclosed openers can be bounded later.
  const stack: { name: string; line: number }[] = [];
  const closerByOpener = new Map<number, number>();
  const matchedCloserLines = new Set<number>();
  const openerLines: number[] = [];
  for (let i = 0; i < lineTotal; i++) {
    const info = classifyLine(lines.line(i));
    if (info.kind !== 'keyword') continue;
    const name = info.keywordName;
    if (isWrapperCloser(name)) {
      for (let s = stack.length - 1; s >= 0; s--) {
        if (closerNameFor(stack[s].name) === name) {
          closerByOpener.set(stack[s].line, i);
          matchedCloserLines.add(i);
          stack.splice(s, 1);
          break;
        }
      }
    } else if (isWrapperName(name)) {
      stack.push({ name, line: i });
      openerLines.push(i);
    }
  }

  const nextWrapperOpenerAfter = (line: number): number => {
    for (const opener of openerLines) {
      if (opener > line) return opener;
    }
    return -1;
  };

  // Pass 2: walk the file once, emitting one fold per keyword line.
  for (let i = 0; i < lineTotal; i++) {
    const info = classifyLine(lines.line(i));
    if (info.kind !== 'keyword') continue; // comments and data lines never fold
    const name = info.keywordName;

    const closer = closerByOpener.get(i);
    if (closer !== undefined) {
      // Wrapper opener with a matched closer: fold opener -> closer inclusive.
      push(i, closer);
      continue;
    }

    if (isWrapperName(name)) {
      // Unclosed wrapper: fold to the next wrapper-opener line or EOF,
      // never swallowing the next wrapper's own opener line.
      const bound = nextWrapperOpenerAfter(i);
      push(i, bound === -1 ? lineTotal - 1 : bound - 1);
      continue;
    }

    if (matchedCloserLines.has(i)) {
      // Mutually matched `*END X` — already inside its wrapper fold.
      continue;
    }
    if (isWrapperCloser(name)) {
      // Unmatched `*END X`: treated as an ordinary keyword line below.
    }

    const cls = keywordClass(name);
    if (cls === 'container') {
      // Container: scan forward to the first keyword line that is not a
      // recognized child (wrappers, ordinary, unknown all terminate).
      let j = i + 1;
      while (j < lineTotal) {
        const jInfo: LineInfo = classifyLine(lines.line(j));
        if (jInfo.kind === 'keyword' && !isChildOf(jInfo.keywordName, name)) {
          break;
        }
        j++;
      }
      push(i, j - 1);
      continue;
    }

    // Ordinary keyword: the keyword line plus its contiguous data-line run.
    // Blank lines stay in the run; the next keyword line, comment line or EOF
    // ends it.
    let j = i + 1;
    while (j < lineTotal && classifyLine(lines.line(j)).kind === 'data') j++;
    push(i, j - 1);
    i = j - 1; // for-loop advance lands on the terminating keyword/comment
  }

  ranges.sort((a, b) => a.start - b.start || a.end - b.end);
  return ranges;
}
