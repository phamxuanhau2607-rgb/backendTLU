const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// --- THỐNG KÊ (STATS) ---
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalPosts = await prisma.post.count();
    const totalFeedbacks = await prisma.feedback.count();
    const totalClubs = await prisma.club.count();

    res.json({
      totalUsers,
      totalPosts,
      totalFeedbacks,
      totalClubs
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.get('/chart-data', async (req, res) => {
  try {
    // Get counts for last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    }

    const chartData = await Promise.all(days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const postCount = await prisma.post.count({
        where: { date: { gte: day, lt: nextDay } }
      });
      const feedbackCount = await prisma.feedback.count({
        where: { date: { gte: day, lt: nextDay } }
      });

      return {
        date: day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        posts: postCount,
        feedbacks: feedbackCount
      };
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ NGƯỜI DÙNG ---
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        msv: true,
        mgv: true,
        avatar: true,
        createdAt: true,
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ BÀI ĐĂNG (CỘNG ĐỒNG) ---
router.get('/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { date: 'desc' },
      include: {
        author: {
          select: { name: true, avatar: true, msv: true, role: true }
        },
        _count: {
          select: { likes: true, comments: true }
        }
      }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({
      where: { id }
    });
    res.json({ message: 'Xóa bài viết thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ PHẢN ÁNH (FEEDBACK) ---
router.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await prisma.feedback.findMany({
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: { name: true, msv: true, avatar: true }
        }
      }
    });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/feedbacks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.feedback.delete({
      where: { id }
    });
    res.json({ message: 'Xóa phản ánh thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/feedbacks', async (req, res) => {
  try {
    const { studentId, rating, comment, images } = req.body;
    const fb = await prisma.feedback.create({
      data: {
        studentId,
        rating: parseInt(rating),
        comment,
        images: images || []
      },
      include: {
        student: { select: { name: true, msv: true, avatar: true } }
      }
    });
    res.json(fb);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.put('/feedbacks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;
    const fb = await prisma.feedback.update({
      where: { id },
      data: {
        rating: parseInt(rating),
        comment,
        images: images || []
      },
      include: {
        student: { select: { name: true, msv: true, avatar: true } }
      }
    });
    res.json(fb);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ CÂU LẠC BỘ (CLUBS) ---
router.get('/clubs', async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        owner: { select: { name: true, avatar: true } },
        _count: { select: { members: true, posts: true } }
      }
    });
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ THÔNG BÁO (ANNOUNCEMENTS) ---
router.get('/announcements', async (req, res) => {
  try {
    const ann = await prisma.announcement.findMany({
      orderBy: { date: 'desc' },
      include: {
        author: { select: { name: true } }
      }
    });
    res.json(ann);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, authorId, images } = req.body;
    const ann = await prisma.announcement.create({
      data: { 
        title, 
        content, 
        authorId,
        images: images || []
      }
    });
    res.json(ann);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ TÀI LIỆU (DOCUMENTS) ---
router.get('/documents', async (req, res) => {
  try {
    const docs = await prisma.document.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// --- QUẢN LÝ CÀI ĐẶT HỆ THỐNG (SETTINGS) ---
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // Update or create each setting
    const operations = Object.entries(settings).map(([key, value]) => {
      return prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    });

    await prisma.$transaction(operations);
    
    res.json({ message: 'Lưu cài đặt thành công' });
  } catch (error) {
    console.error('Save settings error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
