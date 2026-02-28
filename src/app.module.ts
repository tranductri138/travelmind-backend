import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { CoreModule } from './core/core.module.js';
import { SharedModule } from './shared/shared.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { HotelModule } from './modules/hotel/hotel.module.js';
import { RoomModule } from './modules/room/room.module.js';
import { BookingModule } from './modules/booking/booking.module.js';
import { PaymentModule } from './modules/payment/payment.module.js';
import { ReviewModule } from './modules/review/review.module.js';
import { SearchModule } from './modules/search/search.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { CrawlerModule } from './modules/crawler/crawler.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    CoreModule,
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
      exclude: ['/api/{*path}', '/health'],
    }),
    SharedModule,
    AuthModule,
    UserModule,
    HotelModule,
    RoomModule,
    BookingModule,
    PaymentModule,
    ReviewModule,
    SearchModule,
    NotificationModule,
    CrawlerModule,
    ChatModule,
    UploadModule,
  ],
})
export class AppModule {}
