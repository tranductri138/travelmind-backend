import {
  PrismaClient,
  Role,
  BookingStatus,
  PaymentStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const DATA_DIR = path.join(__dirname, 'seed-data');

function loadJson<T>(filename: string): T {
  const filePath = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

interface UserSeed {
  email: string;
  password: string;
  name: string;
  role: string;
}

interface RoomSeed {
  name: string;
  type: string;
  price: number;
  maxGuests: number;
  amenities: string[];
}

interface HotelSeed {
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  stars?: number;
  rating?: number;
  amenities?: string[];
  images?: string[];
  contactEmail?: string;
  contactPhone?: string;
  rooms?: RoomSeed[];
}

interface ReviewSeed {
  userEmail: string;
  hotelSlug: string;
  rating: number;
  title?: string;
  comment?: string;
}

interface PaymentSeed {
  amount: number;
  status: string;
  method: string;
}

interface BookingSeed {
  userEmail: string;
  hotelSlug: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  specialRequests?: string;
  payment: PaymentSeed;
}

async function seedUsers(users: UserSeed[]) {
  const created: Record<string, { id: string; email: string }> = {};

  for (const u of users) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: hashed,
        name: u.name,
        role: u.role as Role,
      },
    });
    created[u.email] = { id: user.id, email: user.email };
  }

  return created;
}

async function seedHotels(hotels: HotelSeed[]) {
  const hotelMap: Record<string, string> = {};
  const roomMap: Record<string, string> = {}; // "hotelSlug:roomType" -> roomId

  for (const h of hotels) {
    const { rooms, ...hotelData } = h;

    const hotel = await prisma.hotel.upsert({
      where: { slug: h.slug },
      update: {},
      create: hotelData,
    });
    hotelMap[h.slug] = hotel.id;

    if (rooms?.length) {
      for (const r of rooms) {
        const existing = await prisma.room.findFirst({
          where: { hotelId: hotel.id, type: r.type },
        });
        if (existing) {
          roomMap[`${h.slug}:${r.type}`] = existing.id;
        } else {
          const room = await prisma.room.create({
            data: { ...r, hotelId: hotel.id },
          });
          roomMap[`${h.slug}:${r.type}`] = room.id;
        }
      }
    }
  }

  return { hotelMap, roomMap };
}

async function seedReviews(
  reviews: ReviewSeed[],
  userMap: Record<string, { id: string }>,
  hotelMap: Record<string, string>,
) {
  const data = reviews.map((r) => ({
    userId: userMap[r.userEmail].id,
    hotelId: hotelMap[r.hotelSlug],
    rating: r.rating,
    title: r.title,
    comment: r.comment,
  }));

  await prisma.review.createMany({ skipDuplicates: true, data });
}

async function seedRoomAvailability(roomMap: Record<string, string>) {
  const roomIds = Object.values(roomMap);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const data: { roomId: string; date: Date; isAvailable: boolean }[] = [];

  for (const roomId of roomIds) {
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      data.push({ roomId, date, isAvailable: true });
    }
  }

  await prisma.roomAvailability.createMany({ skipDuplicates: true, data });
  return data.length;
}

async function seedBookings(
  bookings: BookingSeed[],
  userMap: Record<string, { id: string }>,
  roomMap: Record<string, string>,
) {
  let bookingCount = 0;
  let paymentCount = 0;

  for (const b of bookings) {
    const userId = userMap[b.userEmail]?.id;
    const roomId = roomMap[`${b.hotelSlug}:${b.roomType}`];
    if (!userId || !roomId) continue;

    const existing = await prisma.booking.findFirst({
      where: {
        userId,
        roomId,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut),
      },
    });
    if (existing) continue;

    const booking = await prisma.booking.create({
      data: {
        userId,
        roomId,
        checkIn: new Date(b.checkIn),
        checkOut: new Date(b.checkOut),
        guests: b.guests,
        totalPrice: b.totalPrice,
        status: b.status as BookingStatus,
        specialRequests: b.specialRequests,
      },
    });
    bookingCount++;

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: b.payment.amount,
        status: b.payment.status as PaymentStatus,
        method: b.payment.method,
        transactionId:
          b.payment.status === 'SUCCEEDED' || b.payment.status === 'REFUNDED'
            ? `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
            : null,
      },
    });
    paymentCount++;

    // Mark room availability as unavailable for booked dates
    if (b.status !== 'CANCELLED') {
      const checkIn = new Date(b.checkIn);
      const checkOut = new Date(b.checkOut);
      const dates: Date[] = [];
      for (
        let d = new Date(checkIn);
        d < checkOut;
        d.setDate(d.getDate() + 1)
      ) {
        dates.push(new Date(d));
      }
      for (const date of dates) {
        await prisma.roomAvailability.upsert({
          where: { roomId_date: { roomId, date } },
          update: { isAvailable: false },
          create: { roomId, date, isAvailable: false },
        });
      }
    }
  }

  return { bookingCount, paymentCount };
}

async function main() {
  const users = loadJson<UserSeed[]>('users.json');
  const hotels = loadJson<HotelSeed[]>('hotels.json');
  const reviews = loadJson<ReviewSeed[]>('reviews.json');
  const bookings = loadJson<BookingSeed[]>('bookings.json');

  const userMap = await seedUsers(users);
  const { hotelMap, roomMap } = await seedHotels(hotels);
  await seedReviews(reviews, userMap, hotelMap);
  const availabilityCount = await seedRoomAvailability(roomMap);
  const { bookingCount, paymentCount } = await seedBookings(
    bookings,
    userMap,
    roomMap,
  );

  console.log('Seed data created:', {
    users: Object.keys(userMap),
    hotels: Object.keys(hotelMap),
    rooms: Object.keys(roomMap),
    reviews: reviews.length,
    roomAvailability: availabilityCount,
    bookings: bookingCount,
    payments: paymentCount,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
