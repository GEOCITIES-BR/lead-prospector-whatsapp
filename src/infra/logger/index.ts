import pino from 'pino';

let loggerInstance: pino.Logger | null = null;

export function createLogger(level: string = 'info', pretty: boolean = false): pino.Logger {
  if (loggerInstance) return loggerInstance;

  const options: pino.LoggerOptions = {
    level,
    redact: ['DATABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'WAHA_API_KEY'],
  };

  if (pretty) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname',
      },
    };
  }

  loggerInstance = pino(options);
  return loggerInstance;
}

export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    return createLogger();
  }
  return loggerInstance;
}

export function resetLogger(): void {
  loggerInstance = null;
}
