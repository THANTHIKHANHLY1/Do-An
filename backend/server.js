import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import errorHandler from './middleware/errorHandler.js';

// Import các route
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import studyPlanRoutes from './routes/studyPlanRoutes.js'; // Giữ lại import này

// Thay thế __dirname trong ES6 Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Khởi tạo ứng dụng Express
const app = express();

// Kết nối tới MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Thư mục tĩnh dùng để lưu và truy cập tệp tải lên
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ====================== CÁC ROUTE ======================
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/study-plans', studyPlanRoutes);

app.use(errorHandler);

// Xử lý lỗi 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Không tìm thấy đường dẫn yêu cầu',
    statusCode: 404
  });
});

// Khởi động máy chủ
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy ở chế độ ${process.env.NODE_ENV} trên cổng ${PORT}`);
});

// Xử lý các Promise bị từ chối nhưng chưa được bắt lỗi
process.on('unhandledRejection', (err) => {
  console.error(`Lỗi: ${err.message}`);
  process.exit(1);
});