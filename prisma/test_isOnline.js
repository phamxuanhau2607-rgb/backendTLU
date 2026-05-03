require('dotenv').config();
const prisma = require('../src/config/db');

async function main() {
  try {
    console.log('Attempting to query users with isOnline field...');
    const users = await prisma.user.findMany({
      take: 1,
      select: { isOnline: true }
    });
    console.log('Success! Field is accessible. Users found:', users.length);
  } catch (error) {
    console.error('FAILED to access isOnline field:', error.message);
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  process.exit(0);
});
