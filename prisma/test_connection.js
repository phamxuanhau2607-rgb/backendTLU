const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing connection...');
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Connection successful:', result);
    const users = await prisma.user.findMany({ take: 5 });
    console.log('Users found:', users.length);
  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
