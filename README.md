# 🌍 TravelMind — Nền Tảng Du Lịch Thông Minh

> Smart Travel Platform — Backend API

---

## 📖 Mô tả dự án

TravelMind là nền tảng du lịch thông minh hỗ trợ người dùng tìm kiếm khách sạn, so sánh giá, đọc đánh giá, đặt phòng trực tuyến và thanh toán. Hệ thống thu thập dữ liệu khách sạn, đánh giá, giá cả từ nhiều nguồn khác nhau, đồng bộ real-time qua message queue.

Phần AI/LLM (gợi ý lịch trình, semantic search, vector embeddings) được xây dựng như một **service Python riêng biệt**, giao tiếp với backend chính qua REST API và RabbitMQ.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js 20 LTS |
| **Framework** | NestJS 11 (TypeScript strict mode) |
| **WebSocket** | Socket.io (@nestjs/platform-socket.io) |
| **Database** | PostgreSQL 16 |
| **ORM** | Prisma |
| **Message Queue** | RabbitMQ |
| **Cache** | Redis 7 |
| **Search Engine** | Elasticsearch 8 (phần của ELK) |
| **Logging** | ELK Stack (Elasticsearch + Logstash + Kibana) |
| **Payment** | LianLian Bank (simulated) |
| **Auth** | JWT (access + refresh token) + Passport |
| **Validation** | class-validator + class-transformer |
| **Documentation** | Swagger (OpenAPI 3.0) |
| **Testing** | Jest (unit + e2e) |
| **Containerization** | Docker + Docker Compose |
| **Orchestration** | Kubernetes (production) |
| **CI/CD** | GitHub Actions |

---

## 📁 Project Structure — Feature-Module Architecture

Không dùng MVC truyền thống (tách controllers/, services/, entities/ riêng). Thay vào đó dùng **Feature-Module** kết hợp **Clean Architecture layers** bên trong mỗi module — mỗi module là một "mini-application" độc lập, encapsulate toàn bộ domain logic riêng.

