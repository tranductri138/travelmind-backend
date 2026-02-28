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
      name: 'Admin TravelMind',
      role: Role.ADMIN,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@travelmind.com' },
    update: {},
    create: {
      email: 'user@travelmind.com',
      password: await bcrypt.hash('User123!', 10),
      name: 'Demo User',
      role: Role.USER,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'linh@travelmind.com' },
    update: {},
    create: {
      email: 'linh@travelmind.com',
      password: await bcrypt.hash('User123!', 10),
      name: 'Nguyễn Thị Linh',
      role: Role.USER,
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'minh@travelmind.com' },
    update: {},
    create: {
      email: 'minh@travelmind.com',
      password: await bcrypt.hash('User123!', 10),
      name: 'Trần Văn Minh',
      role: Role.USER,
    },
  });

  const user4 = await prisma.user.upsert({
    where: { email: 'hoa@travelmind.com' },
    update: {},
    create: {
      email: 'hoa@travelmind.com',
      password: await bcrypt.hash('User123!', 10),
      name: 'Lê Thanh Hoa',
      role: Role.USER,
    },
  });

  const hotel1 = await prisma.hotel.upsert({
    where: { slug: 'duong-gia-hotel' },
    update: {},
    create: {
      name: 'Dương Gia Hotel',
      slug: 'duong-gia-hotel',
      description:
        'Dương Gia Hotel là khách sạn đạt chuẩn 3.5 sao mới khai trương ngày 1/1/2024 với thiết kế mới nhất theo phong cách Châu Âu. Dương Gia Hotel toạ lạc tại vị trí đắc địa nhất Đà Nẵng ngay sát biển Mỹ Khê, cách cầu Rồng 900m, cách cầu quay 500m và xung quanh là nhà hàng hải sản và các quán ăn đặc sản nổi tiếng Đà Nẵng. Khách sạn tổng 52 phòng rộng rãi, nội thất rất đẹp và sang trọng đầy đủ tiện nghi, phòng sàn lát gỗ hiện đại. Khách sạn Dương Gia có đội ngũ nhân viên vui vẻ nhiệt tình và vô cùng mến khách. Lưu trú tại đây du khách sẽ được tư vấn địa điểm vui chơi và ăn uống ngon rẻ. Đặc biệt khách sạn luôn luôn có khuyến mãi giá rẻ cho du khách đến nghỉ dưỡng tại đây.',
      address: 'Phường An Hải, Sơn Trà, Đà Nẵng',
      city: 'Đà Nẵng',
      country: 'Vietnam',
      latitude: 16.0720678,
      longitude: 108.2413471,
      stars: 5,
      rating: 4.5,
      amenities: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar'],
      images: [
        'https://duonggiahotel.vn/wp-content/uploads/2015/08/I5A9168-Edit.jpg',
        'https://duonggiahotel.vn/wp-content/uploads/2015/08/I5A9179-Edit.jpg',
        'https://duonggiahotel.vn/wp-content/uploads/2015/08/I5A9199-Edit.jpg',
      ],
      contactEmail: 'duonggiahoteldanang@gmail.com',
      contactPhone: '0983.728.286',
    },
  });

  const hotel2 = await prisma.hotel.upsert({
    where: { slug: 'hanoi-hotel' },
    update: {},
    create: {
      name: 'Hanoi Hotel',
      slug: 'hanoi-hotel',
      description:
        'Khách sạn Hà Nội là khách sạn Quốc tế đầu tiên tại Hà Nội với 218 phòng nghỉ tiện nghi, hiện đại và sang trọng. Đặc biệt, sở hữu vị trí trung tâm bên Hồ Giảng Võ thanh bình, kết nối thuận tiện với các văn phòng chính phủ, đại sứ quán, khu thương mại sầm suất, nhà hàng,… Khách sạn là điểm dừng chân lý tưởng cho du khách trong và ngoài nước mỗi khi có chuyến công tác hay du lịch cùng bạn bè và người thân. Bên cạnh đó, Khách sạn Hà Nội nổi tiếng là địa chỉ hàng đầu về ẩm thực Trung Hoa cùng các dịch vụ giải trí phong phú, hy vọng sẽ đem lại cho Quý khách những trải nghiệm thú vị và hài lòng nhất.',
      address: 'D8 P. Giảng Võ, Giảng Võ, Ba Đình, Hà Nội 10000, Việt Nam',
      city: 'Hà Nội',
      country: 'Vietnam',
      latitude: 21.0277717,
      longitude: 105.8215235,
      stars: 4,
      rating: 4.2,
      amenities: ['wifi', 'pool', 'beach', 'restaurant'],
      images: [
        'https://hanoihotel.com.vn/wp-content/uploads/2024/11/DSC_0514-1-scaled.webp',
        'https://hanoihotel.com.vn/wp-content/uploads/2024/11/Hanoi-Hotel-overview-1024x1024.jpg',
        'https://hanoihotel.com.vn/wp-content/uploads/2026/02/night-bar-web-768x1024.jpg',
      ],
      contactEmail: 'sales@hanoihotel.com.vn',
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

  // Reviews
  await prisma.review.createMany({
    skipDuplicates: true,
    data: [
      // Dương Gia Hotel
      {
        userId: user.id,
        hotelId: hotel1.id,
        rating: 5,
        title: 'Tuyệt vời, sẽ quay lại!',
        comment:
          'Phòng rất sạch sẽ và rộng rãi, view biển Mỹ Khê đẹp mê ly. Nhân viên nhiệt tình, buffet sáng ngon. Đặc biệt giá rất hợp lý so với chất lượng. Chắc chắn sẽ quay lại lần sau!',
      },
      {
        userId: user2.id,
        hotelId: hotel1.id,
        rating: 4,
        title: 'Vị trí đắc địa, phòng đẹp',
        comment:
          'Khách sạn gần biển, đi bộ 2 phút là tới. Phòng thiết kế theo phong cách châu Âu rất sang. Trừ 1 sao vì hồ bơi hơi nhỏ, nhưng nhìn chung rất hài lòng.',
      },
      {
        userId: user3.id,
        hotelId: hotel1.id,
        rating: 5,
        title: 'Nhân viên cực kỳ thân thiện',
        comment:
          'Mình đi cùng gia đình 4 người, được nhân viên tư vấn chỗ ăn hải sản ngon và rẻ. Phòng suite rộng, có ban công nhìn ra biển. Con mình rất thích hồ bơi. 10 điểm!',
      },
      {
        userId: user4.id,
        hotelId: hotel1.id,
        rating: 4,
        title: 'Đáng tiền, recommend cho ai đi Đà Nẵng',
        comment:
          'Check-in nhanh, phòng sạch, ga giường trắng tinh. Wifi mạnh, có minibar. Điểm trừ nhỏ là bãi đỗ xe hơi chật vào cuối tuần, nên đi taxi thì tiện hơn.',
      },
      // Hanoi Hotel
      {
        userId: user.id,
        hotelId: hotel2.id,
        rating: 4,
        title: 'Khách sạn lâu đời nhưng vẫn chất lượng',
        comment:
          'Khách sạn có lịch sử lâu đời, vị trí trung tâm Ba Đình rất thuận tiện đi lại. Phòng rộng, sạch sẽ. Nhà hàng Trung Hoa trong khách sạn nấu ăn rất ngon, đặc biệt món dimsum.',
      },
      {
        userId: user2.id,
        hotelId: hotel2.id,
        rating: 5,
        title: 'Ẩm thực xuất sắc, dịch vụ chu đáo',
        comment:
          'Đi công tác Hà Nội hay ở đây. Buffet sáng phong phú, có cả món Việt và món Tàu. Phòng yên tĩnh, ngủ rất ngon. Staff lễ tân nói tiếng Anh giỏi, hỗ trợ đặt taxi và tour rất nhanh.',
      },
      {
        userId: user3.id,
        hotelId: hotel2.id,
        rating: 4,
        title: 'Vị trí trung tâm, gần Hồ Giảng Võ',
        comment:
          'View hồ rất đẹp, sáng ra ngồi uống cà phê ở lobby nhìn hồ thư giãn lắm. Phòng hơi cũ một chút nhưng vẫn sạch sẽ và đầy đủ tiện nghi. Giá hợp lý cho khu vực Ba Đình.',
      },
      {
        userId: user4.id,
        hotelId: hotel2.id,
        rating: 3,
        title: 'Tạm ổn, cần nâng cấp',
        comment:
          'Vị trí tốt, nhân viên ok. Nhưng nội thất phòng đã cũ, cần renovate lại. Nước nóng lúc có lúc không. Hy vọng khách sạn sẽ nâng cấp trong thời gian tới.',
      },
    ],
  });

  console.log('Seed data created:', {
    admin: admin.email,
    users: [user.email, user2.email, user3.email, user4.email],
    hotels: [hotel1.name, hotel2.name],
    reviews: 8,
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
