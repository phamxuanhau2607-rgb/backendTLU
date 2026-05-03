const prisma = require('./src/config/db');

async function main() {
  const count = await prisma.message.deleteMany({
    where: { isDeleted: true }
  });
  console.log(`Deleted ${count.count} messages`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
