import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { 
  Plus, 
  FileText, 
  Layers, 
  Brain, 
  MoreVertical, 
  Trash2, 
  Edit, 
  Globe,
  Lock,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API}/notes`);
      setNotes(response.data);
    } catch (error) {
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm("Delete this note and all associated flashcards and quizzes?")) return;
    try {
      await axios.delete(`${API}/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    } catch (error) {
      toast.error("Failed to delete note");
    }
  };

  const togglePublic = async (note) => {
    try {
      const response = await axios.put(`${API}/notes/${note.id}`, {
        is_public: !note.is_public
      });
      setNotes(notes.map((n) => (n.id === note.id ? response.data : n)));
      toast.success(response.data.is_public ? "Note is now public" : "Note is now private");
    } catch (error) {
      toast.error("Failed to update note");
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
    const key = subject.toLowerCase();
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
    <div className="space-y-8" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl tracking-tight font-light text-stone-900 dark:text-stone-100">
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-stone-600 dark:text-stone-400 mt-1">
            Your study materials are ready
          </p>
        </div>
        <Link to="/notes/new">
          <Button className="rounded-full px-6" data-testid="create-note-btn">
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-heading font-medium text-stone-900 dark:text-stone-100">
                  {notes.length}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Layers className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-heading font-medium text-stone-900 dark:text-stone-100">
                  {notes.filter(n => n.is_public).length}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Public</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-heading font-medium text-stone-900 dark:text-stone-100">
                  {new Set(notes.map(n => n.subject)).size}
                </p>
                <p className="text-sm text-stone-500 dark:text-stone-400">Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes List */}
      <div>
        <h2 className="font-heading text-2xl font-medium text-stone-900 dark:text-stone-100 mb-4">
          Your Notes
        </h2>
        
        {notes.length === 0 ? (
          <Card className="border-stone-200 dark:border-stone-800 border-dashed">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
              <h3 className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
                No notes yet
              </h3>
              <p className="text-stone-500 dark:text-stone-400 mb-4">
                Create your first note to get started
              </p>
              <Link to="/notes/new">
                <Button className="rounded-full" data-testid="empty-create-note-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Note
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card 
                key={note.id} 
                className="border-stone-200 dark:border-stone-800 shadow-soft card-hover group"
                data-testid={`note-card-${note.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 truncate">
                        {note.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`${getSubjectColor(note.subject)} text-xs`}>
                          {note.subject}
                        </Badge>
                        {note.is_public ? (
                          <Globe className="w-3.5 h-3.5 text-accent" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-stone-400" />
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`note-menu-${note.id}`}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/notes/${note.id}/edit`} className="flex items-center cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublic(note)} className="cursor-pointer">
                          {note.is_public ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Make Private
                            </>
                          ) : (
                            <>
                              <Globe className="w-4 h-4 mr-2" />
                              Make Public
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(note.id)} 
                          className="text-destructive cursor-pointer"
                          data-testid={`delete-note-${note.id}`}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {note.content.substring(0, 150)}...
                  </CardDescription>
                  <div className="flex gap-2">
                    <Link to={`/notes/${note.id}/flashcards`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full rounded-full text-xs" data-testid={`flashcards-btn-${note.id}`}>
                        <Layers className="w-3.5 h-3.5 mr-1" />
                        Flashcards
                      </Button>
                    </Link>
                    <Link to={`/notes/${note.id}/edit`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full rounded-full text-xs" data-testid={`quiz-btn-${note.id}`}>
                        <Brain className="w-3.5 h-3.5 mr-1" />
                        Quiz
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

