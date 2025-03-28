import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'notes-panel',
            new NotesPanelProvider(context)
        )
    );
}

class NotesPanelProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(private readonly context: vscode.ExtensionContext) {}

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri],
        };

        webviewView.webview.html = this.getHtmlContent();

        webviewView.webview.onDidReceiveMessage((message) => {
            if (message.command === 'saveNote') {
                this.context.globalState.update('notesContent', message.text);
            }
        });
    }

    private getHtmlContent(): string {
        const savedNotes = this.context.globalState.get<string>('notesContent', '');

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notes</title>
            <style>
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    height: 100%;
                }
                textarea {
                    width: 100%;
                    height: 100%;
                    padding: 10px;
                    background-color: var(--vscode-editor-background);
                    color: var(--vscode-editor-foreground);
                    border: none;
                    resize: none;
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    box-sizing: border-box;
                }
                textarea:focus {
                    outline: none;
                }
            </style>
        </head>
        <body>
            <textarea id="notes" placeholder="Write your notes here...">${savedNotes}</textarea>
            <script>
                const vscode = acquireVsCodeApi();
                const textarea = document.getElementById('notes');

                function setSize() {
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    textarea.style.width = width + 'px';
                    textarea.style.height = height + 'px';
                }

                // Set initial size and on window resize
                setSize();
                window.addEventListener('resize', setSize);

                textarea.addEventListener('input', (e) => {
                    vscode.postMessage({ command: 'saveNote', text: e.target.value });
                });
            </script>
        </body>
        </html>`;
    }
}