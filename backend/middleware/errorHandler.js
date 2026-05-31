const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi máy chủ';

  // Lỗi ObjectId không hợp lệ của Mongoose
  if (err.name === 'CastError') {
    message = 'Không tìm thấy tài nguyên';
    statusCode = 404;
  }

  // Lỗi trùng khóa của Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} đã tồn tại`;
    statusCode = 400;
  }

  // Lỗi xác thực dữ liệu của Mongoose
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // Lỗi kích thước file của Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    message = 'Kích thước file vượt quá giới hạn tối đa 10MB';
    statusCode = 400;
  }

  // Lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    message = 'Token không hợp lệ';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token đã hết hạn';
    statusCode = 401;
  }

  console.error('Lỗi:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export default errorHandler;