```
travelmind-api/
│
├── src/
│   │
│   ├── main.ts                          # Bootstrap application
│   ├── app.module.ts                    # Root module — import tất cả
│   │
│   │── ─────────────────────────────────
│   │   CORE INFRASTRUCTURE
│   │── ─────────────────────────────────
│   │
│   ├── core/                            # 🔧 Core module (Global, import 1 lần)
│   │   ├── core.module.ts
│   │   ├── database/
│   │   │   ├── prisma.module.ts
│   │   │   ├── prisma.service.ts        # PrismaClient wrapper, onModuleInit/Destroy
│   │   │   └── prisma.health.ts         # DB health indicator
│   │   ├── cache/
│   │   │   ├── cache.module.ts          # Redis cache module
│   │   │   └── cache.service.ts
│   │   ├── queue/
│   │   │   ├── rabbitmq.module.ts       # RabbitMQ connection + config
│   │   │   ├── rabbitmq.service.ts      # Producer helper
│   │   │   └── consumers/              
│   │   │       └── base.consumer.ts     # Abstract consumer với retry + DLQ
│   │   ├── logger/
│   │   │   ├── logger.module.ts         # Custom Logger → ELK
│   │   │   ├── logger.service.ts        # Structured JSON logging
│   │   │   └── elk.transport.ts         # Transport logs → Logstash
│   │   ├── config/
│   │   │   ├── config.module.ts         # @nestjs/config + validation
│   │   │   ├── app.config.ts            # App config (port, env)
│   │   │   ├── database.config.ts       # DB connection config
│   │   │   ├── redis.config.ts
│   │   │   ├── rabbitmq.config.ts
│   │   │   ├── jwt.config.ts
│   │   │   └── elk.config.ts
│   │   └── health/
│   │       ├── health.module.ts         # @nestjs/terminus health checks
│   │       └── health.controller.ts     # GET /health — DB, Redis, RabbitMQ, ELK
│   │
│   │── ─────────────────────────────────
│   │   SHARED (dùng chung giữa modules)
│   │── ─────────────────────────────────
│   │
│   ├── shared/                          # 📦 Shared module — utilities dùng chung
│   │   ├── shared.module.ts
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts    # @CurrentUser() param decorator
│   │   │   ├── public.decorator.ts          # @Public() skip auth
│   │   │   ├── roles.decorator.ts           # @Roles('admin')
│   │   │   ├── auth.decorator.ts            # @Auth('admin') composition
│   │   │   ├── api-paginated.decorator.ts   # @ApiPaginated() swagger
│   │   │   └── cache-ttl.decorator.ts       # @CacheTTL(300)
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts            # JWT validation + @Public() check
│   │   │   ├── roles.guard.ts              # Role-based access
│   │   │   └── throttle.guard.ts           # Rate limiting per route
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts     # Wrap response { success, data, meta }
│   │   │   ├── logging.interceptor.ts       # Log request/response + duration
│   │   │   ├── timeout.interceptor.ts       # Request timeout (default 10s)
│   │   │   ├── cache.interceptor.ts         # Smart cache với @CacheTTL()
│   │   │   └── serialize.interceptor.ts     # Strip sensitive fields
│   │   ├── filters/
│   │   │   ├── global-exception.filter.ts   # Catch-all exception handler
│   │   │   ├── prisma-exception.filter.ts   # Prisma error → HTTP error mapping
│   │   │   └── validation-exception.filter.ts
│   │   ├── pipes/
│   │   │   ├── parse-date.pipe.ts
│   │   │   └── parse-sort.pipe.ts           # ?sort=price:asc,rating:desc
│   │   ├── middleware/
│   │   │   ├── correlation-id.middleware.ts  # X-Correlation-ID cho tracing
│   │   │   └── request-logger.middleware.ts  # HTTP request log → ELK
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts            # PaginationQueryDto (page, limit, cursor)
│   │   │   ├── paginated-response.dto.ts    # PaginatedResponse<T>
│   │   │   └── api-response.dto.ts          # Standard response wrapper
│   │   ├── interfaces/
│   │   │   ├── pagination.interface.ts
│   │   │   └── base-service.interface.ts
│   │   ├── constants/
│   │   │   ├── app.constants.ts             # Tokens, magic strings
│   │   │   ├── queue.constants.ts           # Queue names, routing keys
│   │   │   └── cache-keys.constants.ts
│   │   └── utils/
│   │       ├── slug.util.ts
│   │       ├── hash.util.ts
│   │       └── date.util.ts
│   │
│   │── ─────────────────────────────────
│   │   FEATURE MODULES (Business Logic)
│   │── ─────────────────────────────────
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/                        # 🔐 Authentication & Authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts       # POST /auth/register, /login, /refresh, /logout
│   │   │   ├── auth.service.ts          # Business logic: register, login, token rotation
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts      # Passport JWT strategy
│   │   │   │   ├── jwt-refresh.strategy.ts
│   │   │   │   └── local.strategy.ts    # Username/password
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── token-response.dto.ts
│   │   │   └── __tests__/
│   │   │       ├── auth.service.spec.ts
│   │   │       └── auth.controller.spec.ts
│   │   │
│   │   ├── user/                        # 👤 User Management
│   │   │   ├── user.module.ts
│   │   │   ├── user.controller.ts       # GET /users/me, PATCH /users/me
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts       # Prisma queries, tách khỏi service
│   │   │   ├── dto/
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts # @Expose() fields cho serialization
│   │   │   ├── events/
│   │   │   │   └── user-registered.event.ts  # Event object → publish to queue
│   │   │   └── __tests__/
│   │   │       └── user.service.spec.ts
│   │   │
│   │   ├── hotel/                       # 🏨 Hotel Management (Core domain)
│   │   │   ├── hotel.module.ts
│   │   │   ├── hotel.controller.ts      # CRUD + search + nearby + availability
│   │   │   ├── hotel.service.ts         # Business logic
│   │   │   ├── hotel.repository.ts      # Complex Prisma queries, raw SQL, geo queries
│   │   │   ├── dto/
│   │   │   │   ├── create-hotel.dto.ts
│   │   │   │   ├── update-hotel.dto.ts
│   │   │   │   ├── search-hotel.dto.ts  # Filters: location, price range, rating, amenities
│   │   │   │   ├── hotel-response.dto.ts
│   │   │   │   └── nearby-query.dto.ts  # lat, lng, radius
│   │   │   ├── events/
│   │   │   │   ├── hotel-created.event.ts
│   │   │   │   └── hotel-price-updated.event.ts
│   │   │   ├── consumers/
│   │   │   │   ├── price-sync.consumer.ts       # Consume price updates từ crawler
│   │   │   │   └── hotel-indexing.consumer.ts    # Sync hotel data → Elasticsearch
│   │   │   └── __tests__/
│   │   │       ├── hotel.service.spec.ts
│   │   │       ├── hotel.repository.spec.ts
│   │   │       └── hotel.e2e-spec.ts
│   │   │
│   │   ├── room/                        # 🛏️ Room & Availability
│   │   │   ├── room.module.ts
│   │   │   ├── room.controller.ts       # GET /hotels/:hotelId/rooms, availability check
│   │   │   ├── room.service.ts
│   │   │   ├── room.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-room.dto.ts
│   │   │   │   ├── check-availability.dto.ts
│   │   │   │   └── room-response.dto.ts
│   │   │   └── __tests__/
│   │   │       └── room.service.spec.ts
│   │   │
│   │   ├── booking/                     # 📋 Booking (Core domain)
│   │   │   ├── booking.module.ts
│   │   │   ├── booking.controller.ts    # POST /bookings, GET /bookings, PATCH cancel
│   │   │   ├── booking.service.ts       # Create, confirm, cancel + transaction logic
│   │   │   ├── booking.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-booking.dto.ts
│   │   │   │   ├── booking-response.dto.ts
│   │   │   │   └── booking-filter.dto.ts
│   │   │   ├── events/
│   │   │   │   ├── booking-created.event.ts     # → Queue: send email, update availability
│   │   │   │   ├── booking-confirmed.event.ts   # → Queue: notify hotel, analytics
│   │   │   │   └── booking-cancelled.event.ts   # → Queue: refund, restore availability
│   │   │   ├── consumers/
│   │   │   │   ├── booking-notification.consumer.ts  # Send confirmation email
│   │   │   │   └── booking-analytics.consumer.ts     # Track booking metrics
│   │   │   ├── saga/
│   │   │   │   └── booking.saga.ts      # Orchestrate: lock room → charge → confirm
│   │   │   └── __tests__/
│   │   │       ├── booking.service.spec.ts
│   │   │       └── booking.e2e-spec.ts
│   │   │
│   │   ├── payment/                     # 💳 Payment (LianLian Bank)
│   │   │   ├── payment.module.ts
│   │   │   ├── payment.controller.ts    # POST /payments/initiate, POST /payments/confirm
│   │   │   ├── payment.service.ts       # LianLian Bank simulated payment
│   │   │   ├── dto/
│   │   │   │   ├── create-payment.dto.ts
│   │   │   │   └── payment-response.dto.ts
│   │   │   ├── consumers/
│   │   │   │   └── refund-process.consumer.ts   # Async refund processing
│   │   │   └── __tests__/
│   │   │       └── payment.service.spec.ts
│   │   │
│   │   ├── review/                      # ⭐ Review & Rating
│   │   │   ├── review.module.ts
│   │   │   ├── review.controller.ts     # CRUD reviews for hotels
│   │   │   ├── review.service.ts        # Create review, update hotel aggregate rating
│   │   │   ├── review.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-review.dto.ts
│   │   │   │   └── review-response.dto.ts
│   │   │   ├── events/
│   │   │   │   └── review-created.event.ts  # → Queue: update rating, send to AI service
│   │   │   ├── consumers/
│   │   │   │   └── rating-aggregator.consumer.ts  # Recalculate hotel avg rating
│   │   │   └── __tests__/
│   │   │       └── review.service.spec.ts
│   │   │
│   │   ├── search/                      # 🔍 Search (Elasticsearch)
│   │   │   ├── search.module.ts
│   │   │   ├── search.controller.ts     # GET /search?q=...&filters=...
│   │   │   ├── search.service.ts        # Elasticsearch queries
│   │   │   ├── elasticsearch.provider.ts # ES client factory
│   │   │   ├── dto/
│   │   │   │   ├── search-query.dto.ts
│   │   │   │   └── search-result.dto.ts
│   │   │   ├── indices/
│   │   │   │   ├── hotel.index.ts       # Index mapping definition
│   │   │   │   └── review.index.ts
│   │   │   └── __tests__/
│   │   │       └── search.service.spec.ts
│   │   │
│   │   ├── notification/                # 📧 Notification
│   │   │   ├── notification.module.ts
│   │   │   ├── notification.service.ts  # Email, push notification logic
│   │   │   ├── templates/
│   │   │   │   ├── booking-confirmed.hbs
│   │   │   │   ├── booking-cancelled.hbs
│   │   │   │   └── welcome.hbs
│   │   │   └── consumers/
│   │   │       ├── email.consumer.ts    # Consume from email queue
│   │   │       └── push.consumer.ts
│   │   │
│   │   ├── chat/                        # 💬 AI Chat (WebSocket + REST)
│   │   │   ├── chat.module.ts
│   │   │   ├── chat.gateway.ts        # Socket.io gateway, namespace /chat, JWT auth
│   │   │   ├── chat.controller.ts     # GET/DELETE conversations
│   │   │   ├── chat.service.ts        # SSE streaming to Python AI service
│   │   │   ├── chat.repository.ts     # Prisma CRUD for conversations/messages
│   │   │   └── dto/
│   │   │       ├── send-message.dto.ts
│   │   │       ├── conversation-response.dto.ts
│   │   │       └── message-response.dto.ts
│   │   │
│   │   └── crawler/                     # 🕷️ Price Crawler / Data Sync
│   │       ├── crawler.module.ts
│   │       ├── crawler.service.ts       # Schedule + trigger crawl jobs
│   │       ├── crawler.controller.ts    # Admin: POST /crawler/trigger, GET /crawler/status
│   │       ├── processors/
│   │       │   ├── price-scraper.processor.ts     # Scrape hotel prices
│   │       │   └── review-scraper.processor.ts    # Scrape reviews
│   │       ├── consumers/
│   │       │   └── crawl-job.consumer.ts  # Process crawl jobs from queue
│   │       └── __tests__/
│   │           └── crawler.service.spec.ts
│   │
│   │── ─────────────────────────────────
│   │   DATABASE
│   │── ─────────────────────────────────
│   │
│   └── prisma/
│       ├── schema.prisma                # Prisma schema (single source of truth)
│       ├── migrations/                  # Auto-generated migrations
│       ├── seed.ts                      # Seed data for development
│       └── seed-data/
│           ├── hotels.json
│           └── users.json
│
│── ─────────────────────────────────────
│   INFRASTRUCTURE / CONFIG
│── ─────────────────────────────────────
│
├── docker/
│   ├── Dockerfile                       # Multi-stage build
│   ├── Dockerfile.dev                   # Dev with hot reload
│   └── elk/
│       ├── logstash.conf               # Logstash pipeline config
│       ├── elasticsearch.yml
│       └── kibana.yml
│
├── k8s/
│   ├── namespace.yaml
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   ├── configmap.yaml
│   ├── secrets.yaml
│   └── ingress.yaml
│
├── docker-compose.yml                   # Local dev: API + PG + Redis + RabbitMQ + ELK
├── docker-compose.test.yml              # E2E test environment
│
├── .env.example
├── .env.development
├── .env.test
│
├── tsconfig.json
├── tsconfig.build.json
├── nest-cli.json
├── jest.config.ts
├── eslint.config.mjs
├── .prettierrc
│
├── test/
│   ├── jest-e2e.config.ts
│   ├── setup.ts                         # Global test setup
│   └── fixtures/
│       ├── hotel.fixture.ts
│       ├── booking.fixture.ts
│       └── user.fixture.ts
│
└── README.md
```

