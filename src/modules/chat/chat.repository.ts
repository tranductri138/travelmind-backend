import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { ChatConversation, ChatMessage, MessageRole } from '@prisma/client';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createConversation(
    userId: string,
    title: string,
  ): Promise<ChatConversation> {
    return this.prisma.chatConversation.create({
      data: { userId, title },
    });
  }

  async findConversationById(id: string): Promise<ChatConversation | null> {
    return this.prisma.chatConversation.findUnique({ where: { id } });
  }

  async findConversationWithMessages(
    id: string,
  ): Promise<(ChatConversation & { messages: ChatMessage[] }) | null> {
    return this.prisma.chatConversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async findConversationsByUserId(userId: string): Promise<ChatConversation[]> {
    return this.prisma.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteConversation(id: string): Promise<ChatConversation> {
    return this.prisma.chatConversation.delete({ where: { id } });
  }

  async updateConversationTitle(
    id: string,
    title: string,
  ): Promise<ChatConversation> {
    return this.prisma.chatConversation.update({
      where: { id },
      data: { title },
    });
  }

  async createMessage(
    conversationId: string,
    role: MessageRole,
    content: string,
  ): Promise<ChatMessage> {
    return this.prisma.chatMessage.create({
      data: { conversationId, role, content },
    });
  }

  async getRecentMessages(
    conversationId: string,
    limit = 20,
  ): Promise<ChatMessage[]> {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
