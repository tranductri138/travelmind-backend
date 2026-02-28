# TravelMind Backend

NestJS 11 + TypeScript + Prisma + PostgreSQL 16 + Redis + RabbitMQ + Elasticsearch + LianLian Bank (simulated payment).

## Quick Reference

- **Node**: v20.18.3, **npm**: 10.8.2
- **Module**: CommonJS (tsconfig `module: commonjs`), nhưng import dùng `.js` extension
- **Strict mode**: ON, `strictPropertyInitialization: false` (cho DTO decorators)
- **Port**: 3000, prefix `/api`, health tại `/health`, Swagger tại `/api/docs`
- **DB**: `postgresql://travelmind:secret@localhost:5432/travelmind`

## Architecture

Feature-Module pattern (không MVC). Mỗi module tự chứa controller/service/repository/dto/events.

```
src/
├── core/          # Config, Prisma, Cache, Logger, Health, Queue
├── shared/        # Guards, Interceptors, Filters, Decorators, Pipes, Middleware, DTOs, Utils
└── modules/       # auth, user, hotel, room, booking, payment, review, search, notification, crawler
```

## Key Patterns & Gotchas

- **Global guards**: `JwtAuthGuard` + `RolesGuard` đăng ký qua `APP_GUARD` trong `AuthModule` — mọi route mặc định cần auth, dùng `@Public()` để bypass
- **ESM packages**: KHÔNG dùng ESM-only packages (project là CommonJS). Nếu cần UUID dùng `crypto.randomUUID()` (Node built-in)
- **Prisma types**: Sau khi sửa `schema.prisma`, chạy `npx prisma generate` rồi restart TS server trong IDE
- **Jest**: Cần `moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" }` để resolve `.js` imports
- **NestJS v11 routes**: Middleware dùng `forRoutes('*path')` thay vì `forRoutes('*')`
- **Event sync**: Delete hotel/review phải emit event (`hotel.deleted`, `review.deleted`) để AI service xóa embedding khỏi Qdrant
- **Hotel/Room delete**: Soft delete (set `isActive: false`), có thêm `/permanent` endpoint cho hard delete

## Commands

```bash
docker compose up -d postgres redis    # Start deps
npx prisma migrate dev                 # Migrations
npx prisma generate                    # Regenerate client
npx tsx prisma/seed.ts                 # Seed data (admin@travelmind.com / Admin123!)
npm run start:dev                      # Dev server (watch mode)
npm run build                          # Build
npm test                               # Unit tests (20 tests, 6 suites)
```

## 33 API Endpoints

Auth: register, login, refresh, logout
Users: GET/PATCH/DELETE me
Hotels: GET (search, nearby, :id), POST, PATCH, DELETE, DELETE permanent
Rooms: GET (list, availability), POST, DELETE, DELETE permanent
Bookings: GET (list, :id), POST, PATCH cancel, DELETE
Payments: POST initiate, POST confirm
Reviews: GET, POST, DELETE
Search: GET (Elasticsearch)
Crawler: POST trigger, GET status

## Events (RabbitMQ routing keys)

```
hotel.created, hotel.updated, hotel.deleted  → AI sync embedding
review.created, review.deleted               → AI sync embedding
booking.created, booking.confirmed, booking.cancelled → notification, analytics
crawler.job → AI scraping
user.registered → welcome email
```

## Monorepo Structure

```
TRAVELMIND/
├── backend/    ← This repo (NestJS, git tracked)
├── ai/         ← Python FastAPI + Qdrant (not git tracked yet)
└── frontend/   ← React SPA (not git tracked yet)
```
