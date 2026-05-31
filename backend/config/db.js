import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`Đã kết nối MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Lỗi khi kết nối đến MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;