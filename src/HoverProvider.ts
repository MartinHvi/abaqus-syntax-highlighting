import * as vscode from 'vscode';
// Dynamic Import for custom hover settings
const jsonPath: string = vscode.workspace.getConfiguration().get<string>('abaqusSyntaxHighlighting.customHover.pathJSON')!;
const fs = require('fs');
// Catch invalid oath to .json
function readJSON(jsonPath) {
	let data;
	try {
		data = JSON.parse(fs.readFileSync(jsonPath));
	} catch (err) {
		const data = {
			default: 'default hover',
		};
		return data;
	}
	return JSON.parse(fs.readFileSync(jsonPath));
}
const hoverInfo = readJSON(jsonPath);
export class HoverProvider implements vscode.HoverProvider {
	provideHover(document, position) {
		// Get word range
		//const wordRange = document.getWordRangeAtPosition(position, /^[*][A-Za-z\s]+/gm);
		const wordRange = document.getWordRangeAtPosition(position, /[A-Za-z0-9\s*-_]+/gm);
		// Get the word and turn it to lowercase in order to match the hoverInfo.json
		const word = document.getText(wordRange).toLowerCase();
		// The markdownstring returned from the hover
		const content = new vscode.MarkdownString(hoverInfo[word]);
		console.log(hoverInfo[word]);
		return {
			contents: [content]
		};
	}
}