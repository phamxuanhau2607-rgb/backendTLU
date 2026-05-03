const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { date: 'desc' },
      include: {
        likes: true,
        comments: {
          include: {
            replies: { include: { likes: true } },
            likes: true
          }
        }
      }
    });

    // Format to match frontend structure
    const formattedPosts = posts.map(p => ({
      ...p,
      date: p.date.toISOString(),
      likes: p.likes.map(l => l.userId),
      comments: p.comments.filter(c => !c.parentId).map(c => ({
        ...c,
        date: c.date.toISOString(),
        likes: c.likes.map(l => l.userId),
        replies: c.replies.map(r => ({
          ...r,
          date: r.date.toISOString(),
          likes: r.likes.map(rl => rl.userId)
        }))
      }))
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Create a post
router.post('/', async (req, res) => {
  try {
    const { content, images, authorId, clubId, visibility, feeling, taggedUserIds, files } = req.body;
    
    const newPost = await prisma.post.create({
      data: {
        content,
        authorId,
        images: images || [],
        clubId: clubId || null,
        visibility: visibility || 'PUBLIC',
        feeling: feeling || null,
        taggedUserIds: taggedUserIds || [],
        files: files || []
      },
      include: {
        likes: true,
        comments: true
      }
    });
    
    newPost.likes = [];
    newPost.comments = [];
    res.json(newPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Toggle Post Like
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const existingLike = await prisma.postLike.findUnique({
      where: { postId_userId: { postId: id, userId } }
    });

    if (existingLike) {
      await prisma.postLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.postLike.create({ data: { postId: id, userId } });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Add Comment
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { content, authorId, parentId } = req.body; // parentId is for replies

    const newComment = await prisma.comment.create({
      data: {
        content,
        authorId,
        postId: id,
        parentId: parentId || null
      },
      include: {
        likes: true,
        replies: true
      }
    });

    res.json(newComment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Toggle Comment Like
router.post('/comments/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    const existingLike = await prisma.commentLike.findUnique({
      where: { commentId_userId: { commentId, userId } }
    });

    if (existingLike) {
      await prisma.commentLike.delete({ where: { id: existingLike.id } });
    } else {
      await prisma.commentLike.create({ data: { commentId, userId } });
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
