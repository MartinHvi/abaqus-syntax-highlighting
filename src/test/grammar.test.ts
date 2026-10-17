// Fixture tests for syntaxes/abaqus.tmLanguage.json.
//
// Each fixture feeds Abaqus source lines to the grammar (the same engine
// VS Code embeds) and asserts text -> scope-stack behavior — the output the
// Scope Inspector shows. No internals of the harness itself are asserted.
//
// Assertions apply to one line of the fixture (the last line by default);
// earlier lines are context that multi-line rules (the *HEADING block, the
// *PARAMETER block) need. `expect` entries assert a token with the exact
// text carries the scope innermost; `reject` entries assert no token on the
// line carries the scope anywhere in its stack (misfire negatives).

import assert from 'node:assert';
import { Token, tokenizeLines } from './GrammarHarness';

interface TokenExpectation {
  /** 0-based index into `lines`; defaults to the last line. */
  line?: number;
  /** Exact text of the token expected to carry `scope`. */
  text: string;
  /** Innermost (most specific) scope that token must carry. */
  scope: string;
}

interface TokenRejection {
  /** 0-based index into `lines`; defaults to the last line. */
  line?: number;
  /** Scope that must not appear on any token of that line. */
  scope: string;
}

interface Fixture {
  /** Human-readable name, shown in the runner output. */
  name: string;
  /** Abaqus source lines, terminator-free (as tokenizeLines expects). */
  lines: string[];
  /** Tokens that must be present (all of them). */
  expect?: TokenExpectation[];
  /** Scopes that must be absent (misfire negatives). */
  reject?: TokenRejection[];
}

