import * as vscode from 'vscode';
import { Logger } from './logger';

const DEFAULT_URL = 'https://mk.apertacodex.ai/';
const STATE_KEY_LAST_URL = 'mkApertacodex.lastUrl';

/** Possible states for the webview panel */
export type MkViewState = 'loading' | 'loaded' | 'error' | 'idle';

export class MkViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;
    private _currentUrl: string;
    private readonly _context: vscode.ExtensionContext;
    private readonly _logger: Logger;

    /** Event emitter for state changes (used by StatusBarManager) */
    private readonly _onDidChangeState = new vscode.EventEmitter<MkViewState>();
    public readonly onDidChangeState: vscode.Event<MkViewState> = this._onDidChangeState.event;

    constructor(context: vscode.ExtensionContext, logger: Logger) {
        this._context = context;
        this._logger = logger;
        this._currentUrl = this._getInitialUrl();

        // Dispose the event emitter when the extension is deactivated
        context.subscriptions.push(this._onDidChangeState);
    }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            enableForms: true
        };

        webviewView.title = 'MK ApertaCodex AI';
        webviewView.description = 'AI-powered knowledge base';

        this._setContent(this._currentUrl);
        this._onDidChangeState.fire('loading');

        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(
            (message: { command: string; url?: string; text?: string }) => {
                this._handleMessage(message);
            },
            undefined,
            this._context.subscriptions
        );

        // Persist URL when view becomes hidden/visible
        webviewView.onDidChangeVisibility(() => {
            if (webviewView.visible) {
                this._logger.info(`View became visible, current URL: ${this._currentUrl}`);
                this._onDidChangeState.fire('loaded');
            } else {
                this._onDidChangeState.fire('idle');
            }
        });

        this._logger.info(`Webview resolved, loading: ${this._currentUrl}`);
    }

    public refresh(): void {
        if (!this._view) {
            vscode.window.showWarningMessage('MK ApertaCodex AI panel is not open yet.');
            return;
        }
        this._onDidChangeState.fire('loading');
        this._setContent(this._currentUrl);
        this._logger.info(`Refreshed: ${this._currentUrl}`);
    }

    public goHome(): void {
        const baseUrl = this._getBaseUrl();
        this._currentUrl = baseUrl;
        this._saveLastUrl(baseUrl);
        if (this._view) {
            this._onDidChangeState.fire('loading');
            this._setContent(baseUrl);
        }
    }

    public getCurrentUrl(): string {
        return this._currentUrl;
    }

    private _setContent(url: string): void {
        if (!this._view) {
            return;
        }
        this._view.webview.html = this._buildHtml(url);
    }

    private _handleMessage(message: { command: string; url?: string; text?: string }): void {
        switch (message.command) {
            case 'urlChanged':
                if (message.url) {
                    this._currentUrl = message.url;
                    this._saveLastUrl(message.url);
                    this._logger.info(`URL changed to: ${message.url}`);
                }
                break;

            case 'openExternal':
                if (message.url) {
                    vscode.env.openExternal(vscode.Uri.parse(message.url));
                }
                break;

            case 'copyToClipboard':
                if (message.text) {
                    vscode.env.clipboard.writeText(message.text);
                    vscode.window.showInformationMessage('Copied to clipboard!');
                }
                break;

            case 'showError':
                vscode.window.showErrorMessage(
                    `MK ApertaCodex AI: ${message.text ?? 'An error occurred'}`
                );
                this._onDidChangeState.fire('error');
                break;

            case 'loaded':
                this._logger.info('Webview content loaded successfully');
                this._onDidChangeState.fire('loaded');
                break;

            case 'loadError':
                this._logger.warn('Webview failed to load content');
                this._onDidChangeState.fire('error');
                break;

            default:
                this._logger.warn(`Unknown message command: ${message.command}`);
        }
    }

    private _getBaseUrl(): string {
        const config = vscode.workspace.getConfiguration('mkApertacodex');
        return config.get<string>('baseUrl', DEFAULT_URL);
    }

    private _getInitialUrl(): string {
        const config = vscode.workspace.getConfiguration('mkApertacodex');
        const rememberLastPage = config.get<boolean>('rememberLastPage', true);
        if (rememberLastPage) {
            const lastUrl = this._context.globalState.get<string>(STATE_KEY_LAST_URL);
            if (lastUrl && lastUrl.startsWith('https://mk.apertacodex.ai')) {
                return lastUrl;
            }
        }
        return this._getBaseUrl();
    }

    private _saveLastUrl(url: string): void {
        const config = vscode.workspace.getConfiguration('mkApertacodex');
        if (config.get<boolean>('rememberLastPage', true)) {
            this._context.globalState.update(STATE_KEY_LAST_URL, url);
        }
    }

    private _buildHtml(url: string): string {
        // Encode the URL safely for embedding in HTML attributes
        const safeUrl = url.replace(/"/g, '&quot;');

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy"
          content="default-src 'none';
                   frame-src https://mk.apertacodex.ai;
                   script-src 'unsafe-inline';
                   style-src 'unsafe-inline';">
    <title>MK ApertaCodex AI</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        html, body {
            width: 100%;
            height: 100vh;
            overflow: hidden;
            background: var(--vscode-editor-background, #1e1e1e);
            font-family: var(--vscode-font-family, sans-serif);
            color: var(--vscode-foreground, #cccccc);
        }

        #toolbar {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 6px;
            background: var(--vscode-sideBar-background, #252526);
            border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, #333);
            height: 36px;
            flex-shrink: 0;
        }

        #toolbar button {
            background: none;
            border: none;
            color: var(--vscode-icon-foreground, #cccccc);
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 26px;
            height: 26px;
            transition: background 0.15s;
        }

        #toolbar button:hover {
            background: var(--vscode-toolbar-hoverBackground, rgba(255,255,255,0.1));
        }

        #toolbar button:active {
            background: var(--vscode-toolbar-activeBackground, rgba(255,255,255,0.15));
        }

        #toolbar button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        #url-display {
            flex: 1;
            font-size: 11px;
            color: var(--vscode-descriptionForeground, #999);
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding: 0 4px;
            cursor: default;
        }

        #loading-bar {
            height: 2px;
            background: var(--vscode-progressBar-background, #0e70c0);
            width: 0%;
            transition: width 0.3s ease;
            flex-shrink: 0;
        }

        #loading-bar.loading {
            animation: loadingAnim 1.5s ease-in-out infinite;
        }

        @keyframes loadingAnim {
            0%   { width: 0%; margin-left: 0; }
            50%  { width: 60%; margin-left: 20%; }
            100% { width: 0%; margin-left: 100%; }
        }

        #frame-container {
            width: 100%;
            height: calc(100vh - 38px);
            position: relative;
        }

        #mk-frame {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }

        #error-screen {
            display: none;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 12px;
            padding: 24px;
            text-align: center;
        }

        #error-screen .error-icon {
            font-size: 48px;
            opacity: 0.5;
        }

        #error-screen h2 {
            font-size: 16px;
            font-weight: 600;
            color: var(--vscode-foreground, #ccc);
        }

        #error-screen p {
            font-size: 12px;
            color: var(--vscode-descriptionForeground, #999);
            max-width: 280px;
            line-height: 1.5;
        }

        #error-screen button {
            margin-top: 8px;
            padding: 6px 16px;
            background: var(--vscode-button-background, #0e70c0);
            color: var(--vscode-button-foreground, #fff);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }

        #error-screen button:hover {
            background: var(--vscode-button-hoverBackground, #1177bb);
        }

        .icon {
            font-size: 14px;
            line-height: 1;
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <button id="btn-back" title="Back" disabled onclick="historyBack()">&#8592;</button>
        <button id="btn-forward" title="Forward" disabled onclick="historyForward()">&#8594;</button>
        <button id="btn-home" title="Go to Home" onclick="goHome()">&#127968;</button>
        <button id="btn-reload" title="Reload" onclick="reloadFrame()">&#8635;</button>
        <span id="url-display" title="${safeUrl}">${safeUrl}</span>
        <button id="btn-external" title="Open in Browser" onclick="openExternal()">&#128279;</button>
    </div>
    <div id="loading-bar"></div>
    <div id="frame-container">
        <iframe
            id="mk-frame"
            src="${safeUrl}"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
            allow="clipboard-read; clipboard-write"
        ></iframe>
        <div id="error-screen">
            <div class="error-icon">&#9888;&#65039;</div>
            <h2>Unable to Load</h2>
            <p>Could not connect to mk.apertacodex.ai. Please check your internet connection.</p>
            <button onclick="reloadFrame()">Try Again</button>
            <button onclick="openExternal()" style="background: none; color: var(--vscode-textLink-foreground, #3794ff); border: 1px solid currentColor; margin-top: 4px;">Open in Browser</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const frame = document.getElementById('mk-frame');
        const loadingBar = document.getElementById('loading-bar');
        const urlDisplay = document.getElementById('url-display');
        const btnBack = document.getElementById('btn-back');
        const btnForward = document.getElementById('btn-forward');
        const errorScreen = document.getElementById('error-screen');

        const BASE_URL = '${safeUrl}';
        let currentUrl = BASE_URL;
        let history = [BASE_URL];
        let historyIndex = 0;
        let loadTimer = null;

        function setLoading(isLoading) {
            if (isLoading) {
                loadingBar.classList.add('loading');
                loadTimer = setTimeout(() => {
                    // If still loading after 15s, show error
                    showError();
                }, 15000);
            } else {
                loadingBar.classList.remove('loading');
                if (loadTimer) {
                    clearTimeout(loadTimer);
                    loadTimer = null;
                }
            }
        }

        function showError() {
            frame.style.display = 'none';
            errorScreen.style.display = 'flex';
            setLoading(false);
            vscode.postMessage({ command: 'loadError' });
        }

        function hideError() {
            frame.style.display = 'block';
            errorScreen.style.display = 'none';
        }

        function updateUrlDisplay(url) {
            currentUrl = url;
            urlDisplay.textContent = url;
            urlDisplay.title = url;
            vscode.postMessage({ command: 'urlChanged', url: url });
        }

        function updateNavButtons() {
            btnBack.disabled = historyIndex <= 0;
            btnForward.disabled = historyIndex >= history.length - 1;
        }

        function navigateTo(url) {
            hideError();
            setLoading(true);
            // Truncate forward history
            history = history.slice(0, historyIndex + 1);
            history.push(url);
            historyIndex = history.length - 1;
            frame.src = url;
            updateUrlDisplay(url);
            updateNavButtons();
        }

        function historyBack() {
            if (historyIndex > 0) {
                historyIndex--;
                const url = history[historyIndex];
                hideError();
                setLoading(true);
                frame.src = url;
                updateUrlDisplay(url);
                updateNavButtons();
            }
        }

        function historyForward() {
            if (historyIndex < history.length - 1) {
                historyIndex++;
                const url = history[historyIndex];
                hideError();
                setLoading(true);
                frame.src = url;
                updateUrlDisplay(url);
                updateNavButtons();
            }
        }

        function goHome() {
            navigateTo(BASE_URL);
        }

        function reloadFrame() {
            hideError();
            setLoading(true);
            frame.src = frame.src;
        }

        function openExternal() {
            vscode.postMessage({ command: 'openExternal', url: currentUrl });
        }

        // Frame load events
        frame.addEventListener('load', function() {
            setLoading(false);
            hideError();
            vscode.postMessage({ command: 'loaded' });

            // Try to detect URL change inside iframe (same-origin only)
            try {
                const frameUrl = frame.contentWindow.location.href;
                if (frameUrl && frameUrl !== 'about:blank' && frameUrl !== currentUrl) {
                    const prev = currentUrl;
                    currentUrl = frameUrl;
                    urlDisplay.textContent = frameUrl;
                    urlDisplay.title = frameUrl;
                    // Update history
                    if (history[historyIndex] !== frameUrl) {
                        history = history.slice(0, historyIndex + 1);
                        history.push(frameUrl);
                        historyIndex = history.length - 1;
                        updateNavButtons();
                    }
                    vscode.postMessage({ command: 'urlChanged', url: frameUrl });
                }
            } catch (e) {
                // Cross-origin: cannot read frame URL, that's expected
            }
        });

        frame.addEventListener('error', function() {
            showError();
        });

        // Start loading
        setLoading(true);
        updateNavButtons();
    </script>
</body>
</html>`;
    }
}
