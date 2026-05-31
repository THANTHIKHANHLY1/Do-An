import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Middleware xác thực dữ liệu đầu vào
const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Tên đăng nhập phải có ít nhất 3 ký tự'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Vui lòng cung cấp địa chỉ email hợp lệ'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Vui lòng cung cấp địa chỉ email hợp lệ'),
  body('password')
    .notEmpty()
    .withMessage('Mật khẩu là bắt buộc')
];

// Các tuyến đường công khai
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Các tuyến đường yêu cầu xác thực
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/change-password', protect, changePassword);

export default router;