# Context: API — Endpoints & DTOs

## 38 REST Endpoints + WebSocket `/chat`

```
Auth (4):
  POST /api/auth/register       @Public
  POST /api/auth/login          @Public
  POST /api/auth/refresh        JwtRefresh
  POST /api/auth/logout         JWT

Users (3):
  GET/PATCH/DELETE /api/users/me   JWT

Hotels (7):
  GET    /api/hotels                @Public   Search (filters, pagination)
  GET    /api/hotels/nearby         @Public   Geo search
  GET    /api/hotels/:id            @Public   Detail + rooms
  POST   /api/hotels                ADMIN     Create
  PATCH  /api/hotels/:id            ADMIN/OWNER
  DELETE /api/hotels/:id            ADMIN     Soft delete
  DELETE /api/hotels/:id/permanent  ADMIN     Hard delete

Rooms (5):
  GET    /api/hotels/:id/rooms                        @Public
  GET    /api/hotels/:id/rooms/:rid/availability      @Public
  POST   /api/rooms                                   ADMIN/OWNER
  DELETE /api/rooms/:id                               ADMIN/OWNER  Soft delete
  DELETE /api/rooms/:id/permanent                     ADMIN        Hard delete

Bookings (5):
  POST   /api/bookings              JWT   Saga: validate→book→payment→block dates
  GET    /api/bookings              JWT   User thấy của mình, Admin thấy tất cả
  GET    /api/bookings/:id          JWT   Owner only
  PATCH  /api/bookings/:id/cancel   JWT
  DELETE /api/bookings/:id          JWT   PENDING only

Payments (2):
  POST /api/payments/initiate/:bookingId  JWT   Trả transactionId + bankInfo
  POST /api/payments/confirm/:txId        JWT   → Booking CONFIRMED

Reviews (3):
  GET    /api/reviews?hotelId=xxx   @Public
  POST   /api/reviews               JWT    1 review/hotel/user
  DELETE /api/reviews/:id           JWT    Owner hoặc ADMIN

Search (2):
  GET  /api/search                  @Public  Full-text (Elasticsearch)
  POST /api/search/semantic         @Public  Semantic (proxy → AI → Qdrant)

Crawler (3):
  POST /api/crawler/trigger         ADMIN   Trigger URL scraping → tạo hotel
  GET  /api/crawler/jobs            ADMIN   Danh sách jobs (paginated)
  GET  /api/crawler/jobs/:id        ADMIN   Chi tiết 1 job

Chat (3):
  GET    /api/chat/conversations     JWT
  GET    /api/chat/conversations/:id JWT
  DELETE /api/chat/conversations/:id JWT

Health (1):
  GET /health   @Public
```

## DTO Patterns

- DTOs dùng `class-validator` + `class-transformer`
- Global `ValidationPipe`: `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`
- Mỗi module có folder `dto/` riêng

## Response Format

```json
{ "success": true, "data": { ... } }
{ "success": true, "data": [...], "meta": { "total": 100, "page": 1, "limit": 10, "totalPages": 10 } }
```

SerializeInterceptor tự loại bỏ `password`, `refreshToken` khỏi response.
