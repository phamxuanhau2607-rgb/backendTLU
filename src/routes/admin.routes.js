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

    // Lấy số phản ánh mới trong 24h qua
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const recentFeedbacksCount = await prisma.feedback.count({
      where: { date: { gte: yesterday } }
    });

    const activeClubs = await prisma.club.count({
      where: { _count: { posts: { gt: 0 } } }
    });

    res.json({
      totalUsers,
      totalPosts,
      totalFeedbacks,
      totalClubs,
      recentFeedbacks: recentFeedbacksCount,
      activeClubs: activeClubs
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

// --- LƯU TRỮ (STORAGE) ---
router.get('/storage', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({ select: { images: true, files: true } });
    const feedbacks = await prisma.feedback.findMany({ select: { images: true } });
    const docs = await prisma.document.count();

    let imageCount = 0;
    posts.forEach(p => {
      if (p.images) imageCount += p.images.length;
    });
    feedbacks.forEach(f => {
      if (f.images) imageCount += f.images.length;
    });

    // Giả định trung bình 1 ảnh = 2MB, 1 tài liệu = 5MB
    const imageStorageMB = imageCount * 2;
    const docStorageMB = docs * 5;

    res.json({
      images: {
        count: imageCount,
        usedMB: imageStorageMB,
        totalMB: 5000 // 5GB limit
      },
      documents: {
        count: docs,
        usedMB: docStorageMB,
        totalMB: 15000 // 15GB limit
      }
    });
  } catch (error) {
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

router.post('/users', async (req, res) => {
  try {
    const { name, username, password, role, msv, mgv, avatar } = req.body;
    const user = await prisma.user.create({
      data: { name, username, password, role, msv, mgv, avatar }
    });
    res.json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { name, role, msv, mgv, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, role, msv, mgv, avatar }
    });
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete user error:', error);
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

router.post('/posts', async (req, res) => {
  try {
    const { content, authorId, images } = req.body;
    const post = await prisma.post.create({
      data: {
        content,
        authorId,
        images: images || [],
        visibility: 'PUBLIC'
      },
      include: {
        author: { select: { name: true, avatar: true, msv: true, role: true } }
      }
    });
    res.json(post);
  } catch (error) {
    console.error('Create post error:', error);
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

router.post('/clubs', async (req, res) => {
  try {
    const { name, description, isPrivate, ownerId, avatar } = req.body;
    const club = await prisma.club.create({
      data: { name, description, isPrivate, ownerId, avatar },
      include: {
        owner: { select: { name: true, avatar: true } },
        _count: { select: { members: true, posts: true } }
      }
    });
    res.json(club);
  } catch (error) {
    console.error('Create club error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/clubs/:id', async (req, res) => {
  try {
    await prisma.club.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete club error:', error);
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

router.delete('/announcements/:id', async (req, res) => {
  try {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete announcement error:', error);
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

router.post('/documents', async (req, res) => {
  try {
    const { title, type, uploader, date, size, url } = req.body;
    const doc = await prisma.document.create({
      data: { title, type, uploader, date, size, url }
    });
    res.json(doc);
  } catch (error) {
    console.error('Create document error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

router.delete('/documents/:id', async (req, res) => {
  try {
    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Xóa thành công' });
  } catch (error) {
    console.error('Delete document error:', error);
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
