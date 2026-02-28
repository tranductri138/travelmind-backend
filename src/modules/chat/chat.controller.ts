import { Controller, Get, Delete, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChatService } from './chat.service.js';
import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List user conversations' })
  async getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  async getConversation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.chatService.getConversation(id, userId);
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  async deleteConversation(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.chatService.deleteConversation(id, userId);
    return { message: 'Conversation deleted' };
  }
}