---

## 🧩 Tại sao Feature-Module thay vì MVC?

### MVC truyền thống (❌ KHÔNG dùng)

```
src/
├── controllers/          # TẤT CẢ controllers gộp chung
│   ├── hotel.controller.ts
│   ├── booking.controller.ts
│   └── user.controller.ts
├── services/             # TẤT CẢ services gộp chung
│   ├── hotel.service.ts
│   └── booking.service.ts
├── entities/             # TẤT CẢ entities gộp chung
└── dto/                  # TẤT CẢ DTOs gộp chung
```

**Vấn đề**: Khi project lớn (20+ entities), mỗi thư mục chứa 30+ files. Không thể nhìn 1 feature và hiểu toàn bộ context. Thay đổi 1 feature phải sửa files ở 5 thư mục khác nhau. Khó tách thành microservice sau này.

### Feature-Module (✅ ĐANG DÙNG)

```
src/modules/hotel/        # MỌI THỨ liên quan hotel nằm ĐÂY
├── hotel.module.ts       # Module definition
├── hotel.controller.ts   # API endpoints
├── hotel.service.ts      # Business logic
├── hotel.repository.ts   # Data access (Prisma queries)
├── dto/                  # DTOs chỉ cho hotel
├── events/               # Domain events
├── consumers/            # Queue consumers
└── __tests__/            # Tests cho hotel
```

