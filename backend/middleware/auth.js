import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // Kiểm tra token có tồn tại trong header Authorization hay không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Xác thực token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Không tìm thấy người dùng',
          statusCode: 401
        });
      }

      next();
    } catch (error) {
      console.error('Lỗi middleware xác thực:', error.message);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token đã hết hạn',
          statusCode: 401
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Không được phép truy cập, token không hợp lệ',
        statusCode: 401
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Không được phép truy cập, không có token',
      statusCode: 401
    });
  }
};

export default protect;