/*---------------------------------------------------------
 * TODO: 1. Add default hoverinformation path and settings
 * TODO: 2. Add user settings 
 * TODO: 3. Try.. and Catch empty string path or invalid
 * TODO: 4. Refactor and clean up code
 *--------------------------------------------------------*/
/*---------------------------------------------------------
 * Importing vscode and dynamically loading JSON with 
 * user defined hover information.
 *--------------------------------------------------------*/
// Imports
import * as vscode from 'vscode';
const jsonPath: string = vscode.workspace.getConfiguration().get<string>('abaqus.setting')!;
// Dynamic Import for custom hover settings
const fs = require('fs');
//const hoverInfo = JSON.parse(fs.readFileSync(jsonPath));

// Function: read json data and catch errors
function readJSON(jsonPath) {
	try {
		hoverInfo = JSON.parse(fs.readFileSync(jsonPath));
	} catch (err) {
		const hoverInfo = {
			heading: 'default hover'
		};
		return hoverInfo;
	}
	return JSON.parse(fs.readFileSync(jsonPath));
}
const hoverInfo = readJSON(jsonPath);
console.log(hoverInfo);


// HOVER VSCODE
export function activate(context: vscode.ExtensionContext) {
	// hoverProvider
	const hover = vscode.languages.registerHoverProvider('*', {
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
	});
	context.subscriptions.push(hover);
}