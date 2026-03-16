import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Switch } from "../components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { 
  ArrowLeft, 
  Upload, 
  Sparkles, 
  Layers, 
  Brain, 
  Save, 
  Loader2,
  FileText,
  X
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COMMON_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "History", 
  "Geography", "English", "Literature", "Computer Science", "Economics",
  "Psychology", "Philosophy", "Art", "Music", "Languages",
  "Business", "Law", "Medicine", "Engineering", "Other"
];

const QUIZ_TYPES = [
  { id: "multiple_choice", label: "Multiple Choice" },
  { id: "true_false", label: "True / False" },
  { id: "short_answer", label: "Short Answer" },
  { id: "paragraph", label: "Paragraph" },
  { id: "essay", label: "Essay" }
];

const NoteEditor = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const isEditing = !!noteId;

  const [note, setNote] = useState({
    title: "",
    content: "",
    subject: "",
    is_public: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [improving, setImproving] = useState(false);
  const [generatingFlashcards, setGeneratingFlashcards] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [selectedQuizTypes, setSelectedQuizTypes] = useState(["multiple_choice", "true_false"]);
  const [quizCount, setQuizCount] = useState(5);

  useEffect(() => {
    if (isEditing) {
      fetchNote();
    }
  }, [noteId]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/notes/${noteId}`);
      setNote(response.data);
    } catch (error) {
      toast.error("Failed to load note");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = [".txt", ".pdf", ".docx", ".md"];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (!allowedTypes.includes(ext)) {
      toast.error("Unsupported file type. Use TXT, PDF, DOCX, or MD files.");
      return;
    }

    setUploadedFile(file);
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const response = await axios.post(`${API}/notes/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setNote(prev => ({
        ...prev,
        content: response.data.content,
        title: prev.title || file.name.replace(/\.[^/.]+$/, "")
      }));
      toast.success("File content extracted");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to process file");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note.title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!note.content.trim()) {
      toast.error("Please add some content");
      return;
    }
    if (!note.subject) {
      toast.error("Please select a subject");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await axios.put(`${API}/notes/${noteId}`, note);
        toast.success("Note saved");
      } else {
        const response = await axios.post(`${API}/notes`, note);
        toast.success("Note created");
        navigate(`/notes/${response.data.id}/edit`);
      }
    } catch (error) {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleImprove = async () => {
    if (!isEditing) {
      toast.error("Save your note first");
      return;
    }
    setImproving(true);
    try {
      const response = await axios.post(`${API}/notes/${noteId}/improve`);
      setNote(response.data);
      toast.success("Notes improved with AI");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to improve notes");
    } finally {
      setImproving(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    if (!isEditing) {
      toast.error("Save your note first");
      return;
    }
    setGeneratingFlashcards(true);
    try {
      await axios.post(`${API}/flashcards/generate`, { note_id: noteId });
      toast.success("Flashcards generated!");
      navigate(`/notes/${noteId}/flashcards`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate flashcards");
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!isEditing) {
      toast.error("Save your note first");
      return;
    }
    if (selectedQuizTypes.length === 0) {
      toast.error("Select at least one question type");
      return;
    }
    setGeneratingQuiz(true);
    try {
      const response = await axios.post(`${API}/quizzes/generate`, { 
        note_id: noteId,
        question_types: selectedQuizTypes,
        num_questions: quizCount
      });
      toast.success("Quiz generated!");
      navigate(`/quiz/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to generate quiz");
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const toggleQuizType = (typeId) => {
    setSelectedQuizTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  if (loading && isEditing) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6" data-testid="note-editor">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-light text-stone-900 dark:text-stone-100">
            {isEditing ? "Edit Note" : "Create Note"}
          </h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="rounded-full px-6"
          data-testid="save-note-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
            <CardContent className="pt-6 space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter note title..."
                  value={note.title}
                  onChange={(e) => setNote({ ...note, title: e.target.value })}
                  className="text-lg font-heading"
                  data-testid="note-title-input"
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={note.subject} onValueChange={(v) => setNote({ ...note, subject: v })}>
                  <SelectTrigger data-testid="subject-select">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_SUBJECTS.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Import from file</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.pdf,.docx,.md"
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full"
                    disabled={loading}
                    data-testid="upload-file-btn"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-400">
                      <FileText className="w-4 h-4" />
                      {uploadedFile.name}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setUploadedFile(null)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-stone-500">Supports TXT, PDF, DOCX, MD files</p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste or type your study notes here..."
                  value={note.content}
                  onChange={(e) => setNote({ ...note, content: e.target.value })}
                  className="min-h-[400px] font-body leading-relaxed resize-none"
                  data-testid="note-content-input"
                />
              </div>

              {/* Public Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-stone-200 dark:border-stone-800">
                <div>
                  <Label htmlFor="public">Make Public</Label>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Allow others to view and study from your notes
                  </p>
                </div>
                <Switch
                  id="public"
                  checked={note.is_public}
                  onCheckedChange={(v) => setNote({ ...note, is_public: v })}
                  data-testid="public-toggle"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - AI Tools */}
        <div className="space-y-4">
          {/* Improve Notes */}
          <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Improve Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                Let AI enhance your notes with better structure and clarity
              </p>
              <Button
                onClick={handleImprove}
                disabled={improving || !isEditing}
                className="w-full rounded-full"
                variant="secondary"
                data-testid="improve-notes-btn"
              >
                {improving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Improve with AI
              </Button>
            </CardContent>
          </Card>

          {/* Generate Flashcards */}
          <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-medium flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                Flashcards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-4">
                Generate flashcards from your notes for memorization
              </p>
              <Button
                onClick={handleGenerateFlashcards}
                disabled={generatingFlashcards || !isEditing}
                className="w-full rounded-full bg-accent hover:bg-emerald-600"
                data-testid="generate-flashcards-btn"
              >
                {generatingFlashcards ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
                Generate Flashcards
              </Button>
            </CardContent>
          </Card>

          {/* Generate Quiz */}
          <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-lg font-medium flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Quiz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-stone-600 dark:text-stone-400">
                Create a quiz to test your knowledge
              </p>
              
              {/* Question Types */}
              <div className="space-y-2">
                <Label className="text-xs">Question Types</Label>
                <div className="space-y-2">
                  {QUIZ_TYPES.map((type) => (
                    <div key={type.id} className="flex items-center gap-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedQuizTypes.includes(type.id)}
                        onCheckedChange={() => toggleQuizType(type.id)}
                        data-testid={`quiz-type-${type.id}`}
                      />
                      <Label htmlFor={type.id} className="text-sm font-normal cursor-pointer">
                        {type.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Number of Questions */}
              <div className="space-y-2">
                <Label className="text-xs">Number of Questions</Label>
                <Select value={quizCount.toString()} onValueChange={(v) => setQuizCount(parseInt(v))}>
                  <SelectTrigger data-testid="quiz-count-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 5, 7, 10, 15].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerateQuiz}
                disabled={generatingQuiz || !isEditing}
                className="w-full rounded-full bg-purple-600 hover:bg-purple-700"
                data-testid="generate-quiz-btn"
              >
                {generatingQuiz ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
                Generate Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;


