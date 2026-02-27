import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_TTL_KEY } from '../decorators/cache-ttl.decorator.js';

@Injectable()
export class SmartCacheInterceptor implements NestInterceptor {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler());
    if (!ttl) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const key = `cache:${request.url}`;

    const cached = await this.cacheManager.get(key);
    if (cached) {
      return of(cached);
    }

    return next.handle().pipe(
      tap((response) => {
        this.cacheManager.set(key, response, ttl * 1000);
      }),
    );
  }
}
