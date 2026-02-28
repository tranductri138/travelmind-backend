import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  private readonly sensitiveFields = [
    'password',
    'refreshToken',
    'refresh_token',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => this.stripSensitive(data)));
  }

  private stripSensitive(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (Array.isArray(data)) {
      return data.map((item) => this.stripSensitive(item));
    }
    if (typeof data === 'object') {
      const obj = { ...(data as Record<string, unknown>) };
      for (const field of this.sensitiveFields) {
        delete obj[field];
      }
      return obj;
    }
    return data;
  }
}
