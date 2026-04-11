import * as vscode from 'vscode';

export class Logger {
    private readonly outputChannel: vscode.OutputChannel;

    constructor(channelName: string) {
        this.outputChannel = vscode.window.createOutputChannel(channelName);
    }

    public info(message: string): void {
        this.log('INFO', message);
    }

    public warn(message: string): void {
        this.log('WARN', message);
    }

    public error(message: string, error?: unknown): void {
        this.log('ERROR', message);
        if (error instanceof Error) {
            this.log('ERROR', `  Stack: ${error.stack ?? error.message}`);
        } else if (error !== undefined) {
            this.log('ERROR', `  Detail: ${String(error)}`);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }

    private log(level: string, message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${level}] ${message}`);
    }
}
