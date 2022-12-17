/*---------------------------------------------------------
 * TODO: 4. Refactor and clean up code
 *--------------------------------------------------------*/
// Imports
import * as vscode from 'vscode';
import { HoverProvider } from './HoverProvider';
import { indentLines, removeLeadingSpaces, format, compact } from './Commands';
// HOVER VSCODE
export function activate(context: vscode.ExtensionContext) {
	// hoverProvider
	const disposableHoverProvider = new HoverProvider();
	vscode.languages.registerHoverProvider('abaqus', disposableHoverProvider);
	// Commands indent lines
	const disposableIndentLines = vscode.commands.registerCommand('extension.indentLines', indentLines);
	const disposableRemoveLeadingSpaces = vscode.commands.registerCommand('extension.removeLeadingSpaces', removeLeadingSpaces);
	const disposableFormat = vscode.commands.registerCommand('extension.format', format);
	const disposableCompact = vscode.commands.registerCommand('extension.compact', compact);

	/* const disposableRemoveLeadingSpaces = vscode.commands.registerCommand('extension.removeLeadingSpaces', () => {
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
	}); */

	/* 	const disposableFormat = vscode.commands.registerCommand('extension.format', () => {
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
		}); */

	/* const disposableCompact = vscode.commands.registerCommand('extension.compact', () => {
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
	}); */

	// Dispose
	context.subscriptions.push(disposableHoverProvider, disposableIndentLines, disposableRemoveLeadingSpaces, disposableFormat, disposableCompact);
}
export function deactivate() { }