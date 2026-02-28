import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRepository } from './chat.repository.js';
import { ChatConversation, ChatMessage } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>(
      'ai.serviceUrl',
      'http://localhost:8000',
    );
  }

  async getConversations(userId: string): Promise<ChatConversation[]> {
    return this.chatRepository.findConversationsByUserId(userId);
  }

  async getConversation(
    id: string,
    userId: string,
  ): Promise<ChatConversation & { messages: ChatMessage[] }> {
    const conversation =
      await this.chatRepository.findConversationWithMessages(id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId !== userId) throw new ForbiddenException();
    return conversation;
  }

  async deleteConversation(id: string, userId: string): Promise<void> {
    const conversation = await this.chatRepository.findConversationById(id);
    if (!conversation) throw new NotFoundException('Conversation not found');
    if (conversation.userId !== userId) throw new ForbiddenException();
    await this.chatRepository.deleteConversation(id);
  }

  async handleMessage(
    userId: string,
    conversationId: string | undefined,
    message: string,
    onChunk: (chunk: string) => void,
  ): Promise<{ conversationId: string; content: string }> {
    // 1. Get or create conversation
    let convId = conversationId;
    if (!convId) {
      const title =
        message.length > 50 ? message.slice(0, 50) + '...' : message;
      const conversation = await this.chatRepository.createConversation(
        userId,
        title,
      );
      convId = conversation.id;
    } else {
      const conversation =
        await this.chatRepository.findConversationById(convId);
      if (!conversation) throw new NotFoundException('Conversation not found');
      if (conversation.userId !== userId) throw new ForbiddenException();
    }

    // 2. Save user message
    await this.chatRepository.createMessage(convId, 'USER', message);

    // 3. Call AI service — send conversation_id + only the new user message.
    //    LangGraph's checkpoint handles the full conversation state (including
    //    previous tool calls/results). No need to send 20 messages anymore.
    let fullContent = '';
    try {
      fullContent = await this.streamFromAI(convId, message, onChunk);
    } catch (error) {
      this.logger.error('AI service error', error);
      fullContent =
        'Sorry, I am unable to process your request right now. Please try again later.';
      onChunk(fullContent);
    }

    // 4. Save assistant response
    await this.chatRepository.createMessage(convId, 'ASSISTANT', fullContent);

    return { conversationId: convId, content: fullContent };
  }

  private async streamFromAI(
    conversationId: string,
    userMessage: string,
    onChunk: (chunk: string) => void,
  ): Promise<string> {
    const url = `${this.aiServiceUrl}/ai/chat`;
    const body = JSON.stringify({
      messages: [{ role: 'user', content: userMessage }],
      conversation_id: conversationId,
      stream: true,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      throw new Error(`AI service returned ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const data = trimmed.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.chunk) {
            fullContent += parsed.chunk;
            onChunk(parsed.chunk);
          }
        } catch {
          // Skip malformed SSE lines
        }
      }
    }

    return fullContent;
  }
}
