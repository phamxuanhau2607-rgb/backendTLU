const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// --- CHATS ---
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query; // Assuming user ID is passed
    if (!userId) return res.status(400).json({ message: 'Missing userId' });

    const chats = await prisma.chat.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: { user: true }
        },
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedChats = chats.map(c => ({
      ...c,
      participants: c.participants.map(p => p.userId)
    }));

    res.json(formattedChats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create or Get Chat
router.post('/', async (req, res) => {
  try {
    const { userId, otherId } = req.body;
    if (!userId || !otherId) return res.status(400).json({ message: 'Missing user IDs' });

    // Try to find existing private chat between these two users
    const existingChats = await prisma.chat.findMany({
      where: {
        type: 'PRIVATE',
        AND: [
          { participants: { some: { userId: userId } } },
          { participants: { some: { userId: otherId } } }
        ]
      }
    });

    if (existingChats.length > 0) {
      return res.json(existingChats[0]);
    }

    // Create new chat
    const newChat = await prisma.chat.create({
      data: {
        type: 'PRIVATE',
        name: 'Private Chat',
        lastMessage: 'Hãy bắt đầu trò chuyện',
        time: 'Vừa xong',
        participants: {
          create: [
            { userId: userId },
            { userId: otherId }
          ]
        }
      }
    });

    res.json(newChat);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Send Message
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { text, senderId, isEmoji, replyToId, imageUrl, fileUrl, fileName, audioUrl } = req.body;

    const msg = await prisma.message.create({
      data: {
        text: text || '',
        senderId,
        chatId,
        isEmoji: isEmoji || false,
        replyToId: replyToId || null,
        imageUrl: imageUrl || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        audioUrl: audioUrl || null,
        time: 'Vừa xong'
      },
      include: {
        replyTo: true
      }
    });

    let lastMsgText = text;
    if (isEmoji) lastMsgText = 'Thả cảm xúc';
    if (imageUrl) lastMsgText = 'Đã gửi một ảnh';
    if (fileUrl) lastMsgText = `Đã gửi tệp: ${fileName}`;
    if (audioUrl) lastMsgText = 'Đã gửi một tin nhắn thoại';

    await prisma.chat.update({
      where: { id: chatId },
      data: { lastMessage: lastMsgText, time: 'Vừa xong' }
    });

    res.json(msg);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Delete Message (Unsend)
router.delete('/messages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message || message.senderId !== userId) {
      return res.status(403).json({ message: 'Không có quyền thu hồi' });
    }

    const deleted = await prisma.message.delete({
      where: { id }
    });

    res.json(deleted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// React to Message
router.post('/messages/:id/react', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const message = await prisma.message.findUnique({ where: { id } });
    if (!message) return res.status(404).json({ message: 'Not found' });

    let newLikes = [...message.likes];
    if (newLikes.includes(userId)) {
      newLikes = newLikes.filter(uId => uId !== userId); // Unlike
    } else {
      newLikes.push(userId); // Like
    }

    const updated = await prisma.message.update({
      where: { id },
      data: { likes: newLikes }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
