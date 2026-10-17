import * as vscode from 'vscode';
import * as fs from 'fs';

// Define a type for the hover information
interface HoverInfo {
  [key: string]: string;
}

// Dynamic Import for custom hover settings
const jsonPath: string =
  vscode.workspace
    .getConfiguration()
    .get<string>('abaqusSyntaxHighlighting.customHover.pathJSON') ?? '';

// Catch invalid path to .json
function readJSON(jsonPath: string): HoverInfo {
  let data: HoverInfo;
  try {
    data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  } catch {
    // Handle error without using the error object
    data = {
      default: 'test1',
      'this is a default': 'test2',
      'this is a default-test': 'test3',
      'this is a default-test case': 'test4',
    };
  }
  return data;
}

const hoverInfo = readJSON(jsonPath);

export class HoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Hover {
    // Get word range
    const wordRange = document.getWordRangeAtPosition(
      position,
      /[\w*]+(?:[\s-]+[\w]+)*(?=\s|,|$)+/gm,
    );
    if (!wordRange) {
      return { contents: [] };
    }

    // Get the word and turn it to lowercase in order to match the hoverInfo.json
    const word = document.getText(wordRange).toLowerCase();

    // The markdownstring returned from the hover
    const content = new vscode.MarkdownString(
      hoverInfo[word] || 'No information available',
    );

    // Remove console.log statement
    // console.log(hoverInfo[word]);

    return {
      contents: [content],
    };
  }
}
