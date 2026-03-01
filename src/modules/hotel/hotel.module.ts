import { Module } from '@nestjs/common';
import { HotelController } from './hotel.controller.js';
import { HotelService } from './hotel.service.js';
import { HotelRepository } from './hotel.repository.js';
import { PriceSyncConsumer } from './consumers/price-sync.consumer.js';

@Module({
  controllers: [HotelController],
  providers: [
    HotelService,
    HotelRepository,
    PriceSyncConsumer,
  ],
  exports: [HotelService],
})
export class HotelModule {}
