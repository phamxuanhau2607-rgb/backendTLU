const prisma = require('../src/config/db');

async function main() {
  const chats = await prisma.chat.findMany({
    include: { messages: true, club: true }
  });
  chats.forEach(c => {
    console.log('Chat:', c.name || c.id, '| Messages count:', c.messages.length);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
