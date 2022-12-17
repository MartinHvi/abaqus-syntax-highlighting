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


export function removeLeadingSpaces() {
	// Get the current text editor
	let editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	// Get the range of the entire document
	let documentRange = new vscode.Range(0, 0, editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length);
	// Get the text of the document
	let documentText = editor.document.getText(documentRange);
	// Split the document into lines
	let lines = documentText.split('\n');
	// Initialize an array for the modified lines
	let modifiedLines = [];
	// Iterate over the lines
	for (let i = 0; i < lines.length; i++) {
		if (lines[i][0] !== '*') {
			// If the line does not start with an asterisk, remove all leading spaces
			modifiedLines.push(lines[i].replace(/^\s+/, ''));
		} else {
			// If the line starts with an asterisk, leave it unchanged
			modifiedLines.push(lines[i]);
		}
	}
	// Join the modified lines into a single string
	let modifiedText = modifiedLines.join('\n');
	// Replace the document text with the modified text
	editor.edit(editBuilder => {
		editBuilder.replace(documentRange, modifiedText);
	});
}

export function format() {
	// Get the current text editor
	let editor = vscode.window.activeTextEditor;

	if (!editor) {
		return;
	}
	// Get the range of the entire document
	let documentRange = new vscode.Range(0, 0, editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length);
	// Get the text of the document
	let documentText = editor.document.getText(documentRange);
	// Split the document into lines
	let lines = documentText.split('\n');
	// Initialize an array for the modified lines
	let modifiedLines = [];
	// Iterate over the lines
	for (let i = 0; i < lines.length; i++) {
		// Remove spaces after commas and add a single space after all commas
		modifiedLines.push(lines[i].replace(/,\s+/g, ',').replace(/,/g, ', '));
	}
	// Join the modified lines into a single string
	let modifiedText = modifiedLines.join('\n');
	// Replace the document text with the modified text
	editor.edit(editBuilder => {
		editBuilder.replace(documentRange, modifiedText);
	});
}

export function compact() {
	// Get the current text editor
	let editor = vscode.window.activeTextEditor;

	if (!editor) {
		return;
	}
	// Get the range of the entire document
	let documentRange = new vscode.Range(0, 0, editor.document.lineCount - 1, editor.document.lineAt(editor.document.lineCount - 1).text.length);
	// Get the text of the document
	let documentText = editor.document.getText(documentRange);
	// Split the document into lines
	let lines = documentText.split('\n');
	// Initialize an array for the modified lines
	let modifiedLines = [];
	// Iterate over the lines
	for (let i = 0; i < lines.length; i++) {
		// Remove spaces after commas and add a single space after all commas
		modifiedLines.push(lines[i].replace(/,\s+/g, ',').replace(/^\s+/, ''));
	}
	// Join the modified lines into a single string
	let modifiedText = modifiedLines.join('\n');
	// Replace the document text with the modified text
	editor.edit(editBuilder => {
		editBuilder.replace(documentRange, modifiedText);
	});
}
export function removeAllComments() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}

	const document = editor.document;
	const selection = editor.selection;

	// Get the range of lines that should be removed
	const startLine = 0;
	const endLine = document.lineCount - 1;
	const lineRange = new vscode.Range(startLine, 0, endLine, 0);

	// Get the text of the lines that should be removed
	const text = document.getText(lineRange);

	// Split the text into lines and filter out the lines starting with **
	const lines = text.split('\n').filter((line) => !line.startsWith('**'));

	// Replace the original text with the filtered text
	editor.edit((editBuilder) => {
		editBuilder.replace(lineRange, lines.join('\n'));
	});
}

export function removeEmptyComments() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	let document = editor.document;
	let selection = editor.selection;

	let start = new vscode.Position(0, 0);
	let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
	let range = new vscode.Range(start, end);

	let text = document.getText(range);
	let lines = text.split('\n');

	let newLines = lines.filter(line => {
		return !(line.trim() === '**' || line.trim() === '');
	});

	let newText = newLines.join('\n');
	editor.edit(editBuilder => {
		editBuilder.replace(range, newText);
	});
}

export function removeBlankLines() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	let document = editor.document;
	let selection = editor.selection;

	let start = new vscode.Position(0, 0);
	let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
	let range = new vscode.Range(start, end);

	let text = document.getText(range);
	let lines = text.split('\n');

	let newLines = lines.filter(line => {
		return !(line.trim() === '');
	});

	let newText = newLines.join('\n');
	editor.edit(editBuilder => {
		editBuilder.replace(range, newText);
	});
}
