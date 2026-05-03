const prisma = require('./src/config/db');

async function test() {
  try {
    const user = await prisma.user.findFirst();
    const chat = await prisma.chat.findFirst();
    
    const msg = await prisma.message.create({
      data: {
        text: 'test direct prisma',
        senderId: user.id,
        chatId: chat.id,
        isEmoji: false,
        replyToId: null,
        imageUrl: null,
        fileUrl: null,
        fileName: null,
        time: 'Vừa xong'
      }
    });
    console.log(msg);
  } catch (e) {
    console.error("PRISMA ERROR:", e);
  } finally {
    prisma.$disconnect();
  }
}

test();
