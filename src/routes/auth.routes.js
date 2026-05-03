const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // In a real app, passwords should be hashed. Here we just match the mock logic.
    const userRecord = await prisma.user.findUnique({
      where: { username },
    });

    if (!userRecord || userRecord.password !== password) {
      return res.status(401).json({ message: 'Tài khoản hoặc mật khẩu không đúng' });
    }

    // Set online status
    const user = await prisma.user.update({
      where: { id: userRecord.id },
      data: { isOnline: true, lastSeen: new Date() },
      include: { memberships: true }
    });

    const formattedUser = {
      ...user,
      joinedClubs: user.memberships.map(m => m.clubId)
    };
    
    // Don't send password back
    delete formattedUser.password;
    delete formattedUser.memberships;

    res.json({ user: formattedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Guest Login Endpoint (for Zalo mock flow)
router.post('/guest-login', async (req, res) => {
  try {
    const { username, name, avatar, role, department, subject } = req.body;
    if (!username || !name || !role) {
      return res.status(400).json({ message: 'Thiếu thông tin Zalo' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { username },
      include: { memberships: true }
    });

    if (!user) {
      // Create new user if not exists
      user = await prisma.user.create({
        data: {
          username,
          password: '123', // mock
          name,
          role,
          department: role === 'TEACHER' ? department : null,
          subject: role === 'TEACHER' ? subject : null,
          avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        },
        include: { memberships: true }
      });
    } else {
      // Update info from platform if changed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || user.name,
          avatar: avatar || user.avatar,
          // Update role/department if needed (for testing flexibility)
          role: role || user.role,
          department: role === 'TEACHER' ? (department || user.department) : null,
          subject: role === 'TEACHER' ? (subject || user.subject) : null,
        },
        include: { memberships: true }
      });
    }

    // Set online status (try-catch to prevent login failure if this minor update fails)
    let updatedUser = user;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { isOnline: true, lastSeen: new Date() },
        include: { memberships: true }
      });
    } catch (e) {
      console.warn('Could not set isOnline status:', e.message);
      // If update fails, use the 'user' object we already have
      // but we need memberships for joinedClubs
      if (!user.memberships) {
         const userWithMems = await prisma.user.findUnique({
           where: { id: user.id },
           include: { memberships: true }
         });
         updatedUser = userWithMems || user;
      }
    }

    const formattedUser = {
      ...updatedUser,
      joinedClubs: updatedUser.memberships ? updatedUser.memberships.map(m => m.clubId) : []
    };
    
    delete formattedUser.password;
    delete formattedUser.memberships;
    
    res.json({ user: formattedUser });
  } catch (error) {
    console.error('GUEST LOGIN ERROR:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// Update Profile Endpoint
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Updating profile for user ID: ${id}`);
    
    const { 
      name, bio, avatar, socialLinks, 
      msv, mgv, department, subject,
      nameColor, nameEffect, themeGradient,
      bannerUrl, bannerType, avatarFrame
    } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { 
        name, bio, avatar, socialLinks,
        msv: msv || null, 
        mgv: mgv || null,
        department, subject,
        nameColor, nameEffect, themeGradient,
        bannerUrl, bannerType, avatarFrame
      },
    });
    
    console.log('Profile updated successfully');
    res.json(updatedUser);
  } catch (error) {
    console.error('PROFILE UPDATE ERROR:', error);
    res.status(500).json({ 
      message: 'Lỗi server khi cập nhật hồ sơ', 
      error: error.message,
      code: error.code // Prisma error codes are useful
    });
  }
});

// Get all Users (for finding specific users or teachers)
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        memberships: true
      }
    });
    
    const formatted = users.map(u => {
      const { password, memberships, ...rest } = u;
      return {
        ...rest,
        joinedClubs: memberships.map(m => m.clubId)
      };
    });
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;