**Lợi ích**:
- **Cohesion**: Mọi thứ liên quan hotel nằm cùng 1 nơi
- **Encapsulation**: Module chỉ export những gì cần thiết qua `exports: [HotelService]`
- **Independence**: Thay đổi hotel module không ảnh hưởng booking module
- **Microservice-ready**: Mỗi module có thể tách thành service riêng khi cần scale
- **Onboarding**: Dev mới chỉ cần đọc 1 thư mục là hiểu toàn bộ 1 feature

---

## 🔗 Module Dependency Graph

```
AppModule
├── CoreModule (@Global)
│   ├── PrismaModule          # Database connection
│   ├── CacheModule            # Redis
│   ├── RabbitMQModule         # Message queue
│   ├── LoggerModule           # Structured logging → ELK
│   ├── ConfigModule           # Environment config
│   └── HealthModule           # Health checks
│
├── SharedModule
│   ├── Guards                 # JwtAuthGuard, RolesGuard
│   ├── Interceptors           # Transform, Logging, Cache, Timeout
│   ├── Filters                # GlobalException, PrismaException
│   ├── Pipes                  # Validation, ParseDate
│   ├── Decorators             # @CurrentUser, @Auth, @Public
│   └── DTOs                   # Pagination, ApiResponse
│
├── AuthModule
│   └── depends on: UserModule
│
├── UserModule
│   └── depends on: (none — chỉ dùng CoreModule)
│
├── HotelModule
│   └── depends on: SearchModule, RoomModule
│
├── RoomModule
│   └── depends on: (none)
│
├── BookingModule
│   └── depends on: HotelModule, RoomModule, PaymentModule
│
├── PaymentModule
│   └── depends on: (none — LianLian Bank simulated)
│
├── ReviewModule
│   └── depends on: HotelModule
│
├── SearchModule
│   └── depends on: (Elasticsearch client)
│
├── NotificationModule
│   └── depends on: (email provider)
│
├── ChatModule
│   └── depends on: AuthModule (JWT validation for WebSocket)
│
└── CrawlerModule
    └── depends on: HotelModule
```

