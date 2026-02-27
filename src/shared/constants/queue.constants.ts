export const EXCHANGE_NAME = 'travelmind.events';
export const DLX_EXCHANGE = 'travelmind.dlx';

export const ROUTING_KEYS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  REVIEW_CREATED: 'review.created',
  REVIEW_DELETED: 'review.deleted',
  HOTEL_PRICE_UPDATED: 'hotel.price.updated',
  HOTEL_CREATED: 'hotel.created',
  HOTEL_UPDATED: 'hotel.updated',
  HOTEL_DELETED: 'hotel.deleted',
  CRAWLER_JOB: 'crawler.job',
  USER_REGISTERED: 'user.registered',
} as const;

export const QUEUES = {
  BOOKING_NOTIFICATION: 'booking.notification.queue',
  BOOKING_ANALYTICS: 'booking.analytics.queue',
  ROOM_AVAILABILITY: 'room.availability.queue',
  NOTIFICATION_EMAIL: 'notification.email.queue',
  PAYMENT_REFUND: 'payment.refund.queue',
  RATING_AGGREGATOR: 'rating.aggregator.queue',
  SEARCH_INDEXING: 'search.indexing.queue',
  CACHE_INVALIDATE: 'cache.invalidate.queue',
  CRAWL_PROCESSING: 'crawl.processing.queue',
} as const;
