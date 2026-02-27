import { Module } from '@nestjs/common';
import { RoomController } from './room.controller.js';
import { RoomService } from './room.service.js';
import { RoomRepository } from './room.repository.js';

@Module({
  controllers: [RoomController],
  providers: [RoomService, RoomRepository],
  exports: [RoomService],
})
export class RoomModule {}
