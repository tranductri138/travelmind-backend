import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context = 'Application';
  private serviceName: string;
  private environment: string;

  constructor(private readonly configService: ConfigService) {
    this.serviceName = this.configService.get<string>(
      'app.name',
      'travelmind-api',
    );
    this.environment = this.configService.get<string>(
      'app.nodeEnv',
      'development',
    );
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.writeLog('info', message, context, metadata);
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ) {
    this.writeLog('error', message, context, {
      ...metadata,
      ...(trace ? { stack: trace } : {}),
    });
  }

  warn(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.writeLog('warn', message, context, metadata);
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>) {
    this.writeLog('debug', message, context, metadata);
  }

  verbose(
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ) {
    this.writeLog('verbose', message, context, metadata);
  }

  private writeLog(
    level: string,
    message: string,
    context?: string,
    metadata?: Record<string, unknown>,
  ) {
    const logEntry = {
      '@timestamp': new Date().toISOString(),
      level,
      service: this.serviceName,
      environment: this.environment,
      context: context || this.context,
      message,
      metadata,
    };

    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        process.stderr.write(output + '\n');
        break;
      default:
        process.stdout.write(output + '\n');
        break;
    }
  }
}
