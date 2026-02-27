import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller.js';
import { BookingService } from './booking.service.js';
import { BookingRepository } from './booking.repository.js';
import { BookingSaga } from './saga/booking.saga.js';
import { BookingNotificationConsumer } from './consumers/booking-notification.consumer.js';
import { BookingAnalyticsConsumer } from './consumers/booking-analytics.consumer.js';
import { RoomModule } from '../room/room.module.js';

@Module({
  imports: [RoomModule],
  controllers: [BookingController],
  providers: [
    BookingService,
    BookingRepository,
    BookingSaga,
    BookingNotificationConsumer,
    BookingAnalyticsConsumer,
  ],
  exports: [BookingService],
})
export class BookingModule {}
