import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter.js';
import { PrismaExceptionFilter } from './filters/prisma-exception.filter.js';
import { ValidationExceptionFilter } from './filters/validation-exception.filter.js';
import { TransformInterceptor } from './interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor.js';
import { SerializeInterceptor } from './interceptors/serialize.interceptor.js';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
  ],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*path');
  }
}
