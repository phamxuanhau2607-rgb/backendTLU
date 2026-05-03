const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// Get all clubs
router.get('/', async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    // format memberCount
    const formatted = clubs.map(c => ({
      ...c,
      memberCount: c._count.members,
      _count: undefined
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create club
router.post('/', async (req, res) => {
  try {
    const { name, avatar, userId } = req.body;
    
    const newClub = await prisma.club.create({
      data: {
        name,
        description: 'Cùng nhau xây dựng cộng đồng!',
        avatar: avatar || 'https://upload.wikimedia.org/wikipedia/commons/2/2c/Default_pfp.svg',
        ownerId: userId,
        members: {
          create: [{ userId }] // Creator joins automatically
        },
        chats: {
          create: [{
            type: 'GROUP',
            name: name,
            participants: {
              create: [{ userId }]
            }
          }]
        }
      }
    });
    
    newClub.memberCount = 1;
    res.json(newClub);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Join club
router.post('/:id/join', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const membership = await prisma.clubMember.create({
      data: { clubId: id, userId }
    });

    // Also add to club's chat participants
    const clubChat = await prisma.chat.findFirst({ where: { clubId: id } });
    if (clubChat) {
      // Ignore error if already joined chat
      await prisma.chatParticipant.create({
        data: { chatId: clubChat.id, userId }
      }).catch(() => {});
    }

    res.json({ success: true, membership });
  } catch (error) {
    console.error(error);
    // Might fail if already joined (unique constraint)
    res.status(400).json({ message: 'Bạn đã tham gia câu lạc bộ này hoặc có lỗi xảy ra.' });
  }
});

// Leave club
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Check if user is the owner
    const club = await prisma.club.findUnique({ where: { id } });
    if (!club) return res.status(404).json({ message: 'Không tìm thấy câu lạc bộ' });
    if (club.ownerId === userId) {
      return res.status(403).json({ message: 'Chủ nhiệm không thể rời câu lạc bộ. Hãy giải tán hoặc nhường quyền trước.' });
    }

    // Remove from ClubMember
    await prisma.clubMember.deleteMany({
      where: { clubId: id, userId }
    });

    // Remove from ChatParticipant
    const clubChat = await prisma.chat.findFirst({ where: { clubId: id } });
    if (clubChat) {
      await prisma.chatParticipant.deleteMany({
        where: { chatId: clubChat.id, userId }
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
