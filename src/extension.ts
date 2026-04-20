import * as vscode from 'vscode';
import { Logger } from './logger';
import { MkViewProvider } from './MkViewProvider';
import { StatusBarManager } from './StatusBarManager';

let logger: Logger;
let mkViewProvider: MkViewProvider;
let statusBarManager: StatusBarManager;

export function activate(context: vscode.ExtensionContext): void {
    logger = new Logger('MK ApertaCodex AI');
    logger.info('Extension activating...');

    mkViewProvider = new MkViewProvider(context, logger);
    statusBarManager = new StatusBarManager(context, logger);

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

    context.subscriptions.push(
        vscode.commands.registerCommand('mk-apertacodex.generateIcon', async () => {
            try {
                const cp = await import('child_process');
                const path = await import('path');
                const scriptPath = path.join(context.extensionPath, 'scripts', 'generate-icon.js');
                cp.execSync(`node "${scriptPath}"`, { cwd: context.extensionPath });
                vscode.window.showInformationMessage('MK ApertaCodex AI: Marketplace icon generated successfully at images/icon.png');
                logger.info('Marketplace icon generated successfully');
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                vscode.window.showErrorMessage(`MK ApertaCodex AI: Failed to generate icon — ${message}`);
                logger.error('Failed to generate icon', err);
            }
        })
    );

    // Listen for webview state changes to update status bar
    mkViewProvider.onDidChangeState((state) => {
        statusBarManager.updateState(state);
    });

    // Initialize status bar
    statusBarManager.initialize();

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

    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('mkApertacodex.showStatusBar')) {
                statusBarManager.updateVisibility();
            }
        })
    );

    logger.info('Extension activated successfully');
}

export function deactivate(): void {
    logger?.info('Extension deactivated');
}
