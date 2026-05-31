import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Vui lòng nhập tên người dùng'],
    unique: true,
    trim: true,
    minlength: [3, 'Tên người dùng phải có ít nhất 3 ký tự']
  },
  email: {
    type: String,
    required: [true, 'Vui lòng nhập địa chỉ email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Vui lòng nhập email hợp lệ']
  },
  password: {
    type: String,
    required: [true, 'Vui lòng nhập mật khẩu'],
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false
  },
  profileImage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Phương thức so sánh mật khẩu
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;