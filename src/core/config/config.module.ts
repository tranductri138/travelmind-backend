import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { appConfig } from './app.config.js';
import { databaseConfig } from './database.config.js';
import { redisConfig } from './redis.config.js';
import { jwtConfig } from './jwt.config.js';
import { rabbitmqConfig } from './rabbitmq.config.js';
import { elkConfig } from './elk.config.js';
import { aiConfig } from './ai.config.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [
        appConfig,
        databaseConfig,
        redisConfig,
        jwtConfig,
        rabbitmqConfig,
        elkConfig,
        aiConfig,
      ],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
        RABBITMQ_URL: Joi.string().default('amqp://guest:guest@localhost:5672'),
        // LianLian Bank — no external keys needed (simulated)
        ELASTICSEARCH_URL: Joi.string().default('http://localhost:9200'),
        LOGSTASH_HOST: Joi.string().default('localhost'),
        LOGSTASH_PORT: Joi.number().default(5044),
        AI_SERVICE_URL: Joi.string().default('http://localhost:8000'),
      }),
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),
  ],
})
export class AppConfigModule {}
