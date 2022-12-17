// Imports
import * as vscode from 'vscode';
import { HoverProvider } from './HoverProvider';
import { indentLines, removeLeadingSpaces, format, compact, removeAllComments, removeEmptyComments } from './Commands';

export function activate(context: vscode.ExtensionContext) {
	// hoverProvider
	const hoverProvider = new HoverProvider();
	const disposableHoverProvider = vscode.languages.registerHoverProvider('abaqus', hoverProvider);
	// Commands
	const disposableIndentLines = vscode.commands.registerCommand('extension.indentLines', indentLines);
	const disposableRemoveLeadingSpaces = vscode.commands.registerCommand('extension.removeLeadingSpaces', removeLeadingSpaces);
	const disposableFormat = vscode.commands.registerCommand('extension.format', format);
	const disposableCompact = vscode.commands.registerCommand('extension.compact', compact);
	const disposableRemoveAllComments = vscode.commands.registerCommand('extension.removeAllComments', removeAllComments);
	//const disposableRemoveEmptyComments = vscode.commands.registerCommand('extension.removeEmptyComments', removeEmptyComments);

	const disposableRemoveEmptyComments = vscode.commands.registerTextEditorCommand('extension.removeEmptyComments', (textEditor: vscode.TextEditor) => {
		let document = textEditor.document;
		let selection = textEditor.selection;

		let start = new vscode.Position(0, 0);
		let end = new vscode.Position(document.lineCount - 1, document.lineAt(document.lineCount - 1).text.length);
		let range = new vscode.Range(start, end);

		let text = document.getText(range);
		let lines = text.split('\n');

		let newLines = lines.filter(line => {
			return !(line.trim() === '**' || line.trim() === '');
		});

		let newText = newLines.join('\n');
		textEditor.edit(editBuilder => {
			editBuilder.replace(range, newText);
		});
	});

	// Dispose
	context.subscriptions.push(disposableHoverProvider, disposableIndentLines, disposableRemoveLeadingSpaces, disposableFormat, disposableCompact, disposableRemoveAllComments, disposableRemoveEmptyComments);
}
export function deactivate() { }