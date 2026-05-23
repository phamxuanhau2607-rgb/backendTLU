const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình Multer để lưu file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Giới hạn kích thước file 15MB
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } 
});

// --- API UPLOAD FILE ---
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file tải lên' });
    }
    
    // Trả về đường dẫn tương đối để frontend sử dụng
    // Backend đang chạy ở cổng 5000, file sẽ nằm ở /uploads/filename.ext
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Upload thành công',
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  } catch (error) {
    console.error('Lỗi upload file:', error);
    res.status(500).json({ message: 'Lỗi server khi upload' });
  }
});

module.exports = router;
