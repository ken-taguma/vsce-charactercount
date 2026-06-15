"use strict";
import { window, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, TextEditor, Range, workspace } from 'vscode';
export function activate(context: ExtensionContext) {
    let characterCounter = new CharacterCounter();
    let controller = new CharacterCounterController(characterCounter);
    context.subscriptions.push(controller);
    context.subscriptions.push(characterCounter);
}

export class CharacterCounter {
    private _statusBarItem!: StatusBarItem;
    public updateCharacterCount() {
        if (!this._statusBarItem) {
            this._statusBarItem = window.createStatusBarItem(StatusBarAlignment.Left);
        } 
        let editor = window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }
        let doc = editor.document;
		let msg = "";
        // all text of current editor.
        let characterCount = this._getCharacterCount(doc);
        // selected text of current editor.
        let selectedCharacterCount = this._getSelectedCharacterCount(editor);
        msg = `$(pencil) File: ${characterCount}  Selected: ${selectedCharacterCount}`;
		// total of opened editors
		let total_count = 0;
		let docs = workspace.textDocuments;
        console.log("--documents--");
		for (const doc of docs){
            if (doc.fileName.endsWith(".git") || doc.fileName.startsWith("git")){
                continue;
            }
			console.log(doc.fileName);
			total_count += this._getCharacterCount(doc);
		}
        console.log("--------");
		if (total_count > 0){
			msg += ` Total: ${total_count}`;
		}
		if (msg !== ""){
			this._statusBarItem.text = msg;
			this._statusBarItem.show();
		} else {
			this._statusBarItem.hide();
		}
    }

    public _filterUncountedCharacters(docContent: string): string{
        // remove characters that don't need to be counted
        return docContent.replace(/(\r|\n|《(.+?)》|[\|\｜])/g, '');
    }

    public _getCharacterCount(doc: TextDocument): number {
        // count all characters of current editor.
        let docContent = doc.getText();
        docContent = this._filterUncountedCharacters(docContent);
        let characterCount = 0;
        if (docContent !== "") {
            characterCount = docContent.length;
        }
        return characterCount;
    }

    public _getSelectedCharacterCount(editor: TextEditor): number {
        // count selected characters of current editor.
        let doc = editor.document;
        let characterCount = 0;
        for (let i = 0; i < editor.selections.length; i++){
            let selectedRange = new Range(editor.selections[i].start, editor.selections[i].end);
            let docContent = doc.getText(selectedRange);
            docContent = this._filterUncountedCharacters(docContent);
            characterCount += docContent.length;
        } 
        return characterCount;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class CharacterCounterController {

    private _characterCounter: CharacterCounter;
    private _disposable: Disposable;

    constructor(characterCounter: CharacterCounter) {
        this._characterCounter = characterCounter;
        this._characterCounter.updateCharacterCount();

        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._characterCounter.updateCharacterCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}
