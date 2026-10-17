// Fixture tests for syntaxes/abaqus.tmLanguage.json.
//
// Each fixture feeds one Abaqus source line to the grammar (the same engine
// VS Code embeds) and asserts text -> scope-stack behavior — the output the
// Scope Inspector shows. No internals of the harness itself are asserted.

import assert from 'node:assert';
import { Token, tokenizeLine } from './GrammarHarness';

interface Fixture {
  /** Human-readable name, shown in the runner output. */
  name: string;
  /** Abaqus source line, terminator-free (as tokenizeLine expects). */
  line: string;
  /** Exact text of the token expected to carry `scope`. */
  tokenText: string;
  /** Innermost (most specific) scope that token must carry. */
  scope: string;
}

// Seed fixtures: the current grammar's behavior, kept minimal on purpose —
// the point is proving the pipeline end-to-end. The grammar rework expands
// this set to the new token design.
const fixtures: Fixture[] = [
  {
    name: 'comment line',
    line: '** comment',
    tokenText: '**',
    scope: 'comment.line.abaqus',
  },
  {
    name: 'keyword line',
    line: '*BOUNDARY',
    tokenText: 'BOUNDARY',
    scope: 'keyword.control.abaqus',
  },
  {
    name: 'number on a data line',
    line: '100',
    tokenText: '100',
    scope: 'constant.numeric.abaqus',
  },
];

function innermostScope(token: Token): string {
  return token.scopes[token.scopes.length - 1];
}

function dumpTokens(line: string, tokens: Token[]): string {
  if (tokens.length === 0) {
    return '  (no tokens)';
  }
  return tokens
    .map((token) => {
      const text = JSON.stringify(line.slice(token.startIndex, token.endIndex));
      return `  ${text}: ${token.scopes.join(' ')}`;
    })
    .join('\n');
}

async function runFixture(fixture: Fixture): Promise<void> {
  const tokens = await tokenizeLine(fixture.line);
  const match = tokens.find(
    (token) =>
      fixture.line.slice(token.startIndex, token.endIndex) ===
        fixture.tokenText && innermostScope(token) === fixture.scope,
  );
  assert.ok(
    match,
    `expected a token '${fixture.tokenText}' with scope '${fixture.scope}', got:\n` +
      dumpTokens(fixture.line, tokens),
  );
}

async function main(): Promise<void> {
  let failures = 0;
  for (const fixture of fixtures) {
    try {
      await runFixture(fixture);
      console.log(`ok - ${fixture.name}`);
    } catch (error) {
      failures += 1;
      console.log(`FAIL - ${fixture.name}\n${(error as Error).message}`);
    }
  }
  if (failures > 0) {
    console.log(`\n${failures} of ${fixtures.length} fixture(s) failed`);
    process.exitCode = 1;
  } else {
    console.log(`\nall ${fixtures.length} fixture(s) passed`);
  }
}

main().catch((error: Error) => {
  console.log(`test runner crashed: ${error.message}`);
  process.exitCode = 1;
});
