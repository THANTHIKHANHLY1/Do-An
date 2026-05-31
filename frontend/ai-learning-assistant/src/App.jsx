import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Auth Pages
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";

// Main Pages
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ProfilePage from "./pages/Profile/ProfilePage";

// Documents
import DocumentListPage from "./pages/Documents/DocumentListPage";
import DocumentDetailPage from "./pages/Documents/DocumentDetailPage";

// Flashcards
import FlashcardsListPage from "./pages/Flashcards/FlashcardsListPage";
import FlashcardPage from "./pages/Flashcards/FlashcardPage";

// Quizzes
import QuizTakePage from "./pages/Quizzes/QuizTakePage";
import QuizResultPage from "./pages/Quizzes/QuizResultPage";

// Study Plan
import StudyPlannerPage from "./pages/StudyPlan/StudyPlannerPage";
import StudyPlanDetail from "./pages/StudyPlan/StudyPlanDetail";
import StudyPlansListPage from "./pages/StudyPlan/StudyPlansListPage";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import NotFoundPage from "./pages/NotFoundPage";

import { useAuth } from "./context/AuthContext";

const App = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* ==================== REDIRECT ==================== */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ==================== AUTH ROUTES ==================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ==================== PROTECTED ROUTES ==================== */}
        <Route element={<ProtectedRoute />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Documents */}
          <Route path="/documents" element={<DocumentListPage />} />
          <Route path="/documents/:id" element={<DocumentDetailPage />} />

          {/* Flashcards */}
          <Route path="/flashcards" element={<FlashcardsListPage />} />
          <Route path="/documents/:id/flashcards" element={<FlashcardPage />} />

          {/* Quizzes */}
          <Route path="/quizzes/:quizId" element={<QuizTakePage />} />
          <Route path="/quizzes/:quizId/results" element={<QuizResultPage />} />

          {/* Study Planner */}
          <Route path="/study-planner" element={<StudyPlannerPage />} />
          <Route path="/study-plans" element={<StudyPlansListPage />} />
          <Route path="/study-plans/:id" element={<StudyPlanDetail />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
          
        </Route>

        {/* ==================== 404 ==================== */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;