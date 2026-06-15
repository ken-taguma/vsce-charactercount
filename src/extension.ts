"use strict";
import { window, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, TextEditor, Range } from 'vscode';
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

        // count when doc type is markdown, plaintext or latex.
        if (doc.languageId === "markdown" || doc.languageId === "plaintext" || doc.languageId === "latex") {
            let characterCount = this._getCharacterCount(doc);
            // count selected characters.
            let selectedCharacterCount = this._getSelectedCharacterCount(editor);
            this._statusBarItem.text = `$(pencil) ${characterCount} , ${selectedCharacterCount} Selected:`;
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    public _filterUncountedCharacters(docContent: string): string{
        // remove the characters not to count.
        docContent = docContent
            .replace(/\s/g, '') // all white spaces.
            .replace(/《(.+?)》/g, '')  // range symbols for Japanese Ruby and the characters within them.
            .replace(/[\|｜]/g, '');    // start symbols for Japanese Ruby.
        return docContent
    }

    public _getCharacterCount(doc: TextDocument): number {
        let docContent = doc.getText();
        docContent = this._filterUncountedCharacters(docContent);
        let characterCount = 0;
        if (docContent !== "") {
            characterCount = docContent.length;
        }
        return characterCount;
    }

    public _getSelectedCharacterCount(editor: TextEditor): number {
        // count selected characters.
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
