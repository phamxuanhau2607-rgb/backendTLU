const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("Đang xoá dữ liệu test...");

  // Delete all rows in specific tables, but KEEP User and Club so you can still login
  await prisma.commentLike.deleteMany({});
  await prisma.postLike.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.post.deleteMany({});
  
  await prisma.message.deleteMany({});
  await prisma.chatParticipant.deleteMany({});
  await prisma.chat.deleteMany({});
  
  await prisma.feedback.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.news.deleteMany({});
  await prisma.announcement.deleteMany({});
  
  console.log("✅ Đã xoá sạch các bài viết, tin nhắn, phản ánh, tài liệu test!");
  console.log("💡 Lưu ý: Các tài khoản User và Club vẫn được giữ lại để bạn có thể đăng nhập.");
  
  process.exit(0);
}

main().catch(console.error);