### Quy tắc dependencies

1. **CoreModule** là `@Global()` → tất cả module tự động access PrismaService, CacheService, LoggerService, RabbitMQService
2. **SharedModule** export guards/interceptors/pipes/decorators → import khi cần
3. **Feature modules** chỉ import module khác khi **thực sự cần** service của nó
4. **Không circular dependency** — nếu BookingModule cần HotelService, import HotelModule. Nếu HotelModule cũng cần BookingService → tách logic ra event qua RabbitMQ

---

## 🐰 RabbitMQ — Message Flow

### Exchange & Queue Architecture

```
                        ┌─────────────────────────────────────────┐
                        │         RabbitMQ Broker                  │
                        │                                         │
                        │  ┌──────────────────────────────────┐   │
  Producer              │  │  Exchange: travelmind.events      │   │
  (Services)  ────────► │  │  Type: topic                     │   │
                        │  └──────────┬───────────────────────┘   │
                        │             │                           │
                        │    Routing Keys                        │
                        │             │                           │
                        │  ┌──────────▼───────────────────────┐   │
                        │  │                                   │   │
                        │  │  booking.created ──► booking.notification.queue  │
                        │  │                 ──► booking.analytics.queue      │
                        │  │                 ──► room.availability.queue      │
                        │  │                                   │   │
                        │  │  booking.confirmed ──► notification.email.queue  │
                        │  │                    ──► analytics.queue           │
                        │  │                                   │   │
                        │  │  booking.cancelled ──► payment.refund.queue      │
                        │  │                    ──► room.availability.queue   │
                        │  │                                   │   │
                        │  │  review.created ──► rating.aggregator.queue      │
                        │  │                 ──► search.indexing.queue        │
                        │  │                                   │   │
                        │  │  hotel.price.updated ──► search.indexing.queue   │
                        │  │                      ──► cache.invalidate.queue  │
                        │  │                                   │   │
                        │  │  crawler.job ──► crawl.processing.queue          │
                        │  │                                   │   │
                        │  └───────────────────────────────────┘   │
                        │                                         │
                        │  ┌──────────────────────────────────┐   │
                        │  │  Exchange: travelmind.dlx         │   │
                        │  │  (Dead Letter Exchange)           │   │
                        │  │  → failed messages sau 3 retries  │   │
                        │  └──────────────────────────────────┘   │
                        └─────────────────────────────────────────┘
```

