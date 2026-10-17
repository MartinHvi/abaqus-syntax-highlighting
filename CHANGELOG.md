# Change Log

## [2.3.0] (2026-10-17)

Rewrote the syntax grammar around a proper token inventory: keyword lines, bare flags, name=value parameters, numbers with E/D exponents, quoted labels, parametric placeholders, the *HEADING title block and the *PARAMETER Python block are now each tokenized by their own rule, giving more accurate and consistent highlighting.

Added native code folding for Abaqus keyword blocks. Folding is derived from the file's keyword structure — *STEP, *PART, *ASSEMBLY, *INSTANCE and *LOAD CASE fold to their matching *END line, container keywords like *MATERIAL fold over their contents, and every other keyword folds over its data lines — so no command or setting is needed.

## [2.2.1] (2024-09-07)

Fix regex for hover provider.

## [2.2.0] (2024-09-07)

Added support for .pes file extension.

## [2.1.2] (2024-09-07)

## [2.1.0] (2022-12-19)

Added commands accessible by the command palette using the short cut CTRL + SHIFT + P.

## [2.0.1] (2022-11-26)

Added logo.

## [2.0.0] (2022-11-26)

Added support for custom hover information.

## [1.1.0] (2022-11-06)

Initial release to VSCode marketplace.
