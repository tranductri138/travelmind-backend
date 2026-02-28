import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn('Connection rejected: no token');
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
      const payload = this.jwtService.verify(token, { secret });
      client.userId = payload.sub;

      this.logger.log(`Client connected: ${client.userId}`);
      client.emit('connected', { message: 'Connected to TravelMind Chat' });
    } catch {
      this.logger.warn('Connection rejected: invalid token');
      client.emit('error', { message: 'Invalid token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.userId || 'unknown'}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId?: string; message: string },
  ) {
    if (!client.userId) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    if (!data.message?.trim()) {
      client.emit('error', { message: 'Message is required' });
      return;
    }

    client.emit('typing', { status: true });

    try {
      const result = await this.chatService.handleMessage(
        client.userId,
        data.conversationId,
        data.message.trim(),
        (chunk: string) => {
          client.emit('messageChunk', {
            conversationId: data.conversationId,
            chunk,
          });
        },
      );

      client.emit('typing', { status: false });
      client.emit('messageComplete', {
        conversationId: result.conversationId,
        content: result.content,
      });
    } catch (error) {
      this.logger.error('Message handling error', error);
      client.emit('typing', { status: false });
      client.emit('error', { message: 'Failed to process message' });
    }
  }
}
