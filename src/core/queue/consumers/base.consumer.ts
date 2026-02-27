import { Logger } from '@nestjs/common';

export abstract class BaseConsumer {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly maxRetries = 3;

  protected async handleWithRetry<T>(
    message: T,
    handler: (msg: T) => Promise<void>,
  ): Promise<void> {
    try {
      await handler(message);
    } catch (error) {
      this.logger.error(
        `Failed to process message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
