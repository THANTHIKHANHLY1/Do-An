import Quiz from '../models/Quiz.js';

// @desc    Lấy tất cả bài quiz của một tài liệu
// @route   GET /api/quizzes/:documentId
// @access  Private
export const getQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({
      userId: req.user._id,
      documentId: req.params.documentId
    })
      .populate('documentId', 'title fileName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy một bài quiz theo ID
// @route   GET /api/quizzes/quiz/:id
// @access  Private
export const getQuizById = async (req, res, next) => {
 try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài quiz',
        statusCode: 404
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Nộp câu trả lời bài quiz
// @route   POST /api/quizzes/:id/submit
// @access  Private
export const submitQuiz = async (req, res, next) => {
 try {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mảng câu trả lời',
        statusCode: 400
      });
    }

    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài quiz',
        statusCode: 404
      });
    }

    if (quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: 'Bài quiz đã được hoàn thành',
        statusCode: 400
      });
    }

    // Xử lý câu trả lời
    let correctCount = 0;
    const userAnswers = [];

    answers.forEach(answer => {
      const { questionIndex, selectedAnswer } = answer;
      
      if (questionIndex < quiz.questions.length) {
        const question = quiz.questions[questionIndex];
        const isCorrect = selectedAnswer === question.correctAnswer;
        
        if (isCorrect) correctCount++;
        
        userAnswers.push({
          questionIndex,
          selectedAnswer,
          isCorrect,
          answeredAt: new Date()
        });
      }
    });

    // Tính điểm
    const score = Math.round((correctCount / quiz.totalQuestions) * 100);

    // Cập nhật quiz
    quiz.userAnswers = userAnswers;
    quiz.score = score;
    quiz.completedAt = new Date();

    await quiz.save();

    res.status(200).json({
      success: true,
      data: {
        quizId: quiz._id,
        score,
        correctCount,
        totalQuestions: quiz.totalQuestions,
        percentage: score,
        userAnswers
      },
      message: 'Nộp bài quiz thành công'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy kết quả bài quiz
// @route   GET /api/quizzes/:id/results
// @access  Private
export const getQuizResults = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('documentId', 'title');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài quiz',
        statusCode: 404
      });
    }

    if (!quiz.completedAt) {
      return res.status(400).json({
        success: false,
        error: 'Bài quiz chưa được hoàn thành',
        statusCode: 400
      });
    }

    // Tạo kết quả chi tiết
    const detailedResults = quiz.questions.map((question, index) => {
      const userAnswer = quiz.userAnswers.find(a => a.questionIndex === index);
      
      return {
        questionIndex: index,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        selectedAnswer: userAnswer?.selectedAnswer || null,
        isCorrect: userAnswer?.isCorrect || false,
        explanation: question.explanation
      };
    });

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz._id,
          title: quiz.title,
          document: quiz.documentId,
          score: quiz.score,
          totalQuestions: quiz.totalQuestions,
          completedAt: quiz.completedAt
        },
        results: detailedResults
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa bài quiz
// @route   DELETE /api/quizzes/:id
// @access  Private
export const deleteQuiz = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài quiz',
        statusCode: 404
      });
    }

    await quiz.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa bài quiz thành công'
    });
  } catch (error) {
    next(error);
  }
};