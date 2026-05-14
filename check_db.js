require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    const count = await prisma.feedback.count();
    console.log('Total feedbacks in DB:', count);
    
    const last = await prisma.feedback.findFirst({
      orderBy: { date: 'desc' },
      include: { student: true }
    });
    console.log('Last feedback:', JSON.stringify(last, null, 2));
    
    const postsCount = await prisma.post.count();
    console.log('Total posts in DB:', postsCount);
  } catch (err) {
    console.error('DB ERROR:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
