const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// --- NEWS ---
router.get('/news', async (req, res) => {
  try {
    const news = await prisma.news.findMany({ orderBy: { date: 'desc' } });
    res.json(news);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- ANNOUNCEMENTS ---
router.get('/announcements', async (req, res) => {
  try {
    const ann = await prisma.announcement.findMany({ orderBy: { date: 'desc' } });
    res.json(ann);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, authorId, images, files, links } = req.body;
    const ann = await prisma.announcement.create({
      data: { 
        title, 
        content, 
        authorId,
        images: images || [],
        files: files || [],
        links: links || []
      }
    });
    res.json(ann);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- FEEDBACKS ---
router.get('/feedbacks', async (req, res) => {
  try {
    const fb = await prisma.feedback.findMany({ orderBy: { date: 'desc' } });
    res.json(fb);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/feedbacks', async (req, res) => {
  try {
    const { rating, comment, studentId, images } = req.body;
    console.log('Received feedback data:', { rating, comment, studentId, imagesCount: images?.length });
    const fb = await prisma.feedback.create({
      data: { 
        rating, 
        comment, 
        studentId,
        images: images || []
      }
    });
    res.json(fb);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- DOCUMENTS ---
router.get('/documents', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({ orderBy: { id: 'desc' } });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/documents', async (req, res) => {
  try {
    const { title, type, uploader, size, url } = req.body;
    const doc = await prisma.document.create({
      data: { title, type, uploader, size, url, date: 'Vừa xong' }
    });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- REELS ---
router.get('/reels', async (req, res) => {
  try {
    const reels = await prisma.reel.findMany({
      include: {
        likes: true,
        comments: true
      }
    });
    const formatted = reels.map(r => ({
      ...r,
      likes: r.likes.map(l => l.userId)
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/reels/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    
    const existing = await prisma.reelLike.findUnique({
      where: { reelId_userId: { reelId: id, userId } }
    });
    if (existing) {
      await prisma.reelLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.reelLike.create({ data: { reelId: id, userId } });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  // --- NOTIFICATIONS POLL ---
router.get('/notifications/poll', async (req, res) => {
  try {
    const { lastCheck, userId } = req.query;
    if (!lastCheck) return res.json({ newAnnouncements: [], newFeedbacks: [], newClubs: [], newPosts: [] });

    const date = new Date(lastCheck);
    
    const newAnnouncements = await prisma.announcement.findMany({
      where: { date: { gt: date } },
      orderBy: { date: 'desc' }
    });

    const fbWhere = { date: { gt: date } };
    if (userId) {
      fbWhere.studentId = userId;
    }
    const newFeedbacks = await prisma.feedback.findMany({
      where: fbWhere,
      orderBy: { date: 'desc' }
    });

    // Thêm kiểm tra Câu lạc bộ mới
    const newClubs = await prisma.club.findMany({
      where: { createdAt: { gt: date } },
      orderBy: { createdAt: 'desc' }
    });

    // Thêm kiểm tra Bài viết mới từ Admin (Giáo viên)
    const newPosts = await prisma.post.findMany({
      where: { 
        date: { gt: date },
        author: { role: 'TEACHER' } // Chỉ lấy bài do Admin/Giáo viên đăng
      },
      orderBy: { date: 'desc' },
      include: { author: { select: { name: true } } }
    });

    res.json({ newAnnouncements, newFeedbacks, newClubs, newPosts });
  } catch (error) {
    console.error('Lỗi poll notifications:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
