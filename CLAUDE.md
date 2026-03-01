# TravelMind Backend

NestJS 11 + TypeScript + Prisma + PostgreSQL 16 + Redis + RabbitMQ + Socket.io + LianLian Bank (simulated).

- **Node** v20.18.3 | **CommonJS** (import dùng `.js` extension) | **Strict** ON
- **Port** 3000 | prefix `/api` | health `/health` | Swagger `/api/docs`
- **DB** `postgresql://travelmind:secret@localhost:5432/travelmind`

## Commands

```bash
docker compose up -d postgres redis    # Start deps
npx prisma migrate deploy             # Apply migrations
npx prisma generate                    # Regenerate client
npx tsx prisma/seed.ts                 # Seed (admin@travelmind.com / Admin123!)
npx tsx prisma/sync-ai.ts             # Sync hotels/reviews → AI Qdrant
npm run prisma:setup                   # Full setup: migrate + generate + seed + sync-ai
npm run start:dev                      # Dev (watch mode, port 3000)
npm test                               # Unit tests (20 tests, 6 suites)
npm run build                          # Build
```

## Context Files — Load Khi Cần

| File | Dùng khi |
|------|----------|
| `docs/claude/context-general.md` | Luôn load — architecture, patterns, gotchas |
| `docs/claude/context-auth.md` | Làm auth, JWT, guards, permissions |
| `docs/claude/context-database.md` | Làm Prisma, schema, migrations |
| `docs/claude/context-api.md` | Làm endpoints, DTOs, controllers |
| `docs/claude/context-events.md` | Làm RabbitMQ, events, queue |
| `docs/claude/context-hotel-room.md` | Làm hotel, room, availability, geo search |
| `docs/claude/context-booking.md` | Làm booking saga, payment flow |
| `docs/claude/context-chat.md` | Làm chat WebSocket, SSE streaming, AI integration |

```
"Đọc docs/claude/context-auth.md rồi help me fix JWT refresh"
```
