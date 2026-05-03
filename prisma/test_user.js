const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing user creation...');
    const username = 'test_' + Math.random().toString(36).substr(2, 5);
    const user = await prisma.user.create({
      data: {
        username: username,
        name: 'Test User',
        password: '123',
        role: 'STUDENT'
      }
    });
    console.log('Success:', user);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
