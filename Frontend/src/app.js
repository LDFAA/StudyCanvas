import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./components/ThemeProvider";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NoteEditor from "./pages/NoteEditor";
import Flashcards from "./pages/Flashcards";
import Quiz from "./pages/Quiz";
import Browse from "./pages/Browse";
import NoteView from "./pages/NoteView";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/browse" element={<Layout><Browse /></Layout>} />
      <Route path="/note/:noteId" element={<Layout><NoteView /></Layout>} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>}
      />
      <Route
        path="/notes/new"
        element={<ProtectedRoute><Layout><NoteEditor /></Layout></ProtectedRoute>}
      />
      <Route
        path="/notes/:noteId/edit"
        element={<ProtectedRoute><Layout><NoteEditor /></Layout></ProtectedRoute>}
      />
      <Route
        path="/notes/:noteId/flashcards"
        element={<ProtectedRoute><Layout><Flashcards /></Layout></ProtectedRoute>}
      />
      <Route
        path="/quiz/:quizId"
        element={<ProtectedRoute><Layout><Quiz /></Layout></ProtectedRoute>}
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="studycanvas-theme">
      <AuthProvider>
        <BrowserRouter>
          <div className="noise-bg">
            <AppRoutes />
            <Toaster position="bottom-right" richColors />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}