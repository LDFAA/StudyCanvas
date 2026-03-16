import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { 
  Search, 
  FileText, 
  Brain, 
  User, 
  Globe,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Browse = () => {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchPublicNotes();
  }, [searchQuery, selectedSubject]);

  const fetchData = async () => {
    try {
      const [subjectsRes] = await Promise.all([
        axios.get(`${API}/subjects`)
      ]);
      setSubjects(subjectsRes.data.subjects);
      await fetchPublicNotes();
      await fetchPublicQuizzes();
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicNotes = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedSubject && selectedSubject !== "all") params.append("subject", selectedSubject);
      
      const response = await axios.get(`${API}/public/notes?${params.toString()}`);
      setNotes(response.data.notes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  const fetchPublicQuizzes = async () => {
    try {
      const params = selectedSubject && selectedSubject !== "all" ? `?subject=${selectedSubject}` : "";
      const response = await axios.get(`${API}/public/quizzes${params}`);
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="browse-page">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl tracking-tight font-light text-stone-900 dark:text-stone-100 mb-4">
          Browse Study Materials
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          Discover public notes and quizzes shared by the community
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
            data-testid="search-input"
          />
        </div>
        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className="w-full md:w-48 rounded-full" data-testid="subject-filter">
            <SelectValue placeholder="All subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {subjects.map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content Tabs */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="notes" data-testid="notes-tab">
            <FileText className="w-4 h-4 mr-2" />
            Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="quizzes" data-testid="quizzes-tab">
            <Brain className="w-4 h-4 mr-2" />
            Quizzes ({quizzes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-6">
          {notes.length === 0 ? (
            <Card className="border-stone-200 dark:border-stone-800 border-dashed max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Globe className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                  No public notes yet
                </h3>
                <p className="text-stone-500 dark:text-stone-400">
                  {isAuthenticated ? "Be the first to share!" : "Sign in to share your notes"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => (
                <Link key={note.id} to={`/note/${note.id}`}>
                  <Card className="border-stone-200 dark:border-stone-800 shadow-soft card-hover h-full" data-testid={`public-note-${note.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getSubjectColor(note.subject)} text-xs`}>
                          {note.subject}
                        </Badge>
                      </div>
                      <CardTitle className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 line-clamp-1">
                        {note.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-2 mb-4">
                        {note.content.substring(0, 150)}...
                      </CardDescription>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <User className="w-3.5 h-3.5" />
                        {note.user_name}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          {quizzes.length === 0 ? (
            <Card className="border-stone-200 dark:border-stone-800 border-dashed max-w-md mx-auto">
              <CardContent className="py-12 text-center">
                <Brain className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
                <h3 className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                  No public quizzes yet
                </h3>
                <p className="text-stone-500 dark:text-stone-400">
                  {isAuthenticated ? "Generate and share a quiz!" : "Sign in to create quizzes"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map((quiz) => (
                <Link key={quiz.id} to={isAuthenticated ? `/quiz/${quiz.id}` : "/auth"}>
                  <Card className="border-stone-200 dark:border-stone-800 shadow-soft card-hover h-full" data-testid={`public-quiz-${quiz.id}`}>
                    <CardHeader className="pb-2">
                      {quiz.note && (
                        <Badge className={`${getSubjectColor(quiz.note.subject)} text-xs w-fit`}>
                          {quiz.note.subject}
                        </Badge>
                      )}
                      <CardTitle className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 line-clamp-1">
                        {quiz.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-stone-500 dark:text-stone-400">
                          {quiz.questions?.length || 0} questions
                        </span>
                        <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                          <User className="w-3.5 h-3.5" />
                          {quiz.user_name}
                        </div>
                      </div>
                      {!isAuthenticated && (
                        <p className="text-xs text-primary mt-2">
                          Sign in to take this quiz
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Browse;


