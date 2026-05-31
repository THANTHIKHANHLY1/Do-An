import Document from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import * as geminiService from '../utils/geminiService.js';
import { findRelevantChunks } from '../utils/textChunker.js';

// @desc    Tạo flashcard từ tài liệu
// @route   POST /api/ai/generate-flashcards
// @access  Private
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu hoặc tài liệu chưa sẵn sàng',
        statusCode: 404
      });
    }

    // Tạo flashcard bằng Gemini
    const cards = await geminiService.generateFlashcards(
      document.extractedText,
      parseInt(count)
    );

    // Lưu vào cơ sở dữ liệu
    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,
      cards: cards.map(card => ({
        question: card.question,
        answer: card.answer,
        difficulty: card.difficulty,
        reviewCount: 0,
        isStarred: false
      }))
    });

    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: 'Tạo flashcard thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo bài kiểm tra từ tài liệu
// @route   POST /api/ai/generate-quiz
// @access  Private
export const generateQuiz = async (req, res, next) => {
  try {
    const { documentId, numQuestions = 5, title } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu hoặc tài liệu chưa sẵn sàng',
        statusCode: 404
      });
    }

    // Tạo bài kiểm tra bằng Gemini
    const questions = await geminiService.generateQuiz(
      document.extractedText,
      parseInt(numQuestions)
    );

    // Lưu vào cơ sở dữ liệu
    const quiz = await Quiz.create({
      userId: req.user._id,
      documentId: document._id,
      title: title || `${document.title} - Quiz`,
      questions: questions,
      totalQuestions: questions.length,
      userAnswers: [],
      score: 0
    });

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Tạo bài kiểm tra thành công'
    });
  } catch (error) {
    next(error)
  }
};

// @desc    Tạo tóm tắt tài liệu
// @route   POST /api/ai/generate-summary
// @access  Private
export const generateSummary = async (req, res, next) => {
  try {
    const { documentId } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu hoặc tài liệu chưa sẵn sàng',
        statusCode: 404
      });
    }

    // Tạo tóm tắt bằng Gemini
    const summary = await geminiService.generateSummary(document.extractedText);

    res.status(200).json({
      success: true,
      data: {
        documentId: document._id,
        title: document.title,
        summary
      },
      message: 'Tạo tóm tắt thành công'
    });
  } catch (error) {
    next(error)
  }
};

// @desc    Trò chuyện với tài liệu
// @route   POST /api/ai/chat
// @access  Private
export const chat = async (req, res, next) => {
  try {
    const { documentId, question } = req.body;

    if (!documentId || !question) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp documentId và câu hỏi',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu hoặc tài liệu chưa sẵn sàng',
        statusCode: 404
      });
    }

    // Tìm các đoạn nội dung liên quan
    const relevantChunks = findRelevantChunks(document.chunks, question, 3);
    const chunkIndices = relevantChunks.map(c => c.chunkIndex);

    // Lấy hoặc tạo lịch sử trò chuyện
    let chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: document._id
    });

    if (!chatHistory) {
      chatHistory = await ChatHistory.create({
        userId: req.user._id,
        documentId: document._id,
        messages: []
      });
    }

    // Tạo phản hồi bằng Gemini
    const answer = await geminiService.chatWithContext(question, relevantChunks);

    // Lưu cuộc trò chuyện
    chatHistory.messages.push(
      {
        role: 'user',
        content: question,
        timestamp: new Date(),
        relevantChunks: []
      },
      {
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
        relevantChunks: chunkIndices
      }
    );

    await chatHistory.save();

    res.status(200).json({
      success: true,
      data: {
        question,
        answer,
        relevantChunks: chunkIndices,
        chatHistoryId: chatHistory._id
      },
      message: 'Tạo phản hồi thành công'
    });
  } catch (error) {
    next(error)
  }
};

// @desc    Giải thích khái niệm từ tài liệu
// @route   POST /api/ai/explain-concept
// @access  Private
export const explainConcept = async (req, res, next) => {
  try {
    const { documentId, concept } = req.body;

    if (!documentId || !concept) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp documentId và khái niệm',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài liệu hoặc tài liệu chưa sẵn sàng',
        statusCode: 404
      });
    }

    // Tìm các đoạn nội dung liên quan đến khái niệm
    const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
    const context = relevantChunks.map(c => c.content).join('\n\n');

    // Tạo phần giải thích bằng Gemini
    const explanation = await geminiService.explainConcept(concept, context);

    res.status(200).json({
      success: true,
      data: {
        concept,
        explanation,
        relevantChunks: relevantChunks.map(c => c.chunkIndex)
      },
      message: 'Tạo giải thích thành công'
    });
  } catch (error) {
    next(error)
  }
};

// @desc    Lấy lịch sử trò chuyện của tài liệu
// @route   GET /api/ai/chat-history/:documentId
// @access  Private
export const getChatHistory = async (req, res, next) => {
   try {
    const { documentId } = req.params;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp documentId',
        statusCode: 400
      });
    }

    const chatHistory = await ChatHistory.findOne({
      userId: req.user._id,
      documentId: documentId
    }).select('messages'); // Chỉ lấy mảng messages

    if (!chatHistory) {
      return res.status(200).json({
        success: true,
        data: [], // Trả về mảng rỗng nếu không có lịch sử trò chuyện
        message: 'Không tìm thấy lịch sử trò chuyện cho tài liệu này'
      });
    }

    res.status(200).json({
      success: true,
      data: chatHistory.messages,
      message: 'Lấy lịch sử trò chuyện thành công'
    });
  } catch (error) {
    next(error)
  }
};