### Event Flow ví dụ — Booking

```
User đặt phòng
    │
    ▼
BookingController.create()
    │
    ▼
BookingService.create()
    ├── 1. Prisma transaction: check room → create booking (PENDING)
    ├── 2. Publish event → RabbitMQ: booking.created
    └── Return booking to user
              │
              ▼ (Async consumers)
    ┌─────────┼───────────────────────────┐
    │         │                           │
    ▼         ▼                           ▼
  Email     Room                      Analytics
 Consumer   Consumer                  Consumer
    │         │                           │
 Send      Update room                Track booking
 confirm   isAvailable=false          metrics → ELK
 email
              │
              ▼ (User confirms payment)
    PaymentService.confirmPayment()
    ├── Verify transactionId
    ├── Update booking status → CONFIRMED
    └── Publish → booking.confirmed
              │
              ▼
    Notification Consumer → Email "Booking confirmed!"
```

### RabbitMQ Configuration

```typescript
// core/queue/rabbitmq.module.ts
@Module({})
export class RabbitMQModule {
  static forRoot(): DynamicModule {
    return {
      module: RabbitMQModule,
      imports: [
        ClientsModule.registerAsync([{
          name: 'RABBITMQ_SERVICE',
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            transport: Transport.RMQ,
            options: {
              urls: [config.get('RABBITMQ_URL')],
              queue: 'travelmind.main',
              queueOptions: {
                durable: true,
                deadLetterExchange: 'travelmind.dlx',
                deadLetterRoutingKey: 'failed',
                messageTtl: 30000,       // 30s timeout
              },
              prefetchCount: 10,          // Process 10 messages concurrently
              noAck: false,               // Manual acknowledgment
            },
          }),
          inject: [ConfigService],
        }]),
      ],
      exports: [ClientsModule],
      global: true,
    };
  }
}
```

---

## 📊 ELK Stack — Logging & Monitoring

### Architecture

```
NestJS App                   ELK Stack
┌──────────┐
│ LoggerSvc│──JSON logs──►  Logstash (port 5044)
│          │                    │
│ Request  │                    │ Parse, filter, enrich
│ Middleware│                    │ Add: correlationId, env, service
│          │                    ▼
│ Exception│              Elasticsearch (port 9200)
│ Filter   │                    │
└──────────┘                    │ Index: travelmind-logs-YYYY.MM.DD
                                ▼
                          Kibana (port 5601)
                                │
                          ┌─────┴──────────────────────┐
                          │ Dashboards:                  │
                          │ • Request rate & latency     │
                          │ • Error rate by endpoint     │
                          │ • Slow queries (>500ms)      │
                          │ • Booking funnel analytics   │
                          │ • Queue consumer lag         │
                          │ • 4xx/5xx breakdown          │
                          └────────────────────────────┘
```

