# Context: Database — Prisma & Schema

## Setup

- Service: `src/core/database/prisma.service.ts` — extends PrismaClient, `@Global()`
- Schema: `prisma/schema.prisma`
- Sau khi sửa schema: `npx prisma generate` + restart TS server

## Schema

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| User | id, email, password, role(USER/ADMIN/HOTEL_OWNER), refreshToken | → Booking, Review, ChatConversation |
| Hotel | id, name, slug, city, country, stars, rating, amenities[], isActive | → Room, Review |
| Room | id, hotelId, name, type, price, maxGuests, amenities[], isActive | → Booking, RoomAvailability |
| Booking | id, userId, roomId, checkIn, checkOut, totalPrice, status | → Payment |
| Payment | id, bookingId, transactionId, amount, status | |
| Review | id, userId, hotelId, rating, title, comment | unique(userId, hotelId) |
| RoomAvailability | roomId, date, isAvailable | |
| ChatConversation | id, userId, title | → ChatMessage |
| ChatMessage | id, conversationId, role(USER/ASSISTANT), content | |

**Enums:** `Role`: USER, ADMIN, HOTEL_OWNER | `BookingStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED | `PaymentStatus`: PENDING, SUCCEEDED, FAILED, REFUNDED | `MessageRole`: USER, ASSISTANT

## Patterns

- **Soft delete**: `isActive = false` (Hotel, Room) + `/permanent` endpoint cho hard delete
- **Cascade**: ChatMessage cascade khi xóa ChatConversation
- **Slug**: Auto-generate từ hotel name qua `src/shared/utils/slug.util.ts`
- **Availability**: `RoomAvailability` block từng ngày khi booking confirmed

## Commands

```bash
npx prisma migrate dev --name <name>   # Tạo + apply migration
npx prisma generate                    # Regenerate Prisma Client
npx prisma studio                      # GUI browser
npx tsx prisma/seed.ts                 # Seed: admin@travelmind.com / Admin123!
```

## Prisma Error Codes (PrismaExceptionFilter)

| Code | Ý nghĩa | HTTP |
|------|---------|------|
| P2002 | Unique violation (email trùng) | 409 |
| P2025 | Record not found | 404 |
| P2003 | Foreign key violation | 400 |
