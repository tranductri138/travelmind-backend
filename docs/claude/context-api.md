# Context: API — Endpoints & DTOs

## 39 REST Endpoints + WebSocket `/chat`

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
  GET    /api/hotels/:hotelId/rooms                        @Public
  GET    /api/hotels/:hotelId/rooms/:roomId/availability   @Public
  POST   /api/hotels/:hotelId/rooms                        ADMIN/OWNER
  DELETE /api/hotels/:hotelId/rooms/:roomId                ADMIN/OWNER  Soft delete
  DELETE /api/hotels/:hotelId/rooms/:roomId/permanent      ADMIN        Hard delete

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
  GET  /api/search                  @Public  Unified (keyword + semantic, fallback PostgreSQL)
  POST /api/search/semantic         @Public  Semantic (proxy → AI → Qdrant)

Crawler (3):
  POST /api/crawler/trigger         ADMIN   Trigger URL scraping → tạo hotel
  GET  /api/crawler/jobs            ADMIN   Danh sách jobs (paginated)
  GET  /api/crawler/jobs/:id        ADMIN   Chi tiết 1 job

Upload (1):
  POST /api/upload/hotel-images     ADMIN/OWNER  Upload images (max 10, 5MB/file)

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

## Curl Examples

Base URL: `http://localhost:3000`

### Auth

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","name":"Test User"}'

# Login → trả accessToken + refreshToken
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@travelmind.com","password":"Admin123!"}'

# Refresh token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Authorization: Bearer <refreshToken>"

# Logout
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer <accessToken>"
```

### Users

```bash
# Get profile
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>"

# Update profile
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","phone":"0123456789"}'

# Delete account
curl -X DELETE http://localhost:3000/api/users/me \
  -H "Authorization: Bearer <accessToken>"
```

### Hotels

```bash
# List hotels (public)
curl "http://localhost:3000/api/hotels?page=1&limit=10"

# Search nearby
curl "http://localhost:3000/api/hotels/nearby?latitude=16.07&longitude=108.24&radius=10"

# Get hotel detail
curl http://localhost:3000/api/hotels/<hotelId>

# Create hotel (admin)
curl -X POST http://localhost:3000/api/hotels \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Hotel","address":"123 Street","city":"Đà Nẵng","country":"Vietnam","stars":4}'

# Update hotel (admin/owner)
curl -X PATCH http://localhost:3000/api/hotels/<hotelId> \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"rating":4.5}'

# Soft delete
curl -X DELETE http://localhost:3000/api/hotels/<hotelId> \
  -H "Authorization: Bearer <accessToken>"

# Hard delete
curl -X DELETE http://localhost:3000/api/hotels/<hotelId>/permanent \
  -H "Authorization: Bearer <accessToken>"
```

### Rooms

```bash
# List rooms for hotel (public)
curl http://localhost:3000/api/hotels/<hotelId>/rooms

# Check availability (public)
curl "http://localhost:3000/api/hotels/<hotelId>/rooms/<roomId>/availability?checkIn=2026-03-10&checkOut=2026-03-15"

# Create room (admin/owner)
curl -X POST http://localhost:3000/api/hotels/<hotelId>/rooms \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Deluxe Room","type":"deluxe","price":150,"maxGuests":2,"amenities":["wifi","tv"]}'

# Soft delete room
curl -X DELETE http://localhost:3000/api/hotels/<hotelId>/rooms/<roomId> \
  -H "Authorization: Bearer <accessToken>"

# Hard delete room (admin)
curl -X DELETE http://localhost:3000/api/hotels/<hotelId>/rooms/<roomId>/permanent \
  -H "Authorization: Bearer <accessToken>"
```

### Bookings

```bash
# Create booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"<roomId>","checkIn":"2026-03-10","checkOut":"2026-03-15","guests":2}'

# List my bookings
curl "http://localhost:3000/api/bookings?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"

# Get booking detail
curl http://localhost:3000/api/bookings/<bookingId> \
  -H "Authorization: Bearer <accessToken>"

# Cancel booking
curl -X PATCH http://localhost:3000/api/bookings/<bookingId>/cancel \
  -H "Authorization: Bearer <accessToken>"

# Delete booking (PENDING only)
curl -X DELETE http://localhost:3000/api/bookings/<bookingId> \
  -H "Authorization: Bearer <accessToken>"
```

### Payments

```bash
# Initiate payment
curl -X POST http://localhost:3000/api/payments/initiate/<bookingId> \
  -H "Authorization: Bearer <accessToken>"

# Confirm payment
curl -X POST http://localhost:3000/api/payments/confirm/<transactionId> \
  -H "Authorization: Bearer <accessToken>"
```

### Reviews

```bash
# List reviews for hotel (public)
curl "http://localhost:3000/api/reviews?hotelId=<hotelId>&page=1&limit=10"

# Create review
curl -X POST http://localhost:3000/api/reviews \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"hotelId":"<hotelId>","rating":5,"title":"Great!","comment":"Loved it"}'

# Delete review
curl -X DELETE http://localhost:3000/api/reviews/<reviewId> \
  -H "Authorization: Bearer <accessToken>"
```

### Search

```bash
# Unified search — keyword + semantic, fallback PostgreSQL khi ES down
curl "http://localhost:3000/api/search?q=biển+Đà+Nẵng&page=1&limit=10"

# With city/country filter
curl "http://localhost:3000/api/search?q=hotel&city=Đà+Nẵng&country=Vietnam"

# Semantic search (POST, qua AI service)
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query":"khách sạn gần biển có hồ bơi","city":"Đà Nẵng","limit":5}'
```

### Crawler

```bash
# Trigger crawl (admin)
curl -X POST http://localhost:3000/api/crawler/trigger \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/hotel","extractReviews":true}'

# List jobs (admin)
curl "http://localhost:3000/api/crawler/jobs?page=1&limit=10" \
  -H "Authorization: Bearer <accessToken>"

# Get job detail (admin)
curl http://localhost:3000/api/crawler/jobs/<jobId> \
  -H "Authorization: Bearer <accessToken>"
```

### Upload

```bash
# Upload hotel images (admin/owner, multipart)
curl -X POST http://localhost:3000/api/upload/hotel-images \
  -H "Authorization: Bearer <accessToken>" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

### Chat

```bash
# List conversations
curl http://localhost:3000/api/chat/conversations \
  -H "Authorization: Bearer <accessToken>"

# Get conversation with messages
curl http://localhost:3000/api/chat/conversations/<conversationId> \
  -H "Authorization: Bearer <accessToken>"

# Delete conversation
curl -X DELETE http://localhost:3000/api/chat/conversations/<conversationId> \
  -H "Authorization: Bearer <accessToken>"
```

### Health

```bash
curl http://localhost:3000/health
```
