import { PrismaClient, Role } from '@prisma/client';
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
  const created: Record<string, string> = {};

  for (const h of hotels) {
    const { rooms, ...hotelData } = h;

    const hotel = await prisma.hotel.upsert({
      where: { slug: h.slug },
      update: {},
      create: hotelData,
    });
    created[h.slug] = hotel.id;

    if (rooms?.length) {
      await prisma.room.createMany({
        skipDuplicates: true,
        data: rooms.map((r) => ({ ...r, hotelId: hotel.id })),
      });
    }
  }

  return created;
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

async function main() {
  const users = loadJson<UserSeed[]>('users.json');
  const hotels = loadJson<HotelSeed[]>('hotels.json');
  const reviews = loadJson<ReviewSeed[]>('reviews.json');

  const userMap = await seedUsers(users);
  const hotelMap = await seedHotels(hotels);
  await seedReviews(reviews, userMap, hotelMap);

  console.log('Seed data created:', {
    users: Object.keys(userMap),
    hotels: Object.keys(hotelMap),
    reviews: reviews.length,
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
