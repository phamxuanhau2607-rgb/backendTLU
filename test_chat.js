const prisma = require('./src/config/db');

async function test() {
  const user = await prisma.user.findFirst();
  const chat = await prisma.chat.findFirst();
  
  console.log('Sending message to chat:', chat.id, 'from user:', user.id);
  
  const res = await fetch('http://localhost:5000/api/chats/' + chat.id + '/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'test backend', senderId: user.id })
  });
  
  console.log('Status:', res.status);
  console.log('Response:', await res.text());
}

test();
