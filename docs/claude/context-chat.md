# Context: Chat Module — WebSocket + AI Streaming

## File Structure

```
src/modules/chat/
├── chat.module.ts       # Import HttpModule, JwtModule
├── chat.gateway.ts      # WebSocket gateway, namespace /chat
├── chat.controller.ts   # 3 REST endpoints
├── chat.service.ts      # Business logic + SSE stream từ AI
├── chat.repository.ts   # Prisma CRUD ChatConversation + ChatMessage
└── dto/
    ├── send-message.dto.ts
    ├── conversation-response.dto.ts
    └── message-response.dto.ts
```

## WebSocket Gateway (chat.gateway.ts)

**Namespace**: `/chat` | **Transport**: Socket.io | **CORS**: `origin: '*'`

### Auth Flow (`handleConnection`)
```typescript
const token = client.handshake.auth?.token
           || client.handshake.headers?.authorization?.replace('Bearer ', '');
// Verify bằng jwtService.verify(token, { secret: JWT_ACCESS_SECRET })
// Thành công → client.userId = payload.sub
// Thất bại → emit('error') + client.disconnect()
```

### WebSocket Events

| Event | Hướng | Payload |
|-------|-------|---------|
| `sendMessage` | Client → Server | `{ conversationId?: string, message: string }` |
| `connected` | Server → Client | `{ message: 'Connected to TravelMind Chat' }` |
| `typing` | Server → Client | `{ status: true/false }` |
| `messageChunk` | Server → Client | `{ conversationId, chunk }` |
| `messageComplete` | Server → Client | `{ conversationId, content }` |
| `error` | Server → Client | `{ message: string }` |

### sendMessage Handler Flow
```
client.emit('sendMessage', { message, conversationId? })
  → emit typing: true
  → chatService.handleMessage(userId, conversationId, message, onChunk)
     → mỗi chunk nhận được: client.emit('messageChunk', { conversationId, chunk })
  → emit typing: false
  → emit messageComplete { conversationId, content }
```

## Chat Service (chat.service.ts)

### handleMessage()
```
1. Get or create conversation
   - Không có conversationId → tạo mới, title = 50 ký tự đầu của message
   - Có conversationId → verify tồn tại + userId khớp (ForbiddenException nếu không)

2. Save user message → chatRepository.createMessage(convId, 'USER', message)

3. streamFromAI(conversationId, message, onChunk)
   POST {aiServiceUrl}/ai/chat
   body: { messages: [{ role: 'user', content: message }],
           conversation_id: conversationId,
           stream: true }
   ← Chỉ gửi message mới nhất, KHÔNG gửi history
   ← LangGraph checkpoint trên AI side giữ full state

4. Save assistant response → createMessage(convId, 'ASSISTANT', fullContent)
```

### SSE Stream Parsing (streamFromAI)
```typescript
// Parse từng line: "data: {\"chunk\": \"...\"}"
if (line.startsWith('data: ')) {
  const data = line.slice(6);
  if (data === '[DONE]') continue;
  const { chunk } = JSON.parse(data);
  onChunk(chunk);   // → emit messageChunk về client
}
```

## REST Endpoints (chat.controller.ts)

```
GET    /api/chat/conversations       JWT  Danh sách (sort: updatedAt DESC)
GET    /api/chat/conversations/:id   JWT  Detail + messages (sort: createdAt ASC)
DELETE /api/chat/conversations/:id   JWT  Cascade xóa ChatMessage
```
Tất cả đều check `conversation.userId === currentUser.id` → ForbiddenException nếu không khớp.

## Prisma Models

```prisma
model ChatConversation {
  id        String        @id @default(uuid())
  userId    String
  title     String
  messages  ChatMessage[]
  user      User          @relation(...)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model ChatMessage {
  id             String           @id @default(uuid())
  conversationId String
  role           MessageRole      # USER | ASSISTANT
  content        String
  conversation   ChatConversation @relation(onDelete: Cascade)
  createdAt      DateTime         @default(now())
}
```

## AI Service Integration

- **URL**: `config.get('ai.serviceUrl')` → mặc định `http://localhost:8000`
- **Endpoint**: `POST /ai/chat`
- **Protocol**: HTTP SSE (Server-Sent Events), dùng native `fetch` + `ReadableStream`
- **Error handling**: nếu AI service lỗi → trả fallback message, vẫn save vào DB
- **Không dùng WebSocket**: backend → AI là HTTP, chỉ client → backend là WebSocket
