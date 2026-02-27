import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module.js';
import { PrismaModule } from './database/prisma.module.js';
import { AppCacheModule } from './cache/cache.module.js';
import { LoggerModule } from './logger/logger.module.js';
import { HealthModule } from './health/health.module.js';

@Global()
@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AppCacheModule,
    LoggerModule,
    HealthModule,
  ],
  exports: [
    AppConfigModule,
    PrismaModule,
    AppCacheModule,
    LoggerModule,
  ],
})
export class CoreModule {}
