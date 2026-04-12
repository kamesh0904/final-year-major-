/**
 * Logging utility with environment-aware behavior
 * Only logs in development mode
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isDevelopment = import.meta.env.DEV;

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (!this.isDevelopment) return;

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        switch (level) {
            case 'error':
                console.error(prefix, message, ...args);
                break;
            case 'warn':
                console.warn(prefix, message, ...args);
                break;
            case 'debug':
                console.debug(prefix, message, ...args);
                break;
            default:
                console.log(prefix, message, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, ...args);
    }

    error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }

    debug(message: string, ...args: unknown[]): void {
        this.log('debug', message, ...args);
    }
}

export const logger = new Logger();
