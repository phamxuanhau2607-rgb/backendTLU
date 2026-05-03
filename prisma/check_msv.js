require('dotenv').config();
const prisma = require('../src/config/db');

async function main() {
  const msv = '2251068193';
  console.log(`Checking for users with MSV: ${msv}`);
  const users = await prisma.user.findMany({
    where: { OR: [{ msv }, { username: msv }] }
  });
  
  if (users.length > 0) {
    console.log(`Found ${users.length} users with this MSV or Username.`);
    users.forEach(u => console.log(`- ID: ${u.id}, Name: ${u.name}, Username: ${u.username}`));
  } else {
    console.log('No users found with this MSV.');
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  process.exit(0);
});