### Structured Log Format

Mọi log từ app đều output dạng JSON để Logstash parse:

```typescript
// Mỗi log entry có format:
{
  "@timestamp": "2026-02-28T10:30:00.000Z",
  "level": "info",                          // info | warn | error | debug
  "service": "travelmind-api",
  "environment": "production",
  "correlationId": "uuid-v4",              // Trace xuyên suốt 1 request
  "context": "BookingService",             // Class name
  "message": "Booking created",
  "metadata": {
    "bookingId": "abc123",
    "userId": "user456",
    "hotelId": "hotel789",
    "duration": 45                          // ms
  }
}

// Error log bổ sung:
{
  "level": "error",
  "message": "Payment failed",
  "error": {
    "name": "PaymentError",
    "message": "Transaction not found",
    "code": "payment_failed",
    "stack": "..."                          // Chỉ trong development
  },
  "request": {
    "method": "POST",
    "url": "/bookings",
    "ip": "1.2.3.4",
    "userAgent": "..."
  }
}
```

### Logstash Pipeline

```ruby
# docker/elk/logstash.conf
input {
  tcp {
    port => 5044
    codec => json
  }
}

filter {
  # Parse timestamp
  date {
    match => ["@timestamp", "ISO8601"]
  }

  # Enrich with geo data from IP
  if [request][ip] {
    geoip {
      source => "[request][ip]"
      target => "geo"
    }
  }

  # Tag slow requests
  if [metadata][duration] and [metadata][duration] > 500 {
    mutate {
      add_tag => ["slow_request"]
    }
  }

  # Tag errors
  if [level] == "error" {
    mutate {
      add_tag => ["error"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "travelmind-logs-%{+YYYY.MM.dd}"
  }
}
```

---

## 💳 Payment Flow (LianLian Bank — Simulated)

```
Client                    API                     LianLian Bank (simulated)
  │                        │                          │
  │  POST /bookings        │                          │
  │───────────────────────►│                          │
  │                        │  Create booking (PENDING) │
  │  ◄── { booking }       │                          │
  │                        │                          │
  │  POST /payments/       │                          │
  │  initiate/:bookingId   │                          │
  │───────────────────────►│                          │
  │                        │  Generate transactionId   │
  │  ◄── { transactionId,  │  (LL-uuid)              │
  │       amount, bankInfo }│                          │
  │                        │                          │
  │  POST /payments/       │                          │
  │  confirm/:transactionId│                          │
  │───────────────────────►│                          │
  │                        │  Update payment→SUCCEEDED │
  │                        │  Update booking→CONFIRMED │
  │                        │  Publish booking.confirmed│
  │  ◄── { status }        │                          │
  │                        │                          │
  │  ◄── Confirmation email│                          │
```

---

## 🐳 Docker Compose (Development)

```yaml
# docker-compose.yml
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.dev
    ports:
      - "3000:3000"
      - "9229:9229"              # Debug port
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://travelmind:secret@postgres:5432/travelmind
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
      - ELASTICSEARCH_URL=http://elasticsearch:9200

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: travelmind
      POSTGRES_USER: travelmind
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U travelmind"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s

  rabbitmq:
    image: rabbitmq:3.13-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"            # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_running"]
      interval: 10s

  # ── ELK Stack ──

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.12.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - esdata:/usr/share/elasticsearch/data

  logstash:
    image: docker.elastic.co/logstash/logstash:8.12.0
    volumes:
      - ./docker/elk/logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.12.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  pgdata:
  esdata:
```

---

## 🚀 Getting Started

```bash
# 1. Clone & install
git clone https://github.com/your-org/travelmind-api.git
cd travelmind-api
npm install

# 2. Setup environment
cp .env.example .env.development

# 3. Start infrastructure
docker compose up -d postgres redis rabbitmq elasticsearch logstash kibana

# 4. Run migrations & seed
npx prisma migrate dev
npx prisma db seed

# 5. Start development server
npm run start:dev

# 6. Access services
# API:          http://localhost:3000
# Swagger:      http://localhost:3000/api/docs
# RabbitMQ UI:  http://localhost:15672  (guest/guest)
# Kibana:       http://localhost:5601
# Elasticsearch: http://localhost:9200
```

