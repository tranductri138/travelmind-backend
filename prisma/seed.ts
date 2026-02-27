import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@travelmind.com' },
    update: {},
    create: {
      email: 'admin@travelmind.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'TravelMind',
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@travelmind.com' },
    update: {},
    create: {
      email: 'user@travelmind.com',
      password: await bcrypt.hash('User123!', 10),
      firstName: 'Demo',
      lastName: 'User',
      role: Role.USER,
    },
  });

  const hotel1 = await prisma.hotel.upsert({
    where: { slug: 'grand-palace-hotel' },
    update: {},
    create: {
      name: 'Grand Palace Hotel',
      slug: 'grand-palace-hotel',
      description: 'A luxurious 5-star hotel in the heart of Ho Chi Minh City',
      address: '123 Nguyen Hue Boulevard',
      city: 'Ho Chi Minh City',
      country: 'Vietnam',
      latitude: 10.7731,
      longitude: 106.7030,
      stars: 5,
      rating: 4.5,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar'],
      images: ['https://example.com/grand-palace-1.jpg'],
      contactEmail: 'info@grandpalace.com',
      contactPhone: '+84-28-1234-5678',
    },
  });

  const hotel2 = await prisma.hotel.upsert({
    where: { slug: 'seaside-resort' },
    update: {},
    create: {
      name: 'Seaside Resort',
      slug: 'seaside-resort',
      description: 'Beautiful beachfront resort with stunning ocean views',
      address: '456 Beach Road',
      city: 'Da Nang',
      country: 'Vietnam',
      latitude: 16.0544,
      longitude: 108.2022,
      stars: 4,
      rating: 4.2,
      amenities: ['wifi', 'pool', 'beach', 'restaurant'],
      images: ['https://example.com/seaside-1.jpg'],
      contactEmail: 'info@seasideresort.com',
    },
  });

  await prisma.room.createMany({
    skipDuplicates: true,
    data: [
      {
        hotelId: hotel1.id,
        name: 'Deluxe Room',
        type: 'deluxe',
        price: 150,
        maxGuests: 2,
        amenities: ['wifi', 'minibar', 'tv'],
      },
      {
        hotelId: hotel1.id,
        name: 'Suite',
        type: 'suite',
        price: 300,
        maxGuests: 4,
        amenities: ['wifi', 'minibar', 'tv', 'jacuzzi', 'balcony'],
      },
      {
        hotelId: hotel2.id,
        name: 'Ocean View Room',
        type: 'standard',
        price: 120,
        maxGuests: 2,
        amenities: ['wifi', 'tv', 'ocean-view'],
      },
      {
        hotelId: hotel2.id,
        name: 'Beach Villa',
        type: 'villa',
        price: 500,
        maxGuests: 6,
        amenities: ['wifi', 'private-pool', 'kitchen', 'beach-access'],
      },
    ],
  });

  console.log('Seed data created:', { admin: admin.email, user: user.email, hotels: [hotel1.name, hotel2.name] });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
