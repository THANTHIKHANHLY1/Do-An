import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';

// @desc    Tải lên tài liệu PDF
// @route   POST /api/documents/upload
// @access  Private
export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng tải lên file PDF',
        statusCode: 400
      });
    }

    const { title } = req.body;

    if (!title) {
      // Xóa file đã tải lên nếu không có tiêu đề
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp tiêu đề tài liệu',
        statusCode: 400
      });
    }

    // Tạo URL cho file đã tải lên
    const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    // Tạo bản ghi tài liệu
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: fileUrl, // Lưu URL thay vì đường dẫn cục bộ
      fileSize: req.file.size,
      status: 'processing'
    });

    // Xử lý PDF ở chế độ nền (trong production có thể dùng hàng đợi như Bull)
    processPDF(document._id, req.file.path).catch(err => {
      console.error('Lỗi xử lý PDF:', err);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Tải tài liệu lên thành công. Đang xử lý...'
    });
  } catch (error) {
    // Xóa file nếu có lỗi
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
};

// Hàm hỗ trợ xử lý PDF
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);
    
    // Tạo các đoạn văn bản
    const chunks = chunkText(text, 500, 50);

    // Cập nhật tài liệu
    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: 'ready'
    });

    console.log(`Tài liệu ${documentId} đã được xử lý thành công`);
  } catch (error) {
    console.error(`Lỗi xử lý tài liệu ${documentId}:`, error);
    
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed'
    });
  }
};

// @desc    Lấy tất cả tài liệu của người dùng
// @route   GET /api/documents
// @access  Private
export const getDocuments = async (req, res, next) => {
  try {
   const documents = await Document.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(req.user._id) }
      },
      {
        $lookup: {
          from: 'flashcards',
          localField: '_id',
          foreignField: 'documentId',
          as: 'flashcardSets'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'documentId',
          as: 'quizzes'
        }
      },
      {
        $addFields: {
          flashcardCount: { $size: '$flashcardSets' },
          quizCount: { $size: '$quizzes' }
        }
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcardSets: 0,
          quizzes: 0
        }
      },
      {
        $sort: { uploadDate: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin một tài liệu cùng các đoạn nội dung
// @route   GET /api/documents/:id
// @access  Private
export const getDocument = async (req, res, next) => {
  try {
   const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu',
        statusCode: 404
      });
    }

    // Lấy số lượng flashcard và quiz liên quan
    const flashcardCount = await Flashcard.countDocuments({ documentId: document._id, userId: req.user._id });
    const quizCount = await Quiz.countDocuments({ documentId: document._id, userId: req.user._id });

    // Cập nhật thời gian truy cập gần nhất
    document.lastAccessed = Date.now();
    await document.save();

    // Kết hợp dữ liệu tài liệu với số lượng flashcard và quiz
    const documentData = document.toObject();
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa tài liệu
// @route   DELETE /api/documents/:id
// @access  Private
export const deleteDocument = async (req, res, next) => {
  try {
   const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu',
        statusCode: 404
      });
    }

    // Xóa file khỏi hệ thống
    await fs.unlink(document.filePath).catch(() => {});

    // Xóa tài liệu
    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa tài liệu thành công'
    });
  } catch (error) {
    next(error);
  }
};