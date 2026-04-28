type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private formatMessage(level: LogLevel, module: string, message: string, payload?: any) {
    const timestamp = new Date().toISOString();
    const payloadStr = payload ? ` | ${JSON.stringify(payload)}` : '';
    return `[${timestamp}] [${level}] [${module}] ${message}${payloadStr}`;
  }

  info(module: string, message: string, payload?: any) {
    console.log(this.formatMessage('INFO', module, message, payload));
  }

  warn(module: string, message: string, payload?: any) {
    console.warn(this.formatMessage('WARN', module, message, payload));
  }

  error(module: string, message: string, payload?: any) {
    console.error(this.formatMessage('ERROR', module, message, payload));
  }
}

export const logger = new Logger();
