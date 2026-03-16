import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  ArrowLeft, 
  User, 
  Globe, 
  Layers, 
  Brain, 
  Loader2,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NoteView = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNote();
  }, [noteId]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      // For public notes, we can fetch without auth
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await axios.get(`${API}/notes/${noteId}`, config);
      setNote(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error("This note is private");
        navigate("/browse");
      } else {
        toast.error("Failed to load note");
        navigate("/browse");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    try {
      await axios.post(`${API}/flashcards/generate`, { note_id: noteId });
      toast.success("Flashcards generated!");
      navigate(`/notes/${noteId}/flashcards`);
    } catch (error) {
      toast.error("Failed to generate flashcards");
    }
  };

  const handleGenerateQuiz = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    try {
      const response = await axios.post(`${API}/quizzes/generate`, { 
        note_id: noteId,
        question_types: ["multiple_choice", "true_false"],
        num_questions: 5
      });
      toast.success("Quiz generated!");
      navigate(`/quiz/${response.data.id}`);
    } catch (error) {
      toast.error("Failed to generate quiz");
    }
  };

  const subjectColors = {
    math: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    science: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    history: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    english: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    default: "bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300"
  };

  const getSubjectColor = (subject) => {
    const key = subject?.toLowerCase() || "";
    return subjectColors[key] || subjectColors.default;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="note-view">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/browse">
          <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${getSubjectColor(note.subject)} text-xs`}>
              {note.subject}
            </Badge>
            <Globe className="w-3.5 h-3.5 text-accent" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-light text-stone-900 dark:text-stone-100">
            {note.title}
          </h1>
        </div>
      </div>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          {note.user_name}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {formatDate(note.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleGenerateFlashcards}
          variant="secondary"
          className="rounded-full"
          data-testid="generate-flashcards-btn"
        >
          <Layers className="w-4 h-4 mr-2" />
          Study Flashcards
        </Button>
        <Button
          onClick={handleGenerateQuiz}
          className="rounded-full bg-purple-600 hover:bg-purple-700"
          data-testid="generate-quiz-btn"
        >
          <Brain className="w-4 h-4 mr-2" />
          Take Quiz
        </Button>
      </div>

      {/* Content */}
      <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
        <CardContent className="pt-6">
          <div className="markdown-content prose prose-stone dark:prose-invert max-w-none">
            {note.content.split("\n").map((paragraph, idx) => (
              paragraph.trim() ? (
                <p key={idx} className="text-stone-700 dark:text-stone-300 leading-relaxed mb-4">
                  {paragraph}
                </p>
              ) : <br key={idx} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NoteView;

