const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log("--- KẾT QUẢ TỪ DATABASE POSTGRESQL TẠI vacb.slothz.site ---");

  const users = await prisma.user.count();
  const posts = await prisma.post.count();
  const comments = await prisma.comment.count();
  const feedbacks = await prisma.feedback.count();
  const documents = await prisma.document.count();

  console.log(`Số lượng Users: ${users}`);
  console.log(`Số lượng Posts: ${posts}`);
  console.log(`Số lượng Comments: ${comments}`);
  console.log(`Số lượng Feedbacks: ${feedbacks}`);
  console.log(`Số lượng Documents: ${documents}`);

  console.log("\n--- BÀI VIẾT GẦN NHẤT ---");
  const latestPost = await prisma.post.findFirst({
    orderBy: { date: 'desc' },
    include: { author: true }
  });
  if (latestPost) {
    console.log(`Tác giả: ${latestPost.author.name}`);
    console.log(`Nội dung: ${latestPost.content}`);
  }

  process.exit(0);
}

main().catch(console.error);
