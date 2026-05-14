require('dotenv').config();
const express = require('express');
const cors = require('cors');
const prisma = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Basic Route to check health and DB connection
app.get('/api/health', async (req, res) => {
  try {
    // Attempt a simple query to verify Prisma connection
    const result = await prisma.$queryRaw`SELECT NOW()`;
    res.status(200).json({
      status: 'success',
      message: 'Backend API is running smoothly with Prisma',
      db_time: result,
    });
  } catch (error) {
    console.error('Database connection error in health check:', error);
    res.status(500).json({
      status: 'error',
      message: 'Backend API is running, but database connection failed',
      error: error.message,
    });
  }
});

// Import API routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/auth.routes')); // Reuse same router for now since users / is there
app.use('/api/posts', require('./routes/posts.routes'));
app.use('/api/clubs', require('./routes/clubs.routes'));
app.use('/api/chats', require('./routes/chats.routes'));
app.use('/api/misc', require('./routes/misc.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});
 
