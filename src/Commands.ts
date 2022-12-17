import * as vscode from 'vscode';

export function indentLines() {
	// Get the current text editor
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return; // No open text editor
	}
	const document = editor.document;
	const lineCount = document.lineCount;
	editor.edit(editBuilder => {
		for (let i = 0; i < lineCount; i++) {
			const line = document.lineAt(i);
			const lineText = line.text;
			if (!lineText.startsWith('*') && !lineText.startsWith(' ')) {
				editBuilder.insert(line.range.start, '  ');
			}
		}
	});
}