const fixtures: Fixture[] = [
  // --- comment lines (** in columns 1-2) ---
  {
    name: 'comment line is one comment token',
    lines: ['** comment'],
    expect: [{ text: '** comment', scope: 'comment.line.abaqus' }],
  },
  {
    name: 'bare ** is a comment',
    lines: ['**'],
    expect: [{ text: '**', scope: 'comment.line.abaqus' }],
  },
  {
    name: 'banner comment keeps * inside the comment',
    lines: ['** *RAW'],
    expect: [{ text: '** *RAW', scope: 'comment.line.abaqus' }],
    reject: [
      { scope: 'punctuation.definition.keyword.abaqus' },
      { scope: 'keyword.control.abaqus' },
    ],
  },
  {
    name: 'HEADING inside a comment stays a comment',
    lines: ['** *HEADING Job title'],
    expect: [{ text: '** *HEADING Job title', scope: 'comment.line.abaqus' }],
    reject: [
      { scope: 'keyword.control.abaqus' },
      { scope: 'string.unquoted.abaqus' },
    ],
  },
  {
    name: 'indented ** is not a comment (folding ADR classification)',
    lines: ['  ** not a comment line'],
    reject: [{ scope: 'comment.line.abaqus' }],
  },

  // --- keyword lines ---
  {
    name: 'keyword line splits the * and the keyword name',
    lines: ['*BOUNDARY'],
    expect: [
      { text: '*', scope: 'punctuation.definition.keyword.abaqus' },
      { text: 'BOUNDARY', scope: 'keyword.control.abaqus' },
    ],
  },
  {
    name: 'unique-prefix keywords are accepted without validation',
    lines: ['*BO'],
    expect: [
      { text: '*', scope: 'punctuation.definition.keyword.abaqus' },
      { text: 'BO', scope: 'keyword.control.abaqus' },
    ],
  },
  {
    name: 'multi-word keywords with internal blanks stay one keyword token',
    lines: ['*SURFACE INTERACTION'],
    expect: [{ text: 'SURFACE INTERACTION', scope: 'keyword.control.abaqus' }],
  },
  {
    name: 'lowercase keywords are keywords too (CAE decks)',
    lines: ['*static'],
    expect: [{ text: 'static', scope: 'keyword.control.abaqus' }],
  },
  {
    name: 'a lone * is the legal empty keyword line (deepdive 6.3)',
    lines: ['*'],
    expect: [{ text: '*', scope: 'punctuation.definition.keyword.abaqus' }],
  },
  {
    name: 'keyword may follow leading blanks (first non-blank char is *)',
    lines: ['  *STEP'],
    expect: [{ text: 'STEP', scope: 'keyword.control.abaqus' }],
  },

  // --- parameter names, flags, and values on the keyword line ---
  {
    name: 'bare flag after a comma is a parameter (deepdive 1.3)',
    lines: ['*STEP, NLGEOM'],
    expect: [
      { text: ',', scope: 'punctuation.separator.abaqus' },
      { text: 'NLGEOM', scope: 'variable.parameter.abaqus' },
    ],
  },
  {
    name: 'multi-word bare flags keep their blank',
    lines: ['*SURFACE, MAX RATIO, NO THICK'],
    expect: [
      { text: 'MAX RATIO', scope: 'variable.parameter.abaqus' },
      { text: 'NO THICK', scope: 'variable.parameter.abaqus' },
    ],
  },
  {
    name: 'name=value parameters split name, operator, and value',
    lines: ['*STEP, INC=100, nlgeom=NO'],
    expect: [
      { text: 'INC', scope: 'variable.parameter.abaqus' },
      { text: '100', scope: 'constant.numeric.abaqus' },
      { text: 'nlgeom', scope: 'variable.parameter.abaqus' },
      { text: '=', scope: 'keyword.operator.assignment.abaqus' },
      { text: 'NO', scope: 'string.unquoted.abaqus' },
    ],
  },
  {
    name: 'blanks around = are ignored on keyword lines',
    lines: ['*ELASTIC, TYPE = ISOTROPIC'],
    expect: [
      { text: 'TYPE', scope: 'variable.parameter.abaqus' },
      { text: 'ISOTROPIC', scope: 'string.unquoted.abaqus' },
    ],
  },
  {
    name: 'quoted label parameter value preserves blanks and case',
    lines: ['*Elset, elset="One element", NSET=NODESET'],
    // The quotes are their own punctuation tokens; the *content* token is
    // what carries the string scope innermost.
    expect: [{ text: 'One element', scope: 'string.quoted.double.abaqus' }],
    reject: [{ line: 0, scope: 'invalid.illegal.abaqus' }],
  },
  {
    name: 'file-name values keep their dots (INPUT= part2.inp)',
    lines: ['*INCLUDE, INPUT=part2.inp'],
    expect: [
      { text: 'INPUT', scope: 'variable.parameter.abaqus' },
      { text: 'part2.inp', scope: 'string.unquoted.abaqus' },
    ],
    reject: [{ scope: 'invalid.illegal.abaqus' }],
  },

  // --- data lines ---
  {
    name: 'label with digits and hyphens stays one token (Set-1, Part-5-1)',
    lines: ['Part-5-1'],
    expect: [{ text: 'Part-5-1', scope: 'string.unquoted.abaqus' }],
    reject: [{ scope: 'constant.numeric.abaqus' }],
  },
  {
    name: 'labels and numbers mix on a data line',
    lines: ['Set-1, 101, 102'],
    expect: [
      { text: 'Set-1', scope: 'string.unquoted.abaqus' },
      { text: '101', scope: 'constant.numeric.abaqus' },
      { text: '102', scope: 'constant.numeric.abaqus' },
    ],
    reject: [{ scope: 'variable.parameter.abaqus' }],
  },
  {
    name: 'all four number spellings (deepdive 2.3: sign, .5, E, D)',
    lines: ['-12.345, -1234.5D-2, .5, 2.'],
    expect: [
      { text: '-12.345', scope: 'constant.numeric.abaqus' },
      { text: '-1234.5D-2', scope: 'constant.numeric.abaqus' },
      { text: '.5', scope: 'constant.numeric.abaqus' },
      { text: '2.', scope: 'constant.numeric.abaqus' },
    ],
  },
  {
    name: 'word selectors on data lines are ordinary field tokens',
    lines: ['START, 0., 0.'],
    expect: [{ text: 'START', scope: 'string.unquoted.abaqus' }],
    reject: [
      { scope: 'variable.parameter.abaqus' },
      { scope: 'invalid.illegal.abaqus' },
    ],
  },
  {
    name: 'element face labels are fields, never keywords',
    lines: ['Eall, S1, 25.0'],
    expect: [
      { text: 'Eall', scope: 'string.unquoted.abaqus' },
      { text: 'S1', scope: 'string.unquoted.abaqus' },
      { text: '25.0', scope: 'constant.numeric.abaqus' },
    ],
    reject: [{ scope: 'keyword.control.abaqus' }],
  },
  {
    name: 'unquoted label with a dot is the one hard error',
    lines: ['Part.5'],
    expect: [{ text: 'Part.5', scope: 'invalid.illegal.abaqus' }],
    reject: [{ scope: 'string.unquoted.abaqus' }],
  },
  {
    name: 'output variable keys with digit suffixes are plain labels',
    lines: ['S, E, PE11, SDV1'],
    expect: [
      { text: 'S', scope: 'string.unquoted.abaqus' },
      { text: 'PE11', scope: 'string.unquoted.abaqus' },
      { text: 'SDV1', scope: 'string.unquoted.abaqus' },
    ],
    reject: [{ scope: 'invalid.illegal.abaqus' }],
  },

  // --- parametric placeholders (angle brackets) ---
  {
    name: 'placeholder in a keyword-parameter value and on a data line',
    lines: [
      '*Shell Section, ELSET=<shell_set>',
      '<shell_thick>, <num_int_pts>',
    ],
    expect: [
      {
        line: 0,
        text: 'shell_set',
        scope: 'variable.other.abaqus',
      },
      { line: 1, text: 'shell_thick', scope: 'variable.other.abaqus' },
      { line: 1, text: 'num_int_pts', scope: 'variable.other.abaqus' },
    ],
  },

  // --- *HEADING block ---
  {
    name: '*HEADING titles are free text up to the next keyword line',
    lines: ['*HEADING', 'My model, 2.0 meters wide', '*STEP'],
    expect: [
      {
        line: 1,
        text: 'My model, 2.0 meters wide',
        scope: 'string.unquoted.abaqus',
      },
    ],
    reject: [
      { line: 0, scope: 'variable.parameter.abaqus' },
      { line: 1, scope: 'constant.numeric.abaqus' },
      { line: 2, scope: 'string.unquoted.abaqus' },
    ],
  },
  {
    name: 'comment lines inside the heading stay comments and never end it',
    lines: ['*HEADING', 'Part one', '** a note', 'Part two', '*STEP'],
    expect: [
      { line: 1, text: 'Part one', scope: 'string.unquoted.abaqus' },
      { line: 2, text: '** a note', scope: 'comment.line.abaqus' },
      { line: 3, text: 'Part two', scope: 'string.unquoted.abaqus' },
      { line: 4, text: 'STEP', scope: 'keyword.control.abaqus' },
    ],
  },

  // --- keyword-line continuations ---
  {
    name: 'name=value on a continuation line reads as parameters',
    lines: ['*Elastic, TYPE=ISOTROPIC,', ' DEPENDENCIES=1'],
    expect: [
      { line: 1, text: 'DEPENDENCIES', scope: 'variable.parameter.abaqus' },
      { line: 1, text: '1', scope: 'constant.numeric.abaqus' },
    ],
  },

  // --- *PARAMETER block (the one Python exception) ---
  {
    name: '*PARAMETER data lines are Python assignments',
    lines: [
      '*Parameter',
      'width = 2.5',
      'height = width*2 # twice',
      '** plain comment between records',
      'long = sqrt(width*height)/2 \\',
      '          + 0.5',
      '*Step, nlgeom=NO',
    ],
    expect: [
      {
        line: 1,
        text: 'width',
        scope: 'variable.other.readwrite.python',
      },
      { line: 1, text: '2.5', scope: 'constant.numeric.python' },
      { line: 1, text: '=', scope: 'keyword.operator.assignment.python' },
      {
        line: 2,
        text: 'height',
        scope: 'variable.other.readwrite.python',
      },
      { line: 2, text: 'width', scope: 'variable.other.readwrite.python' },
      {
        line: 2,
        text: '*',
        scope: 'keyword.operator.arithmetic.python',
      },
      {
        line: 2,
        text: '# twice',
        scope: 'comment.line.number-sign.python',
      },
      {
        line: 3,
        text: '** plain comment between records',
        scope: 'comment.line.abaqus',
      },
      {
        line: 4,
        text: 'sqrt',
        scope: 'support.function.builtin.python',
      },
      {
        line: 4,
        text: '\\',
        scope: 'punctuation.separator.continuation.line.python',
      },
      { line: 5, text: '0.5', scope: 'constant.numeric.python' },
    ],
    reject: [
      { line: 1, scope: 'keyword.operator.arithmetic.python' },
      { line: 6, scope: 'constant.numeric.python' },
    ],
  },
  {
    name: '*PARAMETER DEPENDENCE is a normal keyword, not the Python block',
    lines: ['*PARAMETER DEPENDENCE', 'width = 2.5'],
    expect: [
      {
        line: 0,
        text: 'PARAMETER DEPENDENCE',
        scope: 'keyword.control.abaqus',
      },
      { line: 1, text: 'width', scope: 'variable.parameter.abaqus' },
      { line: 1, text: '2.5', scope: 'constant.numeric.abaqus' },
    ],
    reject: [{ line: 1, scope: 'variable.other.readwrite.python' }],
  },

  // --- a miniature realistic deck, asserting the interplay of rules ---
  {
    name: 'sample deck: keyword, params, data, comment, wrapper',
    lines: [
      '** Job bracket.inp',
      '*Heading',
      'Small bracket',
      '**',
      '*Part, name=Bracket-1',
      '*Node',
      '1, 0.0, 0.0, 0.0',
      '*Nset, nset=Mid',
      '1, 2, 3',
      '*End Part',
    ],
    expect: [
      { line: 0, text: '** Job bracket.inp', scope: 'comment.line.abaqus' },
      { line: 1, text: 'Heading', scope: 'keyword.control.abaqus' },
      { line: 3, text: '**', scope: 'comment.line.abaqus' },
      { line: 4, text: 'name', scope: 'variable.parameter.abaqus' },
      { line: 4, text: 'Bracket-1', scope: 'string.unquoted.abaqus' },
      { line: 6, text: '1', scope: 'constant.numeric.abaqus' },
      { line: 7, text: 'nset', scope: 'variable.parameter.abaqus' },
      { line: 7, text: 'Mid', scope: 'string.unquoted.abaqus' },
      { line: 9, text: 'End Part', scope: 'keyword.control.abaqus' },
    ],
    reject: [
      { line: 5, scope: 'variable.parameter.abaqus' },
      { line: 6, scope: 'string.unquoted.abaqus' },
    ],
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

function runAssertions(fixture: Fixture, tokenized: Token[][]): void {
  const lastLine = fixture.lines.length - 1;
  for (const expected of fixture.expect ?? []) {
    const lineIndex = expected.line ?? lastLine;
    const line = fixture.lines[lineIndex];
    const tokens = tokenized[lineIndex];
    const match = tokens.find(
      (token) =>
        line.slice(token.startIndex, token.endIndex) === expected.text &&
        innermostScope(token) === expected.scope,
    );
    assert.ok(
      match,
      `line ${lineIndex} (${JSON.stringify(line)}): expected a token ` +
        `'${expected.text}' with scope '${expected.scope}', got:\n` +
        dumpTokens(line, tokens),
    );
  }
  for (const rejected of fixture.reject ?? []) {
    const lineIndex = rejected.line ?? lastLine;
    const line = fixture.lines[lineIndex];
    const tokens = tokenized[lineIndex];
    const misfire = tokens.find((token) =>
      token.scopes.includes(rejected.scope),
    );
    assert.ok(
      !misfire,
      `line ${lineIndex} (${JSON.stringify(line)}): expected no token with ` +
        `scope '${rejected.scope}', got:\n` +
        dumpTokens(line, tokens),
    );
  }
}

async function main(): Promise<void> {
  let failures = 0;
  for (const fixture of fixtures) {
    try {
      runAssertions(fixture, await tokenizeLines(fixture.lines));
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
