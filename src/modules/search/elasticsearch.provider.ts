import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

export const ELASTICSEARCH_CLIENT = 'ELASTICSEARCH_CLIENT';

export const ElasticsearchProvider: Provider = {
  provide: ELASTICSEARCH_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Client({
      node: configService.get<string>('elk.elasticsearchUrl', 'http://localhost:9200'),
    });
  },
  inject: [ConfigService],
};
