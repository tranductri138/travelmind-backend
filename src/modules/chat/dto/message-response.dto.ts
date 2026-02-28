import { MessageRole } from '@prisma/client';

export class MessageResponseDto {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: Date;
}
