require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const USERS = [
  { 
    id: 'SV01', 
    username: '205106', 
    password: '123', 
    msv: '205106', 
    name: 'Phạm Xuân Hậu', 
    role: 'STUDENT', 
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
    bio: 'Đam mê lập trình và đá bóng. Rất vui được làm quen với mọi người! ⚽💻',
    socialLinks: {
      facebook: 'https://facebook.com/van-a',
      instagram: 'https://instagram.com/van_a_dev',
      gmail: 'vanna@gmail.com'
    }
  },
  { 
    id: 'SV02', 
    username: '205107', 
    password: '123', 
    msv: '205107', 
    name: 'Trần Thị B', 
    role: 'STUDENT', 
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
    bio: 'Thích đọc sách và đi du lịch. 📚✈️',
    socialLinks: {
      facebook: 'https://facebook.com/tran-b',
      instagram: 'https://instagram.com/tranthib',
      gmail: 'thib@gmail.com'
    }
  },
  { 
    id: 'GV01', 
    username: 'GV01', 
    password: '123', 
    mgv: 'GV01', 
    name: 'Thầy Lê C', 
    role: 'TEACHER', 
    department: 'Công nghệ thông tin',
    subject: 'Lập trình Web',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
    bio: 'Giảng viên chuyên ngành CNTT. Hỗ trợ sinh viên 24/7. 👨‍🏫',
    socialLinks: {
      facebook: 'https://facebook.com/thay-c',
      instagram: '',
      gmail: 'lec@tlus.edu.vn'
    }
  },
  { 
    id: 'GV02', 
    username: 'GV02', 
    password: '123', 
    mgv: 'GV02', 
    name: 'Cô Nguyễn D', 
    role: 'TEACHER', 
    department: 'Kinh tế',
    subject: 'Quản trị kinh doanh',
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
    bio: 'Giảng viên khoa Kinh tế. 📚',
    socialLinks: { facebook: '', instagram: '', gmail: 'nguyend@tlus.edu.vn' }
  },
];

const INITIAL_CLUBS = [
  { 
    id: 'C01', 
    name: 'CLB Tin Học', 
    description: 'Nơi giao lưu, học hỏi về công nghệ và lập trình.', 
    avatar: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=150',
    isPrivate: false
  },
  { 
    id: 'C02', 
    name: 'CLB Bóng Đá', 
    description: 'Đam mê trái bóng tròn.', 
    avatar: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=150',
    isPrivate: false
  },
];

async function main() {
  console.log('Bắt đầu seed dữ liệu...');

  // 1. Seed Users
  for (const user of USERS) {
    await prisma.user.upsert({
      where: { username: user.username },
      update: {},
      create: user,
    });
  }
  console.log('✅ Seeded Users');

  // 2. Seed Clubs
  for (const club of INITIAL_CLUBS) {
    await prisma.club.upsert({
      where: { id: club.id },
      update: {},
      create: club,
    });
  }
  console.log('✅ Seeded Clubs');

  // 3. Seed Club Memberships
  // SV01 is in C01
  const existingMember = await prisma.clubMember.findUnique({
    where: { userId_clubId: { userId: 'SV01', clubId: 'C01' } }
  });
  if (!existingMember) {
    await prisma.clubMember.create({
      data: { userId: 'SV01', clubId: 'C01' }
    });
  }
  console.log('✅ Seeded Club Members');

  // 4. Seed News
  const existingNews = await prisma.news.findFirst();
  if (!existingNews) {
    await prisma.news.createMany({
      data: [
        { id: '1', title: 'Phân hiệu Thủy Lợi tuyển sinh 2025', image: 'https://images.unsplash.com/photo-1541339907198-e08756eaa43f?auto=format&fit=crop&q=80&w=800' },
        { id: '2', title: 'Hội thảo khoa học công nghệ xanh', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800' },
      ]
    });
    console.log('✅ Seeded News');
  }

  // 5. Seed Documents
  const existingDoc = await prisma.document.findFirst();
  if (!existingDoc) {
    await prisma.document.createMany({
      data: [
        { id: '1', title: 'Đề cương Ôn tập Mạng máy tính', type: 'word', uploader: 'Nguyễn Văn A', date: '2 giờ trước', size: '2.4 MB' },
        { id: '2', title: 'Slide Bài giảng Chương 3', type: 'pdf', uploader: 'GV. Trần Thị B', date: 'Hôm qua', size: '5.1 MB' },
      ]
    });
    console.log('✅ Seeded Documents');
  }

  // 6. Seed Posts (just 1 for example)
  const existingPost = await prisma.post.findUnique({ where: { id: 'P01' } });
  if (!existingPost) {
    await prisma.post.create({
      data: {
        id: 'P01',
        content: 'Khu quân sự cơ sở 2 đẹp quá các bạn ơi! Gió mát, không khí trong lành cực kỳ 🍃✨',
        authorId: 'SV01',
        images: ['https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800'],
        comments: {
          create: [
            { id: 'C01', authorId: 'SV02', content: 'Đúng rồi, chiều ra đây ngồi chill hết sảy' }
          ]
        }
      }
    });
    console.log('✅ Seeded Posts');
  }

  console.log('🎉 Seed hoàn tất!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