---

## 📜 npm Scripts

```json
{
  "start:dev": "nest start --watch",
  "start:debug": "nest start --debug --watch",
  "start:prod": "node dist/main",
  "build": "nest build",
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:e2e": "jest --config test/jest-e2e.config.ts",
  "lint": "eslint \"{src,test}/**/*.ts\" --fix",
  "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
  "prisma:migrate": "prisma migrate dev",
  "prisma:generate": "prisma generate",
  "prisma:seed": "ts-node prisma/seed.ts",
  "prisma:studio": "prisma studio",
  "docker:up": "docker compose up -d",
  "docker:down": "docker compose down"
}
```

---

## 🔮 AI Service (Separate Python Project)

Phần AI/LLM được tách thành **project riêng** vì:
- Python ecosystem cho ML/AI mạnh hơn (LangChain, sentence-transformers, etc.)
- Khác lifecycle deploy (GPU instance vs CPU)
- Team khác có thể phát triển song song

```
travelmind-ai/                   # SEPARATE REPO
├── app/
│   ├── main.py                  # FastAPI server
│   ├── embeddings/
│   │   └── hotel_embedder.py    # Generate text embeddings
│   ├── search/
│   │   └── vector_search.py     # pgvector similarity search
│   ├── itinerary/
│   │   └── generator.py         # LLM generate travel itinerary
│   └── scraping/
│       └── ai_extractor.py      # AI-powered data extraction
├── Dockerfile
└── requirements.txt
```

**Giao tiếp**:
- NestJS → Python AI: REST API (`POST /ai/embeddings`, `POST /ai/itinerary`, `POST /ai/chat`)
- Python AI → NestJS: RabbitMQ events (`review.embedding.completed`, `hotel.enriched`)
- **AI Chat**: `POST /ai/chat` sử dụng LangGraph agent với SSE streaming. Hỗ trợ `conversation_id` để checkpointing và tiếp tục hội thoại

---

## 📋 API Endpoints Overview

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Public | Đăng ký tài khoản |
| `POST` | `/auth/login` | Public | Đăng nhập, nhận JWT |
| `POST` | `/auth/refresh` | Refresh Token | Refresh access token |
| `GET` | `/users/me` | User | Thông tin user hiện tại |
| `PATCH` | `/users/me` | User | Cập nhật profile |
| `GET` | `/hotels` | Public | Danh sách hotels (search, filter, pagination) |
| `GET` | `/hotels/:id` | Public | Chi tiết hotel |
| `GET` | `/hotels/nearby` | Public | Hotels gần vị trí (lat, lng, radius) |
| `POST` | `/hotels` | Admin | Tạo hotel mới |
| `PATCH` | `/hotels/:id` | Admin/Owner | Cập nhật hotel |
| `GET` | `/hotels/:id/rooms` | Public | Danh sách rooms + availability |
| `POST` | `/bookings` | User | Đặt phòng |
| `GET` | `/bookings` | User | Lịch sử booking của user |
| `GET` | `/bookings/:id` | User | Chi tiết booking |
| `PATCH` | `/bookings/:id/cancel` | User | Hủy booking |
| `POST` | `/payments/initiate/:bookingId` | User | Initiate LianLian Bank payment |
| `POST` | `/payments/confirm/:transactionId` | User | Confirm LianLian Bank payment |
| `GET` | `/reviews?hotelId=x` | Public | Reviews của hotel |
| `POST` | `/reviews` | User | Viết review (đã từng booking) |
| `GET` | `/search` | Public | Full-text search (Elasticsearch) |
| `GET` | `/chat/conversations` | User | Danh sach hoi thoai AI |
| `GET` | `/chat/conversations/:id` | User | Chi tiet hoi thoai + messages |
| `DELETE` | `/chat/conversations/:id` | User | Xoa hoi thoai |
| `WS` | `/chat` (Socket.io) | User | Real-time AI chat |
| `GET` | `/health` | Public | Health check |
