// Imports
import * as vscode from 'vscode';
import { HoverProvider } from './HoverProvider';
import { indentLines, removeLeadingSpaces, format, compact, removeAllComments, removeEmptyComments, removeBlankLines } from './Commands';

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
	const disposableRemoveEmptyComments = vscode.commands.registerCommand('extension.removeEmptyComments', removeEmptyComments);
	const disposableRemoveBlankLines = vscode.commands.registerCommand('extension.removeBlankLines', removeBlankLines);
	// Dispose
	context.subscriptions.push(disposableHoverProvider, disposableIndentLines, disposableRemoveLeadingSpaces, disposableFormat, disposableCompact, disposableRemoveAllComments, disposableRemoveEmptyComments, disposableRemoveBlankLines);
}
export function deactivate() { }