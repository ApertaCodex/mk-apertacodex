import * as vscode from 'vscode';
import { Logger } from './logger';
import { MkViewProvider } from './MkViewProvider';

let logger: Logger;
let mkViewProvider: MkViewProvider;

/**
 * Activates the MK ApertaCodex AI extension.
 * Registers the webview view provider and all commands.
 */
export function activate(context: vscode.ExtensionContext): void {
    logger = new Logger('MK ApertaCodex AI');
    logger.info('Extension activating...');

    mkViewProvider = new MkViewProvider(context, logger);

    // Register the webview view provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'mk-apertacodex.mkView',
            mkViewProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('mk-apertacodex.openPanel', () => {
            vscode.commands.executeCommand('mk-apertacodex.mkView.focus');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mk-apertacodex.refresh', () => {
            mkViewProvider.refresh();
            logger.info('View refreshed by user');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mk-apertacodex.goHome', () => {
            mkViewProvider.goHome();
            logger.info('Navigated home');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mk-apertacodex.openExternal', () => {
            const url = mkViewProvider.getCurrentUrl();
            vscode.env.openExternal(vscode.Uri.parse(url));
            logger.info(`Opened externally: ${url}`);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('mk-apertacodex.copyUrl', async () => {
            const url = mkViewProvider.getCurrentUrl();
            await vscode.env.clipboard.writeText(url);
            vscode.window.showInformationMessage(`URL copied: ${url}`);
            logger.info(`URL copied to clipboard: ${url}`);
        })
    );

    // Auto-focus the view if configured
    const config = vscode.workspace.getConfiguration('mkApertacodex');
    if (config.get<boolean>('autoLoad', true)) {
        // Small delay to allow the activity bar to initialize
        setTimeout(() => {
            vscode.commands.executeCommand('mk-apertacodex.mkView.focus').then(
                () => logger.info('Auto-focused MK view'),
                (err) => logger.warn(`Auto-focus skipped: ${err}`)
            );
        }, 1500);
    }

    logger.info('Extension activated successfully');
}

export function deactivate(): void {
    logger?.info('Extension deactivated');
}
