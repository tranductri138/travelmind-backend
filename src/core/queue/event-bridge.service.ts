import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../database/prisma.service.js';
import { RabbitMQService } from './rabbitmq.service.js';
import { ROUTING_KEYS } from '../../shared/constants/queue.constants.js';

@Injectable()
export class EventBridgeService {
  private readonly logger = new Logger(EventBridgeService.name);

  constructor(
    private readonly rabbitmq: RabbitMQService,
    private readonly prisma: PrismaService,
  ) {}

  @OnEvent('hotel.created')
  async onHotelCreated(event: { hotelId: string }) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: event.hotelId },
    });
    if (!hotel) return;

    await this.rabbitmq.publish(ROUTING_KEYS.HOTEL_CREATED, {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      stars: hotel.stars,
      rating: hotel.rating,
      amenities: hotel.amenities,
      images: hotel.images,
      contact_email: hotel.contactEmail,
      contact_phone: hotel.contactPhone,
    });
    this.logger.log(`Bridged hotel.created for ${hotel.id}`);
  }

  @OnEvent('hotel.updated')
  async onHotelUpdated(event: { hotelId: string }) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id: event.hotelId },
    });
    if (!hotel) return;

    await this.rabbitmq.publish(ROUTING_KEYS.HOTEL_UPDATED, {
      id: hotel.id,
      name: hotel.name,
      slug: hotel.slug,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      stars: hotel.stars,
      rating: hotel.rating,
      amenities: hotel.amenities,
      images: hotel.images,
      contact_email: hotel.contactEmail,
      contact_phone: hotel.contactPhone,
    });
    this.logger.log(`Bridged hotel.updated for ${hotel.id}`);
  }

  @OnEvent('hotel.deleted')
  async onHotelDeleted(event: { hotelId: string; permanent: boolean }) {
    await this.rabbitmq.publish(ROUTING_KEYS.HOTEL_DELETED, {
      id: event.hotelId,
      permanent: event.permanent,
    });
    this.logger.log(
      `Bridged hotel.deleted for ${event.hotelId} (permanent=${event.permanent})`,
    );
  }

  @OnEvent('booking.created')
  async onBookingCreated(event: {
    bookingId: string;
    userId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: event.bookingId },
      include: { room: { include: { hotel: true } } },
    });
    if (!booking) return;

    await this.rabbitmq.publish(ROUTING_KEYS.BOOKING_CREATED, {
      id: booking.id,
      user_id: booking.userId,
      room_id: booking.roomId,
      hotel_id: booking.room.hotelId,
      hotel_name: booking.room.hotel.name,
      room_name: booking.room.name,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      guests: booking.guests,
      total_price: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
    });
    this.logger.log(`Bridged booking.created for ${booking.id}`);
  }

  @OnEvent('booking.confirmed')
  async onBookingConfirmed(event: { bookingId: string }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: event.bookingId },
      include: { room: { include: { hotel: true } } },
    });
    if (!booking) return;

    await this.rabbitmq.publish(ROUTING_KEYS.BOOKING_CONFIRMED, {
      id: booking.id,
      user_id: booking.userId,
      room_id: booking.roomId,
      hotel_id: booking.room.hotelId,
      hotel_name: booking.room.hotel.name,
      room_name: booking.room.name,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      total_price: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
    });
    this.logger.log(`Bridged booking.confirmed for ${booking.id}`);
  }

  @OnEvent('booking.cancelled')
  async onBookingCancelled(event: {
    bookingId: string;
    userId: string;
    roomId: string;
    checkIn: Date;
    checkOut: Date;
  }) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: event.bookingId },
      include: { room: { include: { hotel: true } } },
    });
    if (!booking) return;

    await this.rabbitmq.publish(ROUTING_KEYS.BOOKING_CANCELLED, {
      id: booking.id,
      user_id: booking.userId,
      room_id: booking.roomId,
      hotel_id: booking.room.hotelId,
      hotel_name: booking.room.hotel.name,
      room_name: booking.room.name,
      check_in: booking.checkIn,
      check_out: booking.checkOut,
      total_price: booking.totalPrice,
      currency: booking.currency,
      status: booking.status,
    });
    this.logger.log(`Bridged booking.cancelled for ${booking.id}`);
  }

  @OnEvent('review.created')
  async onReviewCreated(event: {
    reviewId: string;
    hotelId: string;
    rating: number;
  }) {
    const review = await this.prisma.review.findUnique({
      where: { id: event.reviewId },
    });
    if (!review) return;

    await this.rabbitmq.publish(ROUTING_KEYS.REVIEW_CREATED, {
      id: review.id,
      user_id: review.userId,
      hotel_id: review.hotelId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
    });
    this.logger.log(`Bridged review.created for ${review.id}`);
  }

  @OnEvent('review.deleted')
  async onReviewDeleted(event: { reviewId: string; hotelId: string }) {
    await this.rabbitmq.publish(ROUTING_KEYS.REVIEW_DELETED, {
      id: event.reviewId,
      hotel_id: event.hotelId,
    });
    this.logger.log(`Bridged review.deleted for ${event.reviewId}`);
  }
}
