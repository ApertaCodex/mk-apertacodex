import * as vscode from 'vscode';
import { Logger } from './logger';
import { MkViewState } from './MkViewProvider';

/**
 * Manages the status bar item that shows the current state of the MK ApertaCodex AI panel.
 * Provides visual feedback about whether the panel is loaded, loading, or in an error state.
 */
export class StatusBarManager {
    private readonly _statusBarItem: vscode.StatusBarItem;
    private readonly _context: vscode.ExtensionContext;
    private readonly _logger: Logger;
    private _currentState: MkViewState = 'idle';

    constructor(context: vscode.ExtensionContext, logger: Logger) {
        this._context = context;
        this._logger = logger;

        this._statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this._statusBarItem.command = 'mk-apertacodex.openPanel';
        this._statusBarItem.name = 'MK ApertaCodex AI';

        context.subscriptions.push(this._statusBarItem);
    }

    /**
     * Initialize the status bar item with default state and show it if configured.
     */
    public initialize(): void {
        this._updateDisplay();
        this.updateVisibility();
        this._logger.info('Status bar initialized');
    }

    /**
     * Update the status bar state based on webview events.
     * @param state - The current state of the MK webview panel
     */
    public updateState(state: MkViewState): void {
        this._currentState = state;
        this._updateDisplay();
        this._logger.info(`Status bar state: ${state}`);
    }

    /**
     * Show or hide the status bar item based on user configuration.
     */
    public updateVisibility(): void {
        const config = vscode.workspace.getConfiguration('mkApertacodex');
        const showStatusBar = config.get<boolean>('showStatusBar', true);

        if (showStatusBar) {
            this._statusBarItem.show();
        } else {
            this._statusBarItem.hide();
        }
    }

    /**
     * Update the status bar item text and tooltip based on the current state.
     */
    private _updateDisplay(): void {
        switch (this._currentState) {
            case 'loading':
                this._statusBarItem.text = '$(sync~spin) MK';
                this._statusBarItem.tooltip = 'MK ApertaCodex AI — Loading...';
                this._statusBarItem.backgroundColor = undefined;
                break;

            case 'loaded':
                this._statusBarItem.text = '$(check) MK';
                this._statusBarItem.tooltip = 'MK ApertaCodex AI — Connected (click to open)';
                this._statusBarItem.backgroundColor = undefined;
                break;

            case 'error':
                this._statusBarItem.text = '$(warning) MK';
                this._statusBarItem.tooltip = 'MK ApertaCodex AI — Connection error (click to retry)';
                this._statusBarItem.backgroundColor = new vscode.ThemeColor(
                    'statusBarItem.warningBackground'
                );
                break;

            case 'idle':
            default:
                this._statusBarItem.text = '$(book) MK';
                this._statusBarItem.tooltip = 'MK ApertaCodex AI — Click to open';
                this._statusBarItem.backgroundColor = undefined;
                break;
        }
    }
}
