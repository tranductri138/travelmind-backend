import { registerAs } from '@nestjs/config';

export const aiConfig = registerAs('ai', () => ({
  serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
}));
