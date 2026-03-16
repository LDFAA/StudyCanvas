import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Shuffle, 
  Loader2,
  Layers,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Flashcards = () => {
  const { noteId } = useParams();
  const [note, setNote] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchFlashcards();
  }, [noteId]);

  const fetchFlashcards = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/flashcards/${noteId}`);
      setFlashcards(response.data.flashcards);
      setNote(response.data.note);
    } catch (error) {
      toast.error("Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const regenerateFlashcards = async () => {
    setRegenerating(true);
    try {
      const response = await axios.post(`${API}/flashcards/generate`, { note_id: noteId });
      setFlashcards(response.data.flashcards);
      setCurrentIndex(0);
      setFlipped(false);
      toast.success("Flashcards regenerated!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to regenerate flashcards");
    } finally {
      setRegenerating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setFlipped(false);
    toast.success("Cards shuffled!");
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") handleNext();
    else if (e.key === "ArrowLeft") handlePrev();
    else if (e.key === " " || e.key === "Enter") setFlipped(!flipped);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, flipped, flashcards]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="flashcards-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/notes/${noteId}/edit`}>
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-light text-stone-900 dark:text-stone-100">
              Flashcards
            </h1>
            {note && (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                {note.title}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={regenerateFlashcards}
          disabled={regenerating}
          className="rounded-full"
          data-testid="regenerate-btn"
        >
          {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Regenerate
        </Button>
      </div>

      {flashcards.length === 0 ? (
        <Card className="border-stone-200 dark:border-stone-800 border-dashed">
          <CardContent className="py-12 text-center">
            <Layers className="w-12 h-12 text-stone-300 dark:text-stone-600 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-medium text-stone-900 dark:text-stone-100 mb-2">
              No flashcards yet
            </h3>
            <p className="text-stone-500 dark:text-stone-400 mb-4">
              Generate flashcards from your notes
            </p>
            <Button 
              onClick={regenerateFlashcards}
              disabled={regenerating}
              className="rounded-full"
              data-testid="generate-first-btn"
            >
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Layers className="w-4 h-4 mr-2" />}
              Generate Flashcards
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
              <span>Card {currentIndex + 1} of {flashcards.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Flashcard */}
          <div 
            className="flashcard-container h-[300px] md:h-[400px] cursor-pointer"
            onClick={() => setFlipped(!flipped)}
            data-testid="flashcard"
          >
            <div className={`flashcard relative w-full h-full ${flipped ? "flipped" : ""}`}>
              {/* Front */}
              <Card className="flashcard-face border-stone-200 dark:border-stone-800 shadow-soft h-full">
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <span className="text-xs uppercase tracking-wide text-stone-400 dark:text-stone-500 mb-4">
                    Question
                  </span>
                  <p className="text-xl md:text-2xl font-heading text-center text-stone-900 dark:text-stone-100 leading-relaxed">
                    {currentCard?.front}
                  </p>
                  <span className="text-xs text-stone-400 dark:text-stone-500 mt-6">
                    Click or press Space to flip
                  </span>
                </CardContent>
              </Card>

              {/* Back */}
              <Card className="flashcard-face flashcard-back border-stone-200 dark:border-stone-800 shadow-soft h-full bg-primary/5">
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <span className="text-xs uppercase tracking-wide text-primary mb-4">
                    Answer
                  </span>
                  <p className="text-lg md:text-xl text-center text-stone-900 dark:text-stone-100 leading-relaxed">
                    {currentCard?.back}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="icon"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="rounded-full w-12 h-12"
              data-testid="prev-card-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleShuffle}
              className="rounded-full w-12 h-12"
              data-testid="shuffle-btn"
            >
              <Shuffle className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleReset}
              className="rounded-full w-12 h-12"
              data-testid="reset-btn"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="rounded-full w-12 h-12"
              data-testid="next-card-btn"
            >
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Keyboard Hints */}
          <p className="text-center text-sm text-stone-400 dark:text-stone-500">
            Use ← → arrow keys to navigate, Space to flip
          </p>
        </>
      )}
    </div>
  );
};

export default Flashcards;

