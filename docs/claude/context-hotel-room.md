# Context: Hotel & Room Module

## File Structure

```
src/modules/hotel/
├── hotel.controller.ts     # 7 routes
├── hotel.service.ts        # CRUD + emit events
├── hotel.repository.ts     # Prisma + raw SQL (findNearby)
├── dto/
│   ├── create-hotel.dto.ts
│   ├── update-hotel.dto.ts
│   ├── search-hotel.dto.ts   # q, city, country, minStars, minRating, amenities, sortBy, sortOrder
│   └── nearby-query.dto.ts   # lat, lng, radius (km, default 10)
└── events/
    ├── hotel-created.event.ts
    ├── hotel-updated.event.ts
    └── hotel-deleted.event.ts

src/modules/room/
├── room.controller.ts      # 5 routes (prefix: hotels/:hotelId/rooms)
├── room.service.ts         # CRUD + availability
├── room.repository.ts      # Prisma + blockDates/releaseDates
└── dto/
    ├── create-room.dto.ts
    └── check-availability.dto.ts  # checkIn, checkOut (Date strings)
```

## Routes

```
Hotels:
  GET    /api/hotels                @Public   Search với filters + pagination
  GET    /api/hotels/nearby         @Public   ?lat=&lng=&radius= (Haversine, raw SQL)
  GET    /api/hotels/:id            @Public   Detail + include rooms
  POST   /api/hotels                ADMIN     Auto-generate slug từ name
  PATCH  /api/hotels/:id            ADMIN/HOTEL_OWNER  Slug cũng update nếu đổi name
  DELETE /api/hotels/:id            ADMIN     Soft delete (isActive=false) + emit hotel.deleted
  DELETE /api/hotels/:id/permanent  ADMIN     Hard delete + emit hotel.deleted {permanent:true}

Rooms:
  GET    /api/hotels/:hotelId/rooms                        @Public
  GET    /api/hotels/:hotelId/rooms/:roomId/availability   @Public  ?checkIn=&checkOut=
  POST   /api/hotels/:hotelId/rooms                        ADMIN/HOTEL_OWNER
  DELETE /api/hotels/:hotelId/rooms/:roomId                ADMIN/HOTEL_OWNER  Soft delete
  DELETE /api/hotels/:hotelId/rooms/:roomId/permanent      ADMIN              Hard delete
```

## Key Logic

### Slug
Auto-generate khi create, update nếu `name` thay đổi:
```typescript
generateSlug("Khách sạn Grand") → "khach-san-grand"  // src/shared/utils/slug.util.ts
```

### Search (hotel.repository.ts)
- Filter: `isActive: true` luôn áp dụng
- `q` → OR search trên `name`, `description`, `city` (case-insensitive)
- `amenities` → `hasEvery` (hotel phải có tất cả amenities được yêu cầu)
- Default sort: `rating DESC`

### Nearby (raw SQL — Haversine formula)
```sql
SELECT *, (6371 * acos(...)) AS distance
FROM hotels WHERE is_active = true AND latitude IS NOT NULL
HAVING distance <= :radius ORDER BY distance LIMIT 20
```
Hotel cần có `latitude`, `longitude` trong DB mới hiện trong nearby search.

### Room Availability
`RoomAvailability` table lưu từng ngày bị block:
- `checkAvailability(roomId, checkIn, checkOut)` → query xem có ngày nào `isAvailable=false` không
- `blockDates(roomId, checkIn, checkOut)` → upsert mỗi ngày với `isAvailable=false`
- `releaseDates(roomId, checkIn, checkOut)` → update lại `isAvailable=true` (khi cancel)

### Delete & Event Sync
Cả soft delete và hard delete đều emit `hotel.deleted`:
```typescript
// soft delete
eventEmitter.emit('hotel.deleted', new HotelDeletedEvent(hotel.id, false))
// hard delete
eventEmitter.emit('hotel.deleted', new HotelDeletedEvent(hotel.id, true))
```
EventBridge publish lên RabbitMQ → AI service xóa embedding khỏi Qdrant.

### Rating Update
`hotelService.updateRating(hotelId)` được gọi từ ReviewService sau mỗi create/delete review
→ tính lại `rating` trung bình và update Hotel.
