import { MessageResponseDto } from './message-response.dto.js';

export class ConversationResponseDto {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: MessageResponseDto[];
}
