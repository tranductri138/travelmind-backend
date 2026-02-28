# Context: Booking & Payment Module

## File Structure

```
src/modules/booking/
├── booking.controller.ts
├── booking.service.ts
├── booking.repository.ts
├── saga/
│   └── booking.saga.ts      # Orchestrate create flow
├── dto/
│   ├── create-booking.dto.ts   # roomId, checkIn, checkOut, guests, totalPrice, specialRequests?
│   └── booking-filter.dto.ts
└── events/
    ├── booking-created.event.ts
    └── booking-cancelled.event.ts

src/modules/payment/
├── payment.controller.ts
└── payment.service.ts       # LianLian Bank simulated
```

## Routes

```
Bookings:
  POST   /api/bookings              JWT   Create — chạy qua BookingSaga
  GET    /api/bookings              JWT   List (user thấy của mình, Admin thấy tất cả)
  GET    /api/bookings/:id          JWT   Detail — chỉ owner xem được (ForbiddenException nếu không phải)
  PATCH  /api/bookings/:id/cancel   JWT   Cancel — không cancel được COMPLETED
  DELETE /api/bookings/:id          JWT   Xóa — chỉ PENDING, không xóa CONFIRMED

Payments:
  POST /api/payments/initiate/:bookingId  JWT  Tạo transactionId (LL-uuid), trả bankInfo
  POST /api/payments/confirm/:txId        JWT  Xác nhận → Booking CONFIRMED + emit booking.confirmed
```

## Booking Saga Flow

```
BookingService.create()
  │
  ├─ validate: checkIn < checkOut
  │
  └─ BookingSaga.execute()
       │
       ├─ 1. roomService.checkAvailability() → 400 nếu không còn phòng
       │
       ├─ 2. prisma.$transaction([
       │        booking.create({ status: PENDING }),
       │        payment.create({ amount, currency: 'USD' })  ← tạo luôn payment record
       │    ])
       │
       └─ 3. roomService.blockDates()  ← block ngoài transaction (best-effort)
  │
  └─ eventEmitter.emit('booking.created', { bookingId, userId, roomId, checkIn, checkOut })
```

## Payment Flow (LianLian Bank — Simulated)

```
POST /payments/initiate/:bookingId
  → tìm payment record (tạo kèm booking)
  → generate transactionId = "LL-{uuid}"
  → lưu transactionId vào payment
  → trả về: { transactionId, amount, currency, bankInfo }

POST /payments/confirm/:txId
  → tìm payment by transactionId
  → prisma.$transaction([
      payment.update({ status: SUCCEEDED, method: 'lianlian_bank' }),
      booking.update({ status: CONFIRMED })
    ])
  → eventEmitter.emit('booking.confirmed', { bookingId })
```

## State Machine

```
Booking:  PENDING → CONFIRMED → COMPLETED
                 ↘ CANCELLED

Payment:  PENDING → SUCCEEDED
                 → FAILED
                 → REFUNDED
```

## Business Rules

| Hành động | Điều kiện |
|-----------|----------|
| Cancel booking | Status ≠ CANCELLED và ≠ COMPLETED |
| Delete booking | Status = PENDING (không xóa CONFIRMED) |
| View booking | Chỉ owner hoặc ADMIN |
| Initiate payment | Payment chưa SUCCEEDED |
| Confirm payment | Tìm theo `transactionId`, chưa SUCCEEDED |

## Cancel Side Effect

Khi cancel:
1. `bookingRepository.updateStatus(id, CANCELLED)`
2. `roomService.releaseDates(roomId, checkIn, checkOut)` — trả phòng về available
3. `eventEmitter.emit('booking.cancelled', ...)` → AI service xóa embedding
