// Token-scope test harness: loads syntaxes/abaqus.tmLanguage.json with
// vscode-textmate + vscode-oniguruma — the same engine VS Code embeds — so
// fixtures assert real text -> scope-stack behavior with no editor launch
// and no `vscode` import. The grammar instance is booted once and cached
// across all assertions.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as oniguruma from 'vscode-oniguruma';
import * as vsctm from 'vscode-textmate';

export interface Token {
  startIndex: number;
  endIndex: number;
  scopes: string[];
}

const grammarPath = path.resolve(
  __dirname,
  '..',
  '..',
  'syntaxes',
  'abaqus.tmLanguage.json',
);

// vscode-oniguruma 2.x ships the wasm at release/onig.wasm. The Buffer is an
// ArrayBufferView, which loadWASM accepts directly.
const wasmBinary: ArrayBufferView = fs.readFileSync(
  require.resolve('vscode-oniguruma/release/onig.wasm'),
);

const onigLib: Promise<vsctm.IOnigLib> = oniguruma
  .loadWASM(wasmBinary)
  .then(() => ({
    createOnigScanner: (patterns: string[]) =>
      new oniguruma.OnigScanner(patterns),
    createOnigString: (source: string) => new oniguruma.OnigString(source),
  }));

const registry = new vsctm.Registry({
  onigLib,
  loadGrammar: (scopeName) => {
    if (scopeName !== 'source.abaqus') {
      return Promise.resolve(null);
    }
    const content = fs.readFileSync(grammarPath, 'utf8');
    return Promise.resolve(vsctm.parseRawGrammar(content, grammarPath));
  },
});

let grammarPromise: Promise<vsctm.IGrammar> | undefined;

function getGrammar(): Promise<vsctm.IGrammar> {
  if (!grammarPromise) {
    grammarPromise = registry.loadGrammar('source.abaqus').then((grammar) => {
      if (!grammar) {
        throw new Error(
          `grammar 'source.abaqus' failed to load from ${grammarPath}`,
        );
      }
      return grammar;
    });
  }
  return grammarPromise;
}

/**
 * Tokenizes the lines in order, threading the rule stack so multi-line
 * state (begin/end continuity) works exactly as in the editor. Line
 * terminators are excluded, matching how VS Code feeds lines to the
 * tokenizer, so `^` anchors apply per line.
 */
export async function tokenizeLines(lines: string[]): Promise<Token[][]> {
  const grammar = await getGrammar();
  let ruleStack = vsctm.INITIAL;
  const result: Token[][] = [];
  for (const line of lines) {
    const tokenized = grammar.tokenizeLine(line, ruleStack);
    ruleStack = tokenized.ruleStack;
    result.push(
      tokenized.tokens.map((token) => ({
        startIndex: token.startIndex,
        endIndex: token.endIndex,
        scopes: token.scopes.slice(),
      })),
    );
  }
  return result;
}

/** Tokenizes a single line (see tokenizeLines for the exact behavior). */
export async function tokenizeLine(line: string): Promise<Token[]> {
  return (await tokenizeLines([line]))[0];
}
