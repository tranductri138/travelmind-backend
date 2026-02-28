import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ChatRepository } from './chat.repository.js';
import { ChatGateway } from './chat.gateway.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ChatController],
  providers: [ChatGateway, ChatService, ChatRepository],
})
export class ChatModule {}
