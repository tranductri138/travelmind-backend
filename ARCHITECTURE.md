# TravelMind Backend - Giai Thich Chi Tiet Kien Truc & Code

> File nay giai thich tuong minh tung module, tung file, code lam gi, hoat dong nhu the nao,
> du lieu chay tu dau den dau, event/queue lang nghe va gui nhu the nao.

---

## Muc Luc

1. [Tong Quan Kien Truc](#1-tong-quan-kien-truc)
2. [Luong Khoi Dong Ung Dung](#2-luong-khoi-dong-ung-dung)
3. [Vong Doi 1 Request (Request Lifecycle)](#3-vong-doi-1-request)
4. [He Thong Event — EventEmitter2 → RabbitMQ → AI Service](#4-he-thong-event)
5. [Core Module — Ha Tang Dung Chung](#5-core-module)
6. [Shared Module — Guard, Interceptor, Filter, Decorator, Pipe](#6-shared-module)
7. [Auth Module — Dang Ky, Dang Nhap, JWT](#7-auth-module)
8. [User Module — Quan Ly Profile](#8-user-module)
9. [Hotel Module — CRUD Khach San](#9-hotel-module)
10. [Room Module — Phong & Availability](#10-room-module)
11. [Booking Module — Dat Phong & Saga Pattern](#11-booking-module)
12. [Payment Module — Stripe Thanh Toan](#12-payment-module)
13. [Review Module — Danh Gia & Rating](#13-review-module)
14. [Search Module — Elasticsearch & AI Semantic](#14-search-module)
15. [Notification Module — Email & Push](#15-notification-module)
16. [Crawler Module — Web Scraping](#16-crawler-module)
17. [Database Schema (Prisma)](#17-database-schema)
18. [Luong Nghiep Vu Chinh (Business Flows)](#18-luong-nghiep-vu-chinh)
19. [So Do Tong Quan Ket Noi](#19-so-do-tong-quan-ket-noi)

---

## 1. Tong Quan Kien Truc

TravelMind Backend la **NestJS API server**, chiu trach nhiem:
- Quan ly toan bo du lieu (hotel, user, booking, room, review, payment)
- Xac thuc va phan quyen (JWT + Passport)
- Thanh toan qua Stripe
- Tim kiem full-text qua Elasticsearch
- Proxy semantic search sang AI service
- Gui event sang AI service qua RabbitMQ de dong bo embedding

```
┌─────────────────────────────────────────────────────────────────┐
│                     NestJS Backend (Port 3000)                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    src/app.module.ts                        │  │
│  │                                                            │  │
│  │  ┌──────────┐  ┌────────────────┐  ┌──────────────────┐   │  │
│  │  │  Core    │  │  Shared        │  │  Feature Modules │   │  │
│  │  │  Module  │  │  Module        │  │                  │   │  │
│  │  │          │  │                │  │  Auth   Hotel    │   │  │
│  │  │ Config   │  │ Guards         │  │  User   Room     │   │  │
│  │  │ Prisma   │  │ Interceptors   │  │  Booking Payment │   │  │
│  │  │ Cache    │  │ Filters        │  │  Review  Search  │   │  │
│  │  │ Logger   │  │ Decorators     │  │  Notification    │   │  │
│  │  │ Health   │  │ Middleware     │  │  Crawler         │   │  │
│  │  │ RabbitMQ │  │ Pipes          │  │                  │   │  │
│  │  └──────────┘  └────────────────┘  └──────────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│         │              │              │           │               │
│    PostgreSQL       Redis        RabbitMQ    Elasticsearch       │
│    (Prisma ORM)    (Cache)      (Events)    (Full-text)          │
└─────────────────────────────────────────────────────────────────┘
          │                           │
          │                    ┌──────▼──────┐
          │                    │  AI Service │ (Python FastAPI)
          │                    │  Port 8000  │
          └───── shared DB ───→│             │
                               │  Qdrant     │ (Vector DB)
                               └─────────────┘
```

**Cau truc thu muc:**
```
src/
├── main.ts              ← Entry point: tao app, cau hinh, listen port
├── app.module.ts        ← Root module: import tat ca modules
├── core/                ← Ha tang dung chung (global)
│   ├── config/          ← 8 file config: app, database, jwt, redis, rabbitmq, stripe, elk, ai
│   ├── database/        ← PrismaService (ORM), PrismaHealthIndicator
│   ├── cache/           ← CacheService (Redis backend)
│   ├── logger/          ← LoggerService (JSON structured logs)
│   ├── health/          ← GET /health endpoint
│   └── queue/           ← RabbitMQService + EventBridgeService
├── shared/              ← Dung chung (guard, interceptor, filter, ...)
│   ├── guards/          ← JwtAuthGuard, RolesGuard
│   ├── interceptors/    ← Transform, Logging, Timeout, Serialize, Cache
│   ├── filters/         ← GlobalException, PrismaException, Validation
│   ├── decorators/      ← @Public, @Roles, @Auth, @CurrentUser, @CacheTTL
│   ├── middleware/       ← CorrelationId, RequestLogger
│   ├── pipes/           ← ParseDate, ParseSort
│   ├── constants/       ← Queue names, cache keys, app constants
│   ├── dto/             ← Pagination, ApiResponse
│   ├── utils/           ← Hash, Slug, Date
│   └── interfaces/      ← BaseService, Pagination types
└── modules/             ← Business logic (10 feature modules)
    ├── auth/            ← Register, login, JWT, Passport strategies
    ├── user/            ← Profile CRUD
    ├── hotel/           ← Hotel CRUD + search + nearby
    ├── room/            ← Room CRUD + availability management
    ├── booking/         ← Booking CRUD + Saga pattern
    ├── payment/         ← Stripe PaymentIntent + webhook
    ├── review/          ← Review CRUD + rating aggregation
    ├── search/          ← Elasticsearch + AI semantic proxy
    ├── notification/    ← Email + push (template-based)
    └── crawler/         ← Trigger web scraping jobs
```

**Pattern: FEATURE-MODULE** (khong phai MVC)
Moi module tu chua day du: controller / service / repository / dto / events / consumers.
Module nay khong phu thuoc vao module khac (tru shared/core).

---

## 2. Luong Khoi Dong Ung Dung

### 2.1. main.ts — Entry Point

File: `src/main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();                                    // Cho phep cross-origin
  app.setGlobalPrefix('api', { exclude: ['health'] }); // Moi route bat dau /api/
  app.useGlobalPipes(new ValidationPipe({              // Validate DTO toan cuc
    whitelist: true,           // Bo field khong khai bao trong DTO
    forbidNonWhitelisted: true,// Loi neu gui field la
    transform: true,           // Tu dong convert "123" → 123
  }));

  // Swagger docs tai /api/docs
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
```

**Giai thich tung dong:**
- `enableCors()` — Frontend o port 5173 goi Backend port 3000, can CORS
- `setGlobalPrefix('api')` — Tat ca route them prefix `/api/`. VD: `@Controller('hotels')` → URL la `/api/hotels`
- `exclude: ['health']` — Rieng `/health` khong co prefix (de load balancer check)
- `whitelist: true` — Gui `{ name: "abc", hack: "sql" }` → field `hack` bi loai bo tu dong
- `forbidNonWhitelisted: true` — Hoac tra loi 400 neu gui field la

### 2.2. app.module.ts — Root Module

File: `src/app.module.ts`

```typescript
@Module({
  imports: [
    CoreModule,                                        // 1. Ha tang (config, DB, cache, logger, queue)
    EventEmitterModule.forRoot(),                      // 2. Event bus noi bo (in-memory)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), // 3. Rate limit: 100 req/phut
    SharedModule,                                      // 4. Guards, filters, interceptors
    AuthModule,                                        // 5-14. Feature modules
    UserModule,
    HotelModule,
    RoomModule,
    BookingModule,
    PaymentModule,
    ReviewModule,
    SearchModule,
    NotificationModule,
    CrawlerModule,
  ],
})
export class AppModule {}
```

**Thu tu import quan trong:**
1. `CoreModule` phai di dau — cung cap PrismaService, ConfigService cho tat ca module khac
2. `EventEmitterModule` — tao event bus, cac service dung `eventEmitter.emit()` de gui event
3. `ThrottlerModule` — chong DDoS, 1 IP chi goi 100 request trong 60 giay
4. `SharedModule` — dang ky guards/filters/interceptors GLOBAL
5. Feature modules — moi module doc lap, tu dang ky controller/service cua minh

---

## 3. Vong Doi 1 Request

Khi browser gui 1 request (VD: `POST /api/hotels`), no di qua cac layer theo thu tu:

```
Browser: POST /api/hotels { name: "Grand Palace" }
    │
    ▼
┌─ MIDDLEWARE (chay dau tien, moi request) ──────────────────────┐
│                                                                 │
│  1. CorrelationIdMiddleware                                     │
│     → Doc X-Correlation-ID tu header                            │
│     → Chua co → tao UUID moi: "a1b2c3d4-..."                   │
│     → Gan vao request de trace across services                  │
│                                                                 │
│  2. RequestLoggerMiddleware                                     │
│     → Log: "→ POST /api/hotels"                                 │
│     → Hook response.on('finish') → log: "← 201 45ms"           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  GUARDS (kiem tra quyen truy cap) ──────────────────────────────│
│                                                                 │
│  1. JwtAuthGuard (APP_GUARD — moi route)                        │
│     → Route co @Public()? → co → bo qua, cho qua               │
│     → Khong co → doc Bearer token tu Authorization header       │
│       → jwt.verify(token, secret) → lay { sub, email, role }   │
│       → Query user tu DB, gan vao request.user                  │
│       → Token sai → 401 Unauthorized                            │
│                                                                 │
│  2. RolesGuard (APP_GUARD — moi route)                          │
│     → Route co @Roles('ADMIN')? → kiem tra request.user.role    │
│     → Khong co @Roles → cho qua (moi authenticated user)       │
│     → Sai role → 403 Forbidden                                  │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  PIPES (validate + transform data) ────────────────────────────│
│                                                                 │
│  ValidationPipe (global):                                       │
│  → Dung class-validator de validate DTO                         │
│  → CreateHotelDto yeu cau: name (string), stars (1-5)           │
│  → Gui { name: "", stars: 99 } → 400 Bad Request               │
│  → Gui { name: "abc", hack: "sql" } → field hack bi loai bo    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  CONTROLLER (nhan request, goi service) ───────────────────────│
│                                                                 │
│  HotelController.create(dto):                                   │
│  → Nhan DTO da validate                                         │
│  → Goi hotelService.create(dto)                                 │
│  → Return ket qua                                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  INTERCEPTORS (xu ly response) ────────────────────────────────│
│                                                                 │
│  1. LoggingInterceptor → Log: "POST /api/hotels 201 45ms"      │
│  2. TimeoutInterceptor → Qua 10s → 408 Timeout                 │
│  3. TransformInterceptor → Wrap: { success: true, data: {...} } │
│  4. SerializeInterceptor → Loai bo: password, refreshToken      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│  EXCEPTION FILTERS (bat loi, tra response loi) ────────────────│
│                                                                 │
│  Neu bat ky layer nao throw exception:                          │
│  1. PrismaExceptionFilter                                       │
│     → P2002 (unique) → 409 "Email da ton tai"                   │
│     → P2025 (not found) → 404 "Hotel khong tim thay"            │
│  2. ValidationExceptionFilter → 400 { errors: [...] }           │
│  3. GlobalExceptionFilter → 500 (loi khong xac dinh)            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    Response gui ve browser:
                    { success: true, data: { id: "...", name: "Grand Palace" } }
```

---

## 4. He Thong Event

Day la phan **QUAN TRONG NHAT** de hieu cach Backend giao tiep voi AI service.

### 4.1. Tong Quan

Backend dung **2 tang event**:

```
Tang 1: EventEmitter2 (in-memory, cung process Node.js)
  │
  │  HotelService.create() → eventEmitter.emit('hotel.created', { hotelId, name, city })
  │
  ▼
Tang 2: EventBridgeService (cau noi → RabbitMQ)
  │
  │  @OnEvent('hotel.created') → query DB lay full data → publish len RabbitMQ
  │
  ▼
Tang 3: RabbitMQ (message broker, cross-service)
  │
  │  Exchange "travelmind" (topic) → route message toi queue
  │
  ▼
Tang 4: AI Service (Python) consume message tu queue
```

### 4.2. Tai Sao Can 2 Tang?

**Van de:** Khi HotelService tao hotel, no emit event voi **it data** (chi co hotelId, name, city).
Nhung AI service can **DAY DU** data (description, amenities, images, stars, rating, ...).

**Giai phap:** EventBridgeService lang nghe event noi bo, **query lai DB** de lay full data,
roi moi gui len RabbitMQ.

```
HotelService                     EventBridge                    RabbitMQ → AI
     │                                │                              │
     │─ emit('hotel.created', {       │                              │
     │    hotelId: "abc",             │                              │
     │    name: "Grand Palace",       │                              │
     │    city: "HCMC"                │                              │
     │  })                            │                              │
     │                                │                              │
     │                          @OnEvent('hotel.created')            │
     │                                │                              │
     │                          Query DB: prisma.hotel.findUnique    │
     │                          Lay: description, amenities,         │
     │                               images, stars, rating, ...      │
     │                                │                              │
     │                          Convert camelCase → snake_case       │
     │                          (Python dung snake_case)              │
     │                                │                              │
     │                          rabbitmq.publish('hotel.created', {  │
     │                            id: "abc",                     ────│──→ AI consume
     │                            name: "Grand Palace",              │
     │                            description: "Luxury hotel...",    │
     │                            city: "HCMC",                      │
     │                            contact_email: "info@...",  ← snake_case
     │                            amenities: ["Pool", "Spa"],        │
     │                            stars: 5,                          │
     │                            ...                                │
     │                          })                                   │
```

### 4.3. EventBridgeService Chi Tiet

File: `src/core/queue/event-bridge.service.ts`

Service nay co **8 handler**, moi handler lang nghe 1 event:

```
┌─────────────────────┬───────────────────────────────┬────────────────────────────┐
│ Event               │ Emit tu dau                    │ EventBridge lam gi          │
├─────────────────────┼───────────────────────────────┼────────────────────────────┤
│ hotel.created       │ HotelService.create()         │ Query hotel → publish full  │
│ hotel.updated       │ HotelService.update()         │ Query hotel → publish full  │
│ hotel.deleted       │ HotelService.delete/hardDelete│ Publish { id, permanent }  │
│ booking.created     │ BookingService.create()       │ Query booking+room+hotel   │
│ booking.confirmed   │ PaymentService webhook        │ Query booking+room+hotel   │
│ booking.cancelled   │ BookingService.cancel()       │ Query booking+room+hotel   │
│ review.created      │ ReviewService.create()        │ Query review → publish     │
│ review.deleted      │ ReviewService.delete()        │ Publish { id, hotel_id }   │
└─────────────────────┴───────────────────────────────┴────────────────────────────┘
```

**Vi du handler `booking.created`:**
```typescript
@OnEvent('booking.created')
async onBookingCreated(event: { bookingId, userId, roomId, checkIn, checkOut }) {
  // Event goc chi co IDs → query DB lay FULL data
  const booking = await this.prisma.booking.findUnique({
    where: { id: event.bookingId },
    include: { room: { include: { hotel: true } } },  // JOIN room + hotel
  });

  // Gui len RabbitMQ voi snake_case keys (cho Python consumer)
  await this.rabbitmq.publish('booking.created', {
    id: booking.id,
    user_id: booking.userId,           // camelCase → snake_case
    room_id: booking.roomId,
    hotel_id: booking.room.hotelId,
    hotel_name: booking.room.hotel.name,
    room_name: booking.room.name,
    check_in: booking.checkIn,
    check_out: booking.checkOut,
    total_price: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
  });
}
```

### 4.4. RabbitMQService Chi Tiet

File: `src/core/queue/rabbitmq.service.ts`

Dung thu vien: `amqp-connection-manager` (tu dong reconnect khi mat ket noi).

```typescript
async onModuleInit() {
  // 1. Ket noi toi RabbitMQ server
  this.connection = connect(['amqp://guest:guest@localhost:5672']);

  // 2. Tao channel voi auto-setup
  this.channel = this.connection.createChannel({
    json: true,  // tu dong JSON.stringify/parse
    setup: async (ch) => {
      // 3. Tao exchange "travelmind" kieu TOPIC
      await ch.assertExchange('travelmind', 'topic', { durable: true });
    },
  });
}
```

**Exchange la gi?** Nhu "buu dien" — nhan message va chuyen den dung queue.

**Topic exchange la gi?** Route message dua tren routing key co dau `.`:
- Routing key `hotel.created` → queue bind `hotel.created` nhan duoc
- Routing key `hotel.*` → nhan `hotel.created`, `hotel.updated`, `hotel.deleted`
- Routing key `#` → nhan tat ca message

```typescript
async publish(routingKey: string, data: unknown) {
  await this.channel.publish(
    'travelmind',           // exchange name
    routingKey,             // VD: 'hotel.created'
    data,                   // JSON data
    {
      persistent: true,     // message khong mat khi RabbitMQ restart
      contentType: 'application/json',
      timestamp: Date.now(),
    },
  );
}
```

### 4.5. RabbitMQ Bindings (AI Service Phia Nhan)

AI service (Python) tao cac queue va bind vao exchange:

```
Exchange "travelmind" (topic)
     │
     │── routing key: hotel.created ────→ Queue "ai.hotel.created" ────→ embed hotel
     │── routing key: hotel.updated ────→ Queue "ai.hotel.updated" ────→ re-embed hotel
     │── routing key: hotel.deleted ────→ Queue "ai.hotel.deleted" ────→ xoa embedding
     │── routing key: review.created ──→ Queue "ai.review.created" ───→ embed review
     │── routing key: review.deleted ──→ Queue "ai.review.deleted" ───→ xoa embedding
     │── routing key: booking.created ─→ Queue "ai.booking.created" ──→ embed booking
     │── routing key: booking.confirmed→ Queue "ai.booking.confirmed"→ update embedding
     │── routing key: booking.cancelled→ Queue "ai.booking.cancelled"→ xoa embedding
     │── routing key: crawler.job ─────→ Queue "ai.crawler.job" ──────→ crawl URL
```

Moi queue co ten bat dau `ai.` de phan biet voi queue cua cac service khac.

### 4.6. Constants

File: `src/shared/constants/queue.constants.ts`

```typescript
export const EXCHANGE_NAME = 'travelmind';        // ten exchange chung
export const DLX_EXCHANGE = 'travelmind.dlx';     // dead letter exchange

export const ROUTING_KEYS = {
  HOTEL_CREATED: 'hotel.created',
  HOTEL_UPDATED: 'hotel.updated',
  HOTEL_DELETED: 'hotel.deleted',
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  REVIEW_CREATED: 'review.created',
  REVIEW_DELETED: 'review.deleted',
  CRAWLER_JOB: 'crawler.job',
  USER_REGISTERED: 'user.registered',
};
```

---

## 5. Core Module

File: `src/core/core.module.ts`

CoreModule la `@Global()` → tat ca module khac tu dong truy cap duoc cac service cua no
ma khong can import lai.

```typescript
@Global()
@Module({
  imports: [AppConfigModule, PrismaModule, AppCacheModule, LoggerModule, HealthModule, RabbitMQModule],
  exports: [AppConfigModule, PrismaModule, AppCacheModule, LoggerModule, RabbitMQModule],
})
export class CoreModule {}
```

### 5.1. Config (src/core/config/)

8 file config, moi file dung `registerAs()` de tao namespace:

| File | Namespace | VD su dung |
|------|-----------|------------|
| `app.config.ts` | `app` | `config.get('app.port')` → 3000 |
| `database.config.ts` | `database` | `config.get('database.url')` |
| `jwt.config.ts` | `jwt` | `config.get('jwt.accessSecret')` |
| `redis.config.ts` | `redis` | `config.get('redis.host')` → localhost |
| `rabbitmq.config.ts` | `rabbitmq` | `config.get('rabbitmq.url')` |
| `stripe.config.ts` | `stripe` | `config.get('stripe.secretKey')` |
| `elk.config.ts` | `elk` | `config.get('elk.url')` |
| `ai.config.ts` | `ai` | `config.get('ai.serviceUrl')` → http://localhost:8000 |

`config.module.ts` dang ky tat ca + Joi validation:
```typescript
validationSchema: Joi.object({
  DATABASE_URL: Joi.string().required(),       // bat buoc
  REDIS_HOST: Joi.string().default('localhost'),// co default
  AI_SERVICE_URL: Joi.string().default('http://localhost:8000'),
  ...
})
```
Neu thieu bien bat buoc (VD: DATABASE_URL) → app khong start duoc, log loi ro rang.

### 5.2. Database (src/core/database/)

**prisma.service.ts:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() { await this.$connect(); }      // ket noi DB khi app start
  async onModuleDestroy() { await this.$disconnect(); } // ngat khi app tat
}
```
Prisma la ORM — viet query bang TypeScript thay vi SQL.
VD: `prisma.hotel.findMany({ where: { city: 'HCMC' } })` → `SELECT * FROM hotels WHERE city = 'HCMC'`

**prisma.health.ts:** — Chay `SELECT 1` de kiem tra DB con song. Dung boi HealthModule.

### 5.3. Cache (src/core/cache/)

```typescript
@Injectable()
export class CacheService {
  async get<T>(key: string): Promise<T | null>           // lay tu Redis
  async set(key: string, value: unknown, ttl = 60): void // luu, mac dinh 60 giay
  async del(key: string): void                            // xoa
}
```
Backend: Redis. Dung de cache ket qua query DB, giam tai cho PostgreSQL.

### 5.4. Logger (src/core/logger/)

```typescript
// Output JSON format:
{
  "timestamp": "2026-02-28T10:00:00.000Z",
  "level": "log",
  "message": "Hotel created: abc-123",
  "service": "travelmind-api",
  "environment": "development",
  "context": "HotelService"
}
```
JSON logs de Logstash/ELK thu thap va hien thi tren Kibana dashboard.

### 5.5. Health (src/core/health/)

```typescript
@Public()                    // khong can auth
@Controller()
export class HealthController {
  @Get('health')             // GET /health (khong co prefix /api)
  check() {
    return this.health.check([
      () => this.prismaHealth.isHealthy('database'),
    ]);
  }
}
```
Response: `{ status: "ok", info: { database: { status: "up" } } }`
Dung boi Docker healthcheck va load balancer.

### 5.6. Queue — RabbitMQ (src/core/queue/)

Da giai thich chi tiet o muc 4. Tom tat 3 file:

| File | Chuc nang |
|------|-----------|
| `rabbitmq.service.ts` | Ket noi AMQP, assertExchange, publish message |
| `event-bridge.service.ts` | @OnEvent() → query DB → publish len RabbitMQ |
| `consumers/base.consumer.ts` | Abstract class voi handleWithRetry() |

---

## 6. Shared Module

File: `src/shared/shared.module.ts`

Dang ky GLOBAL providers va middleware:

```typescript
@Module({
  providers: [
    // Exception Filters (bat loi)
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
    { provide: APP_FILTER, useClass: ValidationExceptionFilter },

    // Interceptors (xu ly response)
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SerializeInterceptor },
  ],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*path');  // ap dung cho MOI route
  }
}
```

### 6.1. Decorators (src/shared/decorators/)

| Decorator | Gan len dau | Tac dung |
|-----------|-------------|----------|
| `@Public()` | Route | JwtAuthGuard bo qua, khong can dang nhap |
| `@Roles('ADMIN')` | Route | RolesGuard kiem tra role |
| `@Auth('ADMIN')` | Route | Ket hop @Roles + @UseGuards + @ApiBearerAuth |
| `@CurrentUser()` | Parameter | Lay user tu request: `@CurrentUser() user` → { id, email, role } |
| `@CurrentUser('id')` | Parameter | Chi lay 1 field: `userId` |
| `@CacheTTL(300)` | Route | SmartCacheInterceptor cache 300 giay |
| `@ApiPaginated()` | Route | Swagger them query params page/limit |

**Vi du su dung ket hop:**
```typescript
@Auth('ADMIN')                    // Chi admin
@Post()                           // POST /api/hotels
create(
  @Body() dto: CreateHotelDto,    // Body da validate
  @CurrentUser('id') userId: string, // Lay userId tu JWT
) {
  return this.hotelService.create(dto);
}
```

### 6.2. Guards (src/shared/guards/)

**JwtAuthGuard** — Dang ky APP_GUARD, chay MOI route:
```typescript
canActivate(context) {
  const isPublic = this.reflector.get<boolean>(IS_PUBLIC_KEY, context.getHandler());
  if (isPublic) return true;  // @Public() → bo qua

  return super.canActivate(context); // Passport JWT verify
}
```

**RolesGuard** — Dang ky APP_GUARD, chay MOI route:
```typescript
canActivate(context) {
  const roles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
  if (!roles) return true;   // Khong co @Roles() → cho qua

  const user = context.switchToHttp().getRequest().user;
  return roles.includes(user.role); // user.role trong list yeu cau → OK
}
```

**Ket hop Guard xac dinh quyen:**
```
Route khong co decorator        → can JWT, moi role OK
Route co @Public()              → khong can JWT, ai cung vao
Route co @Roles('ADMIN')        → can JWT + phai la ADMIN
Route co @Auth('ADMIN','OWNER') → can JWT + phai la ADMIN hoac HOTEL_OWNER
```

### 6.3. Interceptors (src/shared/interceptors/)

**TransformInterceptor** — Wrap response thanh format chuan:
```typescript
// Truoc: { id: "abc", name: "Grand Palace" }
// Sau:   { success: true, data: { id: "abc", name: "Grand Palace" } }

// Neu response co truong meta (pagination):
// { success: true, data: [...], meta: { total: 100, page: 1, limit: 10, totalPages: 10 } }
```

**LoggingInterceptor** — Log thoi gian xu ly:
```
[HotelController] POST /api/hotels 201 — 45ms
```

**TimeoutInterceptor** — 10 giay timeout:
```typescript
return next.handle().pipe(timeout(10000)); // 10s → 408 Request Timeout
```

**SerializeInterceptor** — Loai field nhi cam:
```typescript
// Loai bo: password, refreshToken tu response
// User { id, email, password, refreshToken } → User { id, email }
```

### 6.4. Exception Filters (src/shared/filters/)

| Filter | Bat loi gi | Response |
|--------|-----------|----------|
| PrismaExceptionFilter | P2002 unique violation | 409 "Email da ton tai" |
| | P2025 record not found | 404 "Khong tim thay" |
| | P2003 foreign key | 400 "ID khong hop le" |
| ValidationExceptionFilter | DTO validation fail | 400 { errors: ["name required"] } |
| GlobalExceptionFilter | Moi loi khac | 500 + log stack trace |

### 6.5. Utils (src/shared/utils/)

**hash.util.ts:**
```typescript
hashPassword("Admin123!")  → "$2b$10$xYz..." (bcrypt, SALT_ROUNDS=10)
comparePassword("Admin123!", "$2b$10$xYz...") → true
```

**slug.util.ts:**
```typescript
generateSlug("Khách sạn Grand Sài Gòn") → "khach-san-grand-sai-gon"
// Bo dau tieng Viet, lowercase, thay space bang -
```

**date.util.ts:**
```typescript
daysBetween(new Date('2026-03-15'), new Date('2026-03-20')) → 5
isDateInPast(new Date('2025-01-01')) → true
```

### 6.6. DTOs Dung Chung (src/shared/dto/)

**PaginationQueryDto** — Moi route co pagination kế thừa DTO nay:
```typescript
class PaginationQueryDto {
  page: number = 1;        // min: 1
  limit: number = 10;      // min: 1, max: 100
  get skip() { return (this.page - 1) * this.limit; }  // tinh offset cho DB
}
```

**PaginatedResponseDto** — Format response phan trang:
```typescript
{
  data: Hotel[],
  meta: { total: 150, page: 2, limit: 10, totalPages: 15 }
}
```

---

## 7. Auth Module

File: `src/modules/auth/`

### 7.1. Cau Truc File

```
auth/
├── auth.module.ts              ← Dang ky module + APP_GUARD
├── auth.controller.ts          ← 4 routes
├── auth.service.ts             ← Business logic
├── strategies/
│   ├── jwt.strategy.ts         ← Xac thuc Access Token
│   ├── jwt-refresh.strategy.ts ← Xac thuc Refresh Token
│   └── local.strategy.ts      ← Xac thuc email + password
└── dto/
    ├── register.dto.ts         ← email, password, firstName, lastName
    ├── login.dto.ts            ← email, password
    └── token-response.dto.ts   ← accessToken, refreshToken, expiresIn
```

### 7.2. Routes

| Method | Path | Guard | Mo ta |
|--------|------|-------|-------|
| POST | `/api/auth/register` | @Public | Dang ky tai khoan moi |
| POST | `/api/auth/login` | @Public + LocalStrategy | Dang nhap |
| POST | `/api/auth/refresh` | JwtRefreshStrategy | Lam moi token |
| POST | `/api/auth/logout` | JWT (default) | Dang xuat |

### 7.3. Flow Dang Ky

```
POST /api/auth/register { email, password, firstName, lastName }
    │
    ├─ RegisterDto validate:
    │   - email: phai la email hop le
    │   - password: 8-50 ky tu
    │   - firstName, lastName: bat buoc
    │
    ├─ AuthService.register():
    │   1. Kiem tra email chua ton tai → 409 neu trung
    │   2. hashPassword("Admin123!") → "$2b$10$..."
    │   3. prisma.user.create({ email, password: hash, firstName, lastName })
    │   4. Tao cap JWT:
    │      - accessToken (15 phut): { sub: userId, email, role }
    │      - refreshToken (7 ngay): { sub: userId, email, role }
    │   5. Hash refreshToken va luu vao DB (de verify khi refresh)
    │
    └─ Response: { accessToken: "eyJ...", refreshToken: "eyJ...", expiresIn: "15m" }
```

### 7.4. Flow Dang Nhap

```
POST /api/auth/login { email, password }
    │
    ├─ LocalStrategy.validate(email, password):
    │   1. Tim user theo email
    │   2. comparePassword(password, user.password) → true/false
    │   3. Sai → 401 Unauthorized
    │   4. Dung → return user (khong co password)
    │
    ├─ AuthService.login(user):
    │   1. Tao cap JWT moi
    │   2. Luu hash refreshToken vao DB
    │
    └─ Response: { accessToken, refreshToken, expiresIn }
```

### 7.5. Flow Refresh Token

```
POST /api/auth/refresh (Bearer: refresh token cu)
    │
    ├─ JwtRefreshStrategy.validate(payload):
    │   1. Verify JWT bang refreshSecret
    │   2. Tim user, kiem tra co refreshToken trong DB
    │
    ├─ AuthService.refreshTokens(userId, refreshToken):
    │   1. So sanh refreshToken voi hash trong DB
    │   2. Sai → 403 "Invalid refresh token"
    │   3. Dung → tao cap token MOI, luu hash moi
    │
    └─ Response: { accessToken (moi), refreshToken (moi) }
```

### 7.6. 3 Passport Strategies

| Strategy | Khi nao dung | Verify cai gi |
|----------|-------------|---------------|
| `LocalStrategy` | POST /login | email + password (bcrypt compare) |
| `JwtStrategy` | Moi route (APP_GUARD) | Access token (15 phut) |
| `JwtRefreshStrategy` | POST /refresh | Refresh token (7 ngay) |

### 7.7. Global Guards (Dang Ky Trong AuthModule)

```typescript
// auth.module.ts
providers: [
  { provide: APP_GUARD, useClass: JwtAuthGuard },  // chay MOI route
  { provide: APP_GUARD, useClass: RolesGuard },     // chay MOI route
]
```

Dieu nay co nghia: **MAC DINH moi route deu can dang nhap**.
Muon route public phai danh dau `@Public()`.

---

## 8. User Module

File: `src/modules/user/`

```
user/
├── user.module.ts
├── user.controller.ts    ← 3 routes: GET/PATCH/DELETE /users/me
├── user.service.ts       ← findById, updateProfile, delete
├── user.repository.ts    ← Prisma queries
├── dto/
│   ├── update-user.dto.ts    ← firstName, lastName, phone, avatar
│   └── user-response.dto.ts  ← Exclude password
└── events/
    └── user-registered.event.ts  ← (dinh nghia nhung chua dung)
```

**Routes:**
| Method | Path | Mo ta |
|--------|------|-------|
| GET | `/api/users/me` | Xem profile cua minh |
| PATCH | `/api/users/me` | Sua firstName, lastName, phone, avatar |
| DELETE | `/api/users/me` | Xoa tai khoan (hard delete) |

Tat ca route dung `@CurrentUser('id')` de lay userId tu JWT.
User chi thao tac tren chinh minh, khong can truyen ID qua URL.

---

## 9. Hotel Module

File: `src/modules/hotel/`

```
hotel/
├── hotel.module.ts
├── hotel.controller.ts     ← 7 routes
├── hotel.service.ts        ← Business logic + emit events
├── hotel.repository.ts     ← Prisma queries + raw SQL geo
├── dto/
│   ├── create-hotel.dto.ts ← name, description, address, city, country, stars, amenities...
│   ├── update-hotel.dto.ts ← PartialType(Create) — tat ca field optional
│   ├── search-hotel.dto.ts ← q, city, country, minStars, minRating, amenities, sortBy
│   ├── nearby-query.dto.ts ← lat, lng, radius
│   └── hotel-response.dto.ts
├── events/
│   ├── hotel-created.event.ts   ← { hotelId, name, city }
│   ├── hotel-updated.event.ts   ← { hotelId, name, city }
│   ├── hotel-deleted.event.ts   ← { hotelId, permanent }
│   └── hotel-price-updated.event.ts ← (dinh nghia, chua dung)
└── consumers/
    ├── hotel-indexing.consumer.ts  ← (stub, chi log)
    └── price-sync.consumer.ts     ← (stub, chi log)
```

### 9.1. Routes

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| GET | `/api/hotels` | @Public | Tim kiem hotel (pagination + filters) |
| GET | `/api/hotels/nearby` | @Public | Hotel gan vi tri (geo-query) |
| GET | `/api/hotels/:id` | @Public | Chi tiet hotel + rooms |
| POST | `/api/hotels` | @Auth(ADMIN) | Tao hotel moi |
| PATCH | `/api/hotels/:id` | @Auth(ADMIN, HOTEL_OWNER) | Sua hotel |
| DELETE | `/api/hotels/:id` | @Auth(ADMIN) | Soft delete (isActive=false) |
| DELETE | `/api/hotels/:id/permanent` | @Auth(ADMIN) | Hard delete (xoa DB) |

### 9.2. Tim Kiem Hotel (GET /api/hotels)

SearchHotelDto ho tro nhieu filter:
```typescript
GET /api/hotels?q=Grand&city=HCMC&minStars=4&sortBy=rating&sortOrder=desc&page=1&limit=10
```

Repository xay dung Prisma WHERE clause dong:
```typescript
where: {
  isActive: true,                                  // luon luon
  AND: [
    q ? { OR: [
      { name: { contains: q, mode: 'insensitive' } },      // Tim trong ten
      { description: { contains: q, mode: 'insensitive' } },// Tim trong mo ta
      { city: { contains: q, mode: 'insensitive' } },       // Tim trong thanh pho
    ]} : {},
    city ? { city } : {},                          // Filter chinh xac
    country ? { country } : {},
    minStars ? { stars: { gte: minStars } } : {},  // >= so sao
    minRating ? { rating: { gte: minRating } } : {},
    amenities?.length ? { amenities: { hasEvery: amenities } } : {}, // Co DU amenities
  ],
}
```

### 9.3. Hotel Gan Day (GET /api/hotels/nearby)

Dung **raw SQL** voi cong thuc **Haversine** (tinh khoang cach tren mat cau):
```sql
SELECT *, (
  6371 * acos(
    cos(radians($1)) * cos(radians(latitude)) *
    cos(radians(longitude) - radians($2)) +
    sin(radians($1)) * sin(radians(latitude))
  )
) AS distance
FROM hotels
WHERE is_active = true
HAVING distance < $3    -- trong ban kinh (km)
ORDER BY distance
LIMIT 20
```

### 9.4. Tao Hotel

```typescript
async create(dto: CreateHotelDto) {
  const slug = generateSlug(dto.name);  // "Grand Sài Gòn" → "grand-sai-gon"
  const hotel = await this.hotelRepository.create({ ...dto, slug });

  // Emit event → EventBridge → RabbitMQ → AI service tao embedding
  this.eventEmitter.emit('hotel.created', new HotelCreatedEvent(hotel.id, hotel.name, hotel.city));

  return hotel;
}
```

### 9.5. Xoa Hotel (Soft vs Hard)

**Soft delete** (DELETE /hotels/:id):
- Set `isActive = false` trong DB
- Hotel van ton tai nhung khong hien trong search
- Emit `hotel.deleted` voi `permanent: false`

**Hard delete** (DELETE /hotels/:id/permanent):
- Xoa hoan toan khoi DB (cascade xoa rooms, reviews)
- Emit `hotel.deleted` voi `permanent: true`
- AI service xoa embedding khoi Qdrant

### 9.6. Cap Nhat Rating

Khi review tao/xoa → ReviewService goi:
```typescript
async updateRating(hotelId: string) {
  // Query: AVG(rating), COUNT(*) tu bang reviews
  const result = await this.prisma.review.aggregate({
    where: { hotelId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  // Update hotel
  await this.prisma.hotel.update({
    where: { id: hotelId },
    data: { rating: result._avg.rating ?? 0, reviewCount: result._count.rating },
  });
}
```

---

## 10. Room Module

File: `src/modules/room/`

```
room/
├── room.module.ts
├── room.controller.ts    ← 5 routes
├── room.service.ts       ← CRUD + availability management
├── room.repository.ts    ← Prisma queries
└── dto/
    ├── create-room.dto.ts
    ├── check-availability.dto.ts  ← checkIn, checkOut
    └── room-response.dto.ts
```

### 10.1. Routes

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| GET | `/api/hotels/:hotelId/rooms` | @Public | Danh sach phong |
| GET | `/api/hotels/:hotelId/rooms/:roomId/availability` | @Public | Check phong trong |
| POST | `/api/rooms` | @Auth(ADMIN, OWNER) | Tao phong moi |
| DELETE | `/api/rooms/:roomId` | @Auth(ADMIN, OWNER) | Soft delete |
| DELETE | `/api/rooms/:roomId/permanent` | @Auth(ADMIN) | Hard delete |

### 10.2. Quan Ly Availability

Bang `room_availability` luu trang thai tung ngay:
```
┌──────────┬──────────────┬──────────────┐
│ room_id  │ date         │ is_available │
├──────────┼──────────────┼──────────────┤
│ room-101 │ 2026-03-15   │ false        │ ← Da co nguoi dat
│ room-101 │ 2026-03-16   │ false        │
│ room-101 │ 2026-03-17   │ true         │ ← Con trong
│ room-101 │ 2026-03-18   │ true         │
└──────────┴──────────────┴──────────────┘
```

**checkAvailability(roomId, checkIn, checkOut):**
```typescript
// Dem so ngay co isAvailable=false trong khoang [checkIn, checkOut)
const blocked = await prisma.roomAvailability.count({
  where: { roomId, date: { gte: checkIn, lt: checkOut }, isAvailable: false },
});
return blocked === 0; // true = phong trong
```

**blockDates(roomId, checkIn, checkOut):**
```typescript
// Tao list ngay: [2026-03-15, 2026-03-16, 2026-03-17]
// Upsert tung ngay: isAvailable = false
// Chay trong transaction de dam bao atomic
```

**releaseDates(roomId, checkIn, checkOut):**
```typescript
// Khi booking bi huy → tra lai cac ngay
// Update tat ca record: isAvailable = true
```

---

## 11. Booking Module

File: `src/modules/booking/`

```
booking/
├── booking.module.ts
├── booking.controller.ts    ← 5 routes
├── booking.service.ts       ← Business logic
├── booking.repository.ts    ← Prisma queries
├── saga/
│   └── booking.saga.ts     ← Saga pattern cho tao booking
├── events/
│   ├── booking-created.event.ts
│   ├── booking-confirmed.event.ts
│   └── booking-cancelled.event.ts
└── consumers/
    ├── booking-notification.consumer.ts  ← (stub)
    └── booking-analytics.consumer.ts     ← (stub)
```

### 11.1. Routes

| Method | Path | Mo ta |
|--------|------|-------|
| POST | `/api/bookings` | Dat phong (chay Saga) |
| GET | `/api/bookings` | Danh sach booking cua user |
| GET | `/api/bookings/:id` | Chi tiet (chi chu so huu) |
| PATCH | `/api/bookings/:id/cancel` | Huy booking |
| DELETE | `/api/bookings/:id` | Xoa (chi PENDING) |

### 11.2. Saga Pattern

**Tai sao can Saga?** Vi tao booking gom nhieu buoc phai thanh cong tat ca hoac fail tat ca:
1. Check phong trong
2. Tao booking
3. Tao payment
4. Khoa cac ngay

```typescript
// booking.saga.ts
async execute(params) {
  // BUOC 1: Kiem tra phong trong
  const isAvailable = await this.roomService.checkAvailability(
    params.roomId, params.checkIn, params.checkOut,
  );
  if (!isAvailable) throw new BadRequestException('Room is not available');

  // BUOC 2: Prisma Transaction (atomic — 1 fail = tat ca rollback)
  const booking = await this.prisma.$transaction(async (tx) => {
    // Tao booking (status: PENDING)
    const newBooking = await tx.booking.create({
      data: { userId, roomId, checkIn, checkOut, guests, totalPrice, status: 'PENDING' },
    });
    // Tao payment record
    await tx.payment.create({
      data: { bookingId: newBooking.id, amount: totalPrice, currency: 'USD' },
    });
    return newBooking;
  });

  // BUOC 3: Khoa ngay (sau transaction thanh cong)
  await this.roomService.blockDates(params.roomId, params.checkIn, params.checkOut);

  return booking;
}
```

### 11.3. Trang Thai Booking

```
PENDING ──(Stripe thanh toan OK)──→ CONFIRMED
PENDING ──(User huy)──────────────→ CANCELLED
CONFIRMED ──(User huy)───────────→ CANCELLED
CONFIRMED ──(Het thoi gian o)────→ COMPLETED
```

### 11.4. Huy Booking

```typescript
async cancel(id, userId) {
  const booking = await this.findById(id, userId);

  // Khong huy duoc neu da CANCELLED hoac COMPLETED
  if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
    throw new BadRequestException('Cannot cancel');
  }

  // Update trang thai
  await this.bookingRepository.updateStatus(id, 'CANCELLED');

  // Mo lai cac ngay da khoa
  await this.roomService.releaseDates(booking.roomId, booking.checkIn, booking.checkOut);

  // Emit event → EventBridge → RabbitMQ → AI xoa embedding
  this.eventEmitter.emit('booking.cancelled', new BookingCancelledEvent(...));
}
```

---

## 12. Payment Module

File: `src/modules/payment/`

```
payment/
├── payment.module.ts
├── payment.controller.ts    ← 2 routes
├── payment.service.ts       ← Stripe integration
├── stripe.provider.ts       ← Stripe client factory
└── dto/
    ├── create-payment.dto.ts
    └── payment-response.dto.ts
```

### 12.1. Routes

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| POST | `/api/payments/intent/:bookingId` | JWT | Tao Stripe PaymentIntent |
| POST | `/api/payments/webhook` | @Public | Nhan webhook tu Stripe |

### 12.2. Flow Thanh Toan Day Du

```
Browser                  Backend                      Stripe
  │                        │                            │
  │ 1. POST /bookings ───→ │                            │
  │    { roomId, dates }   │── BookingSaga ──→ DB       │
  │ ←── { bookingId } ────│                            │
  │                        │                            │
  │ 2. POST /payments/     │                            │
  │    intent/:bookingId ─→│                            │
  │                        │── stripe.paymentIntents    │
  │                        │   .create({ amount }) ───→ │
  │                        │ ←── { clientSecret } ──────│
  │ ←── { clientSecret } ──│                            │
  │                        │                            │
  │ 3. Stripe.js confirm   │                            │
  │    (dien the, submit) ─│──────────────────────────→ │
  │                        │                            │── Xu ly thanh toan
  │                        │                            │
  │                        │ 4. Webhook ←───────────────│
  │                        │    payment_intent.succeeded │
  │                        │                            │
  │                        │── Update payment: SUCCEEDED │
  │                        │── Update booking: CONFIRMED │
  │                        │── Emit 'booking.confirmed'  │
  │                        │     → EventBridge           │
  │                        │     → RabbitMQ              │
  │                        │     → AI service            │
```

**Webhook handler:**
```typescript
async handleWebhook(signature, payload) {
  // 1. Verify chu ky (chong gia mao)
  const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

  if (event.type === 'payment_intent.succeeded') {
    // 2. Tim payment theo stripePaymentId
    // 3. Update payment → SUCCEEDED, booking → CONFIRMED
    // 4. Emit 'booking.confirmed' event
    this.eventEmitter.emit('booking.confirmed', { bookingId });
  }

  if (event.type === 'payment_intent.payment_failed') {
    // Update payment → FAILED
  }
}
```

---

## 13. Review Module

File: `src/modules/review/`

```
review/
├── review.module.ts
├── review.controller.ts    ← 3 routes
├── review.service.ts       ← CRUD + rating update
├── review.repository.ts    ← Prisma queries
├── events/
│   ├── review-created.event.ts
│   └── review-deleted.event.ts
└── consumers/
    └── rating-aggregator.consumer.ts  ← (stub)
```

### 13.1. Routes

| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| GET | `/api/reviews?hotelId=xxx` | @Public | Danh sach review theo hotel |
| POST | `/api/reviews` | JWT | Tao review (1 user / 1 hotel) |
| DELETE | `/api/reviews/:id` | JWT | Xoa (chu review hoac admin) |

### 13.2. Tao Review

```typescript
async create(userId, dto: CreateReviewDto) {
  // 1. Kiem tra unique: 1 user chi review 1 hotel 1 lan
  const existing = await this.reviewRepository.findByUserAndHotel(userId, dto.hotelId);
  if (existing) throw new ConflictException('You already reviewed this hotel');

  // 2. Tao review
  const review = await this.reviewRepository.create({ ...dto, userId });

  // 3. Tinh lai rating trung binh cua hotel
  await this.hotelService.updateRating(dto.hotelId);

  // 4. Emit event → AI tao embedding cho review
  this.eventEmitter.emit('review.created', new ReviewCreatedEvent(review.id, dto.hotelId, dto.rating));

  return review;
}
```

### 13.3. Xoa Review

```typescript
async delete(id, userId, userRole) {
  const review = await this.reviewRepository.findById(id);

  // Chi chu review hoac ADMIN moi xoa duoc
  if (review.userId !== userId && userRole !== 'ADMIN') {
    throw new ForbiddenException();
  }

  await this.reviewRepository.delete(id);
  await this.hotelService.updateRating(review.hotelId); // Tinh lai rating
  this.eventEmitter.emit('review.deleted', new ReviewDeletedEvent(id, review.hotelId));
}
```

---

## 14. Search Module

File: `src/modules/search/`

```
search/
├── search.module.ts           ← Import HttpModule cho AI proxy
├── search.controller.ts       ← 2 routes
├── search.service.ts          ← ES query + AI proxy
├── elasticsearch.provider.ts  ← ES client factory
├── dto/
│   ├── search-query.dto.ts    ← q, city, country, page, limit
│   └── semantic-search.dto.ts ← query, city, country, min_stars, limit
└── indices/
    ├── hotel.index.ts         ← ES mapping
    └── review.index.ts        ← ES mapping
```

### 14.1. 2 Loai Search

| | Full-text (Elasticsearch) | Semantic (AI) |
|---|---|---|
| Route | `GET /api/search?q=beach` | `POST /api/search/semantic` |
| Cach hoat dong | Tim theo keyword match | Tim theo y nghia (vector) |
| VD | "beach" → match chu "beach" | "noi yên tĩnh gần biển" → hiểu ngữ cảnh |
| Engine | Elasticsearch | Qdrant (qua AI service) |
| Toc do | Nhanh | Cham hon (can embed query) |
| Typo | Ho tro fuzzy | Khong can — hieu ngon ngu tu nhien |

### 14.2. Full-text Search

```typescript
async searchHotels(dto: SearchQueryDto) {
  const result = await this.esClient.search({
    index: 'hotels',
    query: {
      bool: {
        must: [{
          multi_match: {
            query: dto.q,
            fields: ['name^3', 'description', 'city^2', 'address'],
            // name^3 = ten hotel duoc uu tien gap 3 lan
            // city^2 = thanh pho uu tien gap 2 lan
            fuzziness: 'AUTO',  // cho phep loi chinh ta: "hotle" → "hotel"
          },
        }],
        filter: [
          { term: { isActive: true } },
          dto.city ? { term: { city: dto.city } } : null,
        ].filter(Boolean),
      },
    },
    sort: ['_score', { rating: 'desc' }],  // relevance truoc, rating sau
  });
}
```

### 14.3. Semantic Search (Proxy Sang AI)

```typescript
async semanticSearch(dto: SemanticSearchDto) {
  // Proxy request sang AI service
  const { data } = await firstValueFrom(
    this.httpService.post(`${this.aiServiceUrl}/ai/search`, dto),
  );
  return data;
}
```

Frontend gui `{ query: "khách sạn yên tĩnh gần biển có hồ bơi" }`
→ Backend proxy toi AI `POST http://ai:8000/ai/search`
→ AI embed query thanh vector → Qdrant search → tra ve top hotels

---

## 15. Notification Module

File: `src/modules/notification/`

```
notification/
├── notification.module.ts
├── notification.service.ts    ← Load template + send
├── consumers/
│   ├── email.consumer.ts     ← Lang nghe queue email
│   └── push.consumer.ts      ← Lang nghe queue push
└── templates/
    ├── welcome.hbs            ← Template chao mung
    └── booking-confirmation.hbs ← Template xac nhan booking
```

**NotificationService:**
```typescript
// Khoi dong: load Handlebars templates tu ./templates/
onModuleInit() {
  this.loadTemplates();
}

// Gui email
sendEmail(to, template, data) {
  const html = this.templates[template](data);  // Render template voi data
  // Production: gui qua SMTP/SES
  // Dev: chi log ra console
}

// Gui push notification
sendPushNotification(userId, title, body) {
  // Production: gui qua FCM/APNs
  // Dev: chi log
}
```

---

## 16. Crawler Module

File: `src/modules/crawler/`

```
crawler/
├── crawler.module.ts
├── crawler.controller.ts    ← 2 routes (ADMIN only)
├── crawler.service.ts       ← Trigger + status
├── processors/
│   ├── price-scraper.processor.ts   ← (stub)
│   └── review-scraper.processor.ts  ← (stub)
└── consumers/
    └── crawl-job.consumer.ts  ← (stub)
```

**Routes:**
| Method | Path | Auth | Mo ta |
|--------|------|------|-------|
| POST | `/api/crawler/trigger` | @Auth(ADMIN) | Trigger scraping job |
| GET | `/api/crawler/status` | @Auth(ADMIN) | Xem trang thai crawler |

**Cach hoat dong:**
Backend chi la nguoi **trigger**. Scraping thuc te chay o AI service (Python + Playwright).

```
Admin: POST /api/crawler/trigger { url: "https://booking.com/hotel/abc" }
    │
    ├─ CrawlerService.triggerPriceCrawl()
    │   → Publish event 'crawler.job' len RabbitMQ
    │     { url: "https://...", extract_reviews: true, job_id: "xyz" }
    │
    ▼
RabbitMQ → Queue "ai.crawler.job" → AI Service
    │
    ├─ Playwright mo trinh duyet headless
    ├─ Vao trang web, doi load xong
    ├─ BeautifulSoup loc HTML → text sach
    ├─ LLM trich xuat: { name, city, stars, amenities, ... }
    ├─ Publish event 'crawler.completed' { hotel, reviews }
    │
    ▼
RabbitMQ → Backend nhan ket qua → Luu vao PostgreSQL
```

---

## 17. Database Schema

File: `prisma/schema.prisma`

```
┌──────────────┐      1:N      ┌──────────────┐
│    User      │──────────────→│   Booking    │
│              │               │              │
│ id           │      1:N      │ id           │
│ email        │──────────────→│ userId       │
│ password     │               │ roomId ──────│──┐
│ firstName    │               │ checkIn      │  │
│ lastName     │               │ checkOut     │  │
│ role (enum)  │               │ totalPrice   │  │
│ refreshToken │               │ status (enum)│  │
└──────────────┘               └──────┬───────┘  │
       │                              │           │
       │ 1:N                   1:1    │           │
       ▼                              ▼           │
┌──────────────┐               ┌──────────────┐  │
│   Review     │               │   Payment    │  │
│              │               │              │  │
│ id           │               │ id           │  │
│ userId ──────│               │ bookingId    │  │
│ hotelId ─────│──┐            │ stripePayId  │  │
│ rating       │  │            │ amount       │  │
│ title        │  │            │ status (enum)│  │
│ comment      │  │            └──────────────┘  │
└──────────────┘  │                              │
                  │                              │
┌──────────────┐  │  1:N    ┌──────────────┐     │
│    Hotel     │←─┘ ──────→│    Room      │←────┘
│              │           │              │
│ id           │           │ id           │
│ name         │           │ hotelId      │     1:N
│ slug         │           │ name         │───────────┐
│ description  │           │ type         │           │
│ city         │           │ price        │           ▼
│ country      │           │ maxGuests    │    ┌──────────────────┐
│ stars        │           │ amenities    │    │ RoomAvailability │
│ rating       │           │ isActive     │    │                  │
│ amenities[]  │           └──────────────┘    │ roomId           │
│ isActive     │                                │ date             │
└──────────────┘                                │ isAvailable      │
                                                └──────────────────┘
```

**Enums:**
- `Role`: USER, ADMIN, HOTEL_OWNER
- `BookingStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `PaymentStatus`: PENDING, SUCCEEDED, FAILED, REFUNDED

**Quan he:**
- User → nhieu Booking, nhieu Review
- Hotel → nhieu Room, nhieu Review
- Room → nhieu Booking, nhieu RoomAvailability
- Booking → 1 Payment
- Review: unique(userId, hotelId) — 1 user chi review 1 hotel 1 lan

---

## 18. Luong Nghiep Vu Chinh

### 18.1. User Dat Phong (Full Flow)

```
Browser                Backend                      Stripe              AI Service
  │                      │                            │                     │
  │─POST /bookings──────→│                            │                     │
  │  { roomId, dates }   │                            │                     │
  │                      ├─ BookingSaga:               │                     │
  │                      │  1. Check availability      │                     │
  │                      │  2. Create booking (PENDING)│                     │
  │                      │  3. Create payment          │                     │
  │                      │  4. Block room dates        │                     │
  │                      ├─ Emit booking.created ──────│─────────────────────│→ Embed
  │←── { bookingId } ───┤                            │                     │
  │                      │                            │                     │
  │─POST /payments/intent→│                            │                     │
  │                      ├─ stripe.create intent ─────→│                     │
  │←── { clientSecret } ──│←── clientSecret ───────────│                     │
  │                      │                            │                     │
  │─Stripe.js confirm ──│────────────────────────────→│                     │
  │  (dien the, submit)  │                            │── Xu ly thanh toan  │
  │                      │                            │                     │
  │                      │←── webhook succeeded ──────│                     │
  │                      ├─ Payment → SUCCEEDED       │                     │
  │                      ├─ Booking → CONFIRMED       │                     │
  │                      ├─ Emit booking.confirmed ───│─────────────────────│→ Update
  │                      │                            │                     │
```

### 18.2. Tao Hotel → AI Embedding

```
Admin                  Backend                  RabbitMQ              AI Service
  │                      │                        │                      │
  │─POST /hotels─────────→│                        │                      │
  │  { name, city, ... }  │                        │                      │
  │                      ├─ Generate slug          │                      │
  │                      ├─ Save to PostgreSQL     │                      │
  │                      ├─ eventEmitter.emit()    │                      │
  │                      │  'hotel.created'         │                      │
  │←── { hotel } ────────┤                        │                      │
  │                      │                        │                      │
  │                      │ EventBridge:            │                      │
  │                      ├─ @OnEvent('hotel.created')                     │
  │                      ├─ Query DB (full data)   │                      │
  │                      ├─ Convert → snake_case   │                      │
  │                      ├─ rabbitmq.publish() ───→│                      │
  │                      │                        │── ai.hotel.created ──→│
  │                      │                        │                      ├─ build_hotel_text()
  │                      │                        │                      ├─ chunk_text()
  │                      │                        │                      ├─ OpenAI embed()
  │                      │                        │                      ├─ Qdrant upsert()
  │                      │                        │                      │
  │                      │                        │           Hotel da co the tim bang
  │                      │                        │           semantic search!
```

### 18.3. Semantic Search

```
Browser              Frontend                 Backend               AI Service
  │                    │                        │                      │
  │─ Go "hotel view    │                        │                      │
  │   bien co ho boi"  │                        │                      │
  │                    │                        │                      │
  │                    ├─ GET /search?q=...────→ │── ES full-text ──→   │
  │                    │  (song song)            │                      │
  │                    ├─ POST /search/semantic→ │── Proxy ────────────→│
  │                    │  { query: "..." }       │                      ├─ Embed query
  │                    │                        │                      ├─ Qdrant search
  │                    │                        │←── AI results ───────│
  │                    │←── Merge results ──────│                      │
  │                    │                        │                      │
  │←── Hien thi ──────│                        │                      │
  │  (AI results co    │                        │                      │
  │   badge "AI")      │                        │                      │
```

---

## 19. So Do Tong Quan Ket Noi

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              Docker Compose                              │
│                                                                          │
│  ┌─────────────┐    HTTP     ┌─────────────┐    HTTP     ┌────────────┐ │
│  │  Frontend   │←──────────→│   Backend   │←──────────→│ AI Service │ │
│  │  Port 5173  │   /api/*    │  Port 3000  │  /ai/*     │ Port 8000  │ │
│  │  (React)    │             │  (NestJS)   │             │ (FastAPI)  │ │
│  └─────────────┘             └──────┬──────┘             └─────┬──────┘ │
│                                     │                          │        │
│         ┌───────────────────────────┼──────────────────────────┤        │
│         │                           │                          │        │
│  ┌──────▼──────┐  ┌────────────────▼──────┐  ┌───────────────▼──────┐ │
│  │ PostgreSQL  │  │     RabbitMQ          │  │      Qdrant         │ │
│  │ Port 5432   │  │     Port 5672         │  │      Port 6333      │ │
│  │             │  │     (AMQP)            │  │      (Vector DB)    │ │
│  │ Shared DB   │  │                       │  │                     │ │
│  │ (read/write │  │  Exchange: travelmind │  │  hotels collection  │ │
│  │  by Backend,│  │  Type: topic          │  │  reviews collection │ │
│  │  read-only  │  │                       │  │  bookings collection│ │
│  │  by AI)     │  │  9 routing keys       │  │                     │ │
│  └─────────────┘  └───────────────────────┘  └─────────────────────┘ │
│                                                                        │
│  ┌─────────────┐  ┌───────────────────────┐  ┌─────────────────────┐ │
│  │    Redis    │  │   Elasticsearch       │  │  Kibana + Logstash  │ │
│  │  Port 6379  │  │   Port 9200           │  │  Port 5601          │ │
│  │  (Cache)    │  │   (Full-text search)  │  │  (Log dashboard)    │ │
│  └─────────────┘  └───────────────────────┘  └─────────────────────┘ │
│                                                                        │
└──────────────────────────────────────────────────────────────────────────┘

Luong du lieu:
1. Browser → Frontend (React) → Backend API (NestJS) → PostgreSQL
2. Backend emit event → EventBridge → RabbitMQ → AI Service → Qdrant
3. Browser search → Frontend → Backend → proxy → AI → Qdrant → result
4. Browser search → Frontend → Backend → Elasticsearch → result
5. Backend cache → Redis → Backend (giam tai DB)
6. Stripe webhook → Backend → update booking status → emit event
```

### Bang Tom Tat 34 API Endpoints

```
Auth (4):
  POST /api/auth/register       @Public    Dang ky
  POST /api/auth/login          @Public    Dang nhap
  POST /api/auth/refresh        Refresh    Lam moi token
  POST /api/auth/logout         JWT        Dang xuat

Users (3):
  GET    /api/users/me          JWT        Xem profile
  PATCH  /api/users/me          JWT        Sua profile
  DELETE /api/users/me          JWT        Xoa tai khoan

Hotels (7):
  GET    /api/hotels            @Public    Tim kiem (filters, pagination)
  GET    /api/hotels/nearby     @Public    Hotel gan day (geo)
  GET    /api/hotels/:id        @Public    Chi tiet + rooms
  POST   /api/hotels            ADMIN      Tao hotel
  PATCH  /api/hotels/:id        ADMIN/OWNER Sua hotel
  DELETE /api/hotels/:id        ADMIN      Soft delete
  DELETE /api/hotels/:id/permanent ADMIN   Hard delete

Rooms (5):
  GET    /api/hotels/:id/rooms              @Public  Danh sach phong
  GET    /api/hotels/:id/rooms/:rid/availability @Public Check trong
  POST   /api/rooms                         ADMIN/OWNER Tao phong
  DELETE /api/rooms/:id                     ADMIN/OWNER Soft delete
  DELETE /api/rooms/:id/permanent           ADMIN    Hard delete

Bookings (5):
  POST   /api/bookings                     JWT   Dat phong (Saga)
  GET    /api/bookings                     JWT   Danh sach booking
  GET    /api/bookings/:id                 JWT   Chi tiet (owner only)
  PATCH  /api/bookings/:id/cancel          JWT   Huy booking
  DELETE /api/bookings/:id                 JWT   Xoa (PENDING only)

Payments (2):
  POST   /api/payments/intent/:bookingId   JWT      Tao PaymentIntent
  POST   /api/payments/webhook             @Public  Stripe webhook

Reviews (3):
  GET    /api/reviews?hotelId=xxx          @Public  Danh sach review
  POST   /api/reviews                      JWT      Tao review
  DELETE /api/reviews/:id                  JWT      Xoa review

Search (2):
  GET    /api/search                       @Public  Full-text (ES)
  POST   /api/search/semantic              @Public  Semantic (AI proxy)

Crawler (2):
  POST   /api/crawler/trigger              ADMIN    Trigger scraping
  GET    /api/crawler/status               ADMIN    Xem trang thai

Health (1):
  GET    /health                           @Public  Health check
```

### Cach Chay

```bash
# Start dependencies
docker compose up -d postgres redis rabbitmq

# Database setup
npx prisma migrate dev     # Tao bang
npx prisma generate        # Tao Prisma Client
npx tsx prisma/seed.ts     # Seed data (admin@travelmind.com / Admin123!)

# Start server
npm run start:dev          # Watch mode, port 3000

# Test
npm test                   # 17 tests, 6 suites
npm run build              # Build TypeScript → JavaScript
```
