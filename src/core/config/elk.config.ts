import { registerAs } from '@nestjs/config';

export const elkConfig = registerAs('elk', () => ({
  logstashHost: process.env.LOGSTASH_HOST || 'localhost',
  logstashPort: parseInt(process.env.LOGSTASH_PORT || '5044', 10),
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
}));
