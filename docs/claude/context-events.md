# Context: Events & Queue — RabbitMQ

## Flow

```
Service.method()
  → eventEmitter.emit('hotel.created', { hotelId })   # in-memory, chỉ IDs
  → EventBridgeService @OnEvent()                      # query DB lấy full data
  → rabbitmq.publish('hotel.created', { ...snake_case })  # sang Python convention
  → AI Service consume → Qdrant upsert/delete
```

## Routing Keys

| Key | Emit từ | AI làm gì |
|-----|---------|-----------|
| `hotel.created` | HotelService.create() | Embed → Qdrant |
| `hotel.updated` | HotelService.update() | Re-embed |
| `hotel.deleted` | HotelService.delete/permanent() | Xóa embedding |
| `review.created` | ReviewService.create() | Embed → Qdrant |
| `review.deleted` | ReviewService.delete() | Xóa embedding |
| `booking.created` | BookingService.create() | Embed |
| `booking.confirmed` | PaymentService.confirm() | Update embedding |
| `booking.cancelled` | BookingService.cancel() | Xóa embedding |
| `crawler.job` | ~~Không còn dùng~~ — Crawler giờ gọi trực tiếp HTTP `POST /scraping/extract` | Chi tiết AI-side → `ai/docs/claude/context-scraping.md` |
| `user.registered` | AuthService.register() | Gửi welcome email |

## RabbitMQ Config

- Exchange: `travelmind` (topic), durable
- Library: `amqp-connection-manager` (auto-reconnect)
- Messages: `persistent: true`, content-type `application/json`
- AI service tạo queues `ai.*` và bind vào exchange

## Files

| File | Chức năng |
|------|-----------|
| `src/core/queue/rabbitmq.service.ts` | Kết nối AMQP, publish |
| `src/core/queue/event-bridge.service.ts` | 10 @OnEvent() handlers → query DB → publish |
| `src/shared/constants/queue.constants.ts` | ROUTING_KEYS, EXCHANGE_NAME |

## EventBridge Pattern

Mỗi handler: nhận IDs → query DB (include relations) → convert camelCase → snake_case → publish.
Lý do 2 tầng: Service emit nhanh (không block), EventBridge query đầy đủ data sau.
