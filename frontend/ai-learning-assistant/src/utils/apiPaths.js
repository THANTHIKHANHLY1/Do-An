export const BASE_URL = "http://localhost:8000";

export const API_PATHS = {
  AUTH: {
    REGISTER: "/api/auth/register",
    LOGIN: "/api/auth/login",
    GET_PROFILE: "/api/auth/profile",
    UPDATE_PROFILE: "/api/auth/profile",
    CHANGE_PASSWORD: "/api/auth/change-password",
  },

  DOCUMENTS: {
    UPLOAD: "/api/documents/upload",
    GET_DOCUMENTS: "/api/documents",
    GET_DOCUMENT_BY_ID: (id) => `/api/documents/${id}`,
    UPDATE_DOCUMENT: (id) => `/api/documents/${id}`,
    DELETE_DOCUMENT: (id) => `/api/documents/${id}`,
  },

  AI: {
    GENERATE_FLASHCARDS: "/api/ai/generate-flashcards",
    GENERATE_QUIZ: "/api/ai/generate-quiz",
    GENERATE_SUMMARY: "/api/ai/generate-summary",
    CHAT: "/api/ai/chat",
    EXPLAIN_CONCEPT: "/api/ai/explain-concept",
    GET_CHAT_HISTORY: (documentId) => `/api/ai/chat-history/${documentId}`,
  },

  FLASHCARDS: {
    GET_ALL_FLASHCARD_SETS: "/api/flashcards",
    GET_FLASHCARDS_FOR_DOC: (documentId) => `/api/flashcards/${documentId}`,
    REVIEW_FLASHCARD: (cardId) => `/api/flashcards/${cardId}/review`,
    TOGGLE_STAR: (cardId) => `/api/flashcards/${cardId}/star`,
    DELETE_FLASHCARD_SET: (id) => `/api/flashcards/${id}`,
  },

  QUIZZES: {
    GET_QUIZZES_FOR_DOC: (documentId) => `/api/quizzes/${documentId}`,
    GET_QUIZ_BY_ID: (id) => `/api/quizzes/quiz/${id}`,
    SUBMIT_QUIZ: (id) => `/api/quizzes/${id}/submit`,
    GET_QUIZ_RESULTS: (id) => `/api/quizzes/${id}/results`,
    DELETE_QUIZ: (id) => `/api/quizzes/${id}`,
  },

  PROGRESS: {
    GET_DASHBOARD: "/api/progress/dashboard",
  },

  STUDY_PLANS: {
    // Tạo kế hoạch mới (AI generate)
    CREATE: () => `/api/study-plans`,

    // Lấy tất cả kế hoạch của user
    GET_ALL: () => `/api/study-plans`,

    // Lấy chi tiết một kế hoạch
    GET_BY_ID: (id) => `/api/study-plans/${id}`,

    // Cập nhật tiến độ task (đánh dấu hoàn thành + ghi chú)
    UPDATE_TASK: (planId, taskIndex) => 
        `/api/study-plans/${planId}/task/${taskIndex}`,

    // Xóa kế hoạch
    DELETE: (id) => `/api/study-plans/${id}`,
  },
};
