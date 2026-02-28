import { Module } from '@nestjs/common';
import { HotelController } from './hotel.controller.js';
import { HotelService } from './hotel.service.js';
import { HotelRepository } from './hotel.repository.js';
import { PriceSyncConsumer } from './consumers/price-sync.consumer.js';
import { HotelIndexingConsumer } from './consumers/hotel-indexing.consumer.js';

@Module({
  controllers: [HotelController],
  providers: [
    HotelService,
    HotelRepository,
    PriceSyncConsumer,
    HotelIndexingConsumer,
  ],
  exports: [HotelService],
})
export class HotelModule {}
