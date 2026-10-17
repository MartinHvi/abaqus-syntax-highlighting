// Curated keyword table and line classification for code folding.
// Pure module: no vscode import here (fully editor-independent).
//
// Line classification cascade (spec, hardened — first non-whitespace, not cols 1-2):
//   first non-whitespace characters are ** -> comment
//   else first non-whitespace character is * -> keyword line
//   else -> data line
//
// Keyword-name normalization (owner decision, SYNTAX16 blank-ignoring rule):
// the name is the text after `*` up to the first comma, uppercased with all
// internal blanks stripped, so `*LOAD CASE`, `*SURFACE INTERACTION`,
// `*END PART` and closers carrying parameters are all recognized.
// Abbreviations are deliberately NOT matched (unique-prefix resolution is
// defined against the full Abaqus catalog, which we do not ship); every
// unlisted spelling falls through to ordinary.

export type LineKind = 'comment' | 'keyword' | 'data';

export interface LineInfo {
  kind: LineKind;
  /** Normalized keyword name, or '' for data/comment lines. */
  keywordName: string;
}

export type KeywordClass = 'wrapper' | 'container' | 'ordinary';

// The five wrapper families, each paired with its exact `*END …` closer
// (normalization already strips blanks/case, so `*End Load Case` matches too).
const wrapperOpeners: ReadonlySet<string> = new Set([
  'PART',
  'ASSEMBLY',
  'INSTANCE',
  'STEP',
  'LOADCASE',
]);

// Container -> recognized children, exactly as distilled from
// docs/research/abaqus-inp-syntax-deepdive.md §3.2/§3.4 (+§4 tables).
// The flagged recommendations are decisions of record: *PLASTIC in,
// the GAP family in, *OUTPUT a container. Anything unlisted is ordinary.
const containerChildren: Readonly<Record<string, readonly string[]>> = {
  MATERIAL: [
    'ELASTIC',
    'DENSITY',
    'EXPANSION',
    'CONDUCTIVITY',
    'SPECIFICHEAT',
    'PLASTIC',
  ],
  SURFACEINTERACTION: [
    'FRICTION',
    'GAPCONDUCTANCE',
    'GAP',
    'GAPRADIATION',
    'GAPHEATGENERATION',
  ],
  OUTPUT: ['ELEMENTOUTPUT', 'NODEOUTPUT', 'CONTACTOUTPUT', 'ENERGYOUTPUT'],
  FILEOUTPUT: ['ELFILE', 'NODEFILE'],
};

const wrapperClosers: ReadonlySet<string> = new Set(
  [...wrapperOpeners].map((name) => `END${name}`),
);

/** Classify a single line of the file (may include a trailing CR). */
export function classifyLine(text: string): LineInfo {
  const first = text.length - text.trimStart().length;
  const rest = text.slice(first);
  if (rest.startsWith('**')) {
    return { kind: 'comment', keywordName: '' };
  }
  if (!rest.startsWith('*')) {
    return { kind: 'data', keywordName: '' };
  }
  const after = rest.slice(1);
  const comma = after.indexOf(',');
  const rawName = comma === -1 ? after : after.slice(0, comma);
  return { kind: 'keyword', keywordName: normalizeName(rawName) };
}

export function normalizeName(rawName: string): string {
  return rawName.toUpperCase().replace(/\s+/g, '');
}

/** Is the normalized name one of the five wrapper openers? */
export function isWrapperName(name: string): boolean {
  return wrapperOpeners.has(name);
}

/** Is the normalized name an `*END …` closer of a wrapper family? */
export function isWrapperCloser(name: string): boolean {
  return wrapperClosers.has(name);
}

/** The name that would pair with a closer for the given wrapper opener. */
export function closerNameFor(name: string): string {
  return `END${name}`;
}

/** Which extent class the normalized keyword name belongs to. */
export function keywordClass(name: string): KeywordClass {
  if (wrapperOpeners.has(name)) return 'wrapper';
  if (Object.prototype.hasOwnProperty.call(containerChildren, name)) {
    return 'container';
  }
  return 'ordinary';
}

/** Does `child` nest inside an open `container`? (exact names, normalized) */
export function isChildOf(child: string, container: string): boolean {
  const children = containerChildren[container];
  return children !== undefined && children.indexOf(child) !== -1;
}

export function childrenOf(container: string): readonly string[] {
  return containerChildren[container] ?? [];
}
