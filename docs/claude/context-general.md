# Context: General — Architecture & Patterns

## Cấu Trúc

Feature-Module pattern (không MVC). Mỗi module tự chứa controller/service/repository/dto.

```
src/
├── core/       # Config, Prisma, Cache, Logger, Health, Queue (RabbitMQ)
├── shared/     # Guards, Interceptors, Filters, Decorators, Pipes, Middleware, Utils
└── modules/    # auth, user, hotel, room, booking, payment, review,
                # search, notification, crawler, chat  (11 modules)
```

```
TRAVELMIND/
├── backend/    ← NestJS (repo này, port 3000)
├── ai/         ← Python FastAPI + Qdrant (port 8000)
└── frontend/   ← React SPA (port 5173)
```

## Key Patterns & Gotchas

- **Global guards**: `JwtAuthGuard` + `RolesGuard` đăng ký qua `APP_GUARD` trong `AuthModule` — mọi route mặc định cần auth, dùng `@Public()` để bypass
- **CommonJS**: KHÔNG dùng ESM-only packages. UUID dùng `crypto.randomUUID()` (Node built-in)
- **Prisma changes**: Sau khi sửa `schema.prisma` → `npx prisma generate` + restart TS server
- **Jest**: `moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" }` để resolve `.js` imports
- **NestJS v11 middleware**: `forRoutes('*path')` thay vì `forRoutes('*')`
- **Hotel/Room delete**: Soft delete (`isActive: false`), endpoint `/permanent` cho hard delete
- **Event sync**: Delete hotel/review phải emit event → AI service xóa embedding khỏi Qdrant
- **Chat WebSocket**: Namespace `/chat`, JWT auth trong `handleConnection`. Events: `sendMessage`, `messageChunk`, `messageComplete`, `typing`, `connected`, `error`
- **AI chat**: Chỉ gửi `conversation_id` + message mới — LangGraph tự quản lý history qua checkpointing

## Request Pipeline

```
Middleware (CorrelationId, RequestLogger)
  → Guards (JwtAuth, Roles)
  → Pipes (ValidationPipe: whitelist, forbidNonWhitelisted, transform)
  → Controller
  → Interceptors (Transform, Logging, Timeout, Serialize)
  → ExceptionFilters (Prisma, Validation, Global)
```

## Shared Decorators

| Decorator | Tác dụng |
|-----------|----------|
| `@Public()` | Bỏ qua JwtAuthGuard |
| `@Roles('ADMIN')` | RolesGuard kiểm tra role |
| `@Auth('ADMIN')` | Shorthand: @Roles + @UseGuards + @ApiBearerAuth |
| `@CurrentUser()` | Lấy `{ id, email, role }` từ request |
| `@CurrentUser('id')` | Lấy chỉ 1 field |
