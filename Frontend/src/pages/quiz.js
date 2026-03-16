import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  X, 
  Loader2,
  Brain,
  Trophy,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/quizzes/${quizId}`);
      setQuiz(response.data);
    } catch (error) {
      toast.error("Failed to load quiz");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = async () => {
    const unanswered = quiz.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      toast.error(`Please answer all questions (${unanswered.length} remaining)`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API}/quizzes/submit`, {
        quiz_id: quizId,
        answers
      });
      setResults(response.data);
      setSubmitted(true);
      toast.success("Quiz submitted!");
    } catch (error) {
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
    setResults(null);
    setCurrentIndex(0);
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!quiz) return null;

  const currentQuestion = quiz.questions[currentIndex];
  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  // Results view
  if (submitted && results) {
    const getResultForQuestion = (questionId) => {
      return results.results.find(r => r.question_id === questionId);
    };

    return (
      <div className="max-w-3xl mx-auto space-y-6" data-testid="quiz-results">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-heading text-2xl md:text-3xl font-light text-stone-900 dark:text-stone-100">
            Quiz Results
          </h1>
        </div>

        {/* Score Card */}
        <Card className="border-stone-200 dark:border-stone-800 shadow-soft overflow-hidden">
          <div className={`p-8 text-center ${results.score >= 70 ? 'bg-accent/10' : results.score >= 50 ? 'bg-orange-100 dark:bg-orange-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
            <Trophy className={`w-16 h-16 mx-auto mb-4 ${results.score >= 70 ? 'text-accent' : results.score >= 50 ? 'text-orange-500' : 'text-red-500'}`} />
            <h2 className="font-heading text-4xl font-medium text-stone-900 dark:text-stone-100 mb-2">
              {results.score}%
            </h2>
            <p className="text-stone-600 dark:text-stone-400">
              {results.correct} out of {results.total} correct
            </p>
          </div>
          <CardContent className="p-6 flex justify-center gap-4">
            <Button onClick={handleRetake} variant="secondary" className="rounded-full" data-testid="retake-btn">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
            <Link to="/dashboard">
              <Button className="rounded-full" data-testid="done-btn">
                Done
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Question Review */}
        <div className="space-y-4">
          <h3 className="font-heading text-xl font-medium text-stone-900 dark:text-stone-100">
            Review Answers
          </h3>
          {quiz.questions.map((question, index) => {
            const result = getResultForQuestion(question.id);
            return (
              <Card 
                key={question.id} 
                className={`border-2 ${result?.is_correct ? 'border-accent/50' : 'border-destructive/50'}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${result?.is_correct ? 'bg-accent text-white' : 'bg-destructive text-white'}`}>
                      {result?.is_correct ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <Badge variant="outline" className="mb-2 text-xs">
                        {question.question_type.replace("_", " ")}
                      </Badge>
                      <p className="font-medium text-stone-900 dark:text-stone-100">
                        {index + 1}. {question.question}
                      </p>
                    </div>
                  </div>
                  <div className="ml-9 space-y-2">
                    <div className="text-sm">
                      <span className="text-stone-500">Your answer: </span>
                      <span className={result?.is_correct ? 'text-accent font-medium' : 'text-destructive font-medium'}>
                        {result?.user_answer || "(no answer)"}
                      </span>
                    </div>
                    {!result?.is_correct && (
                      <div className="text-sm">
                        <span className="text-stone-500">Correct answer: </span>
                        <span className="text-accent font-medium">{result?.correct_answer}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Quiz taking view
  return (
    <div className="max-w-3xl mx-auto space-y-6" data-testid="quiz-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full" data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-light text-stone-900 dark:text-stone-100">
              {quiz.title}
            </h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {answeredCount} of {quiz.questions.length} answered
            </p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-stone-500 dark:text-stone-400">
          <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
          <Badge variant="outline" className="text-xs">
            {currentQuestion.question_type.replace("_", " ")}
          </Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-stone-200 dark:border-stone-800 shadow-soft">
        <CardHeader>
          <CardTitle className="font-heading text-xl font-medium text-stone-900 dark:text-stone-100">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Multiple Choice */}
          {currentQuestion.question_type === "multiple_choice" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(v) => handleAnswerChange(currentQuestion.id, v)}
            >
              {currentQuestion.options?.map((option, idx) => (
                <div 
                  key={idx} 
                  className={`quiz-option flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(currentQuestion.id, option)}
                >
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* True/False */}
          {currentQuestion.question_type === "true_false" && (
            <RadioGroup
              value={answers[currentQuestion.id] || ""}
              onValueChange={(v) => handleAnswerChange(currentQuestion.id, v)}
            >
              {["True", "False"].map((option) => (
                <div 
                  key={option} 
                  className={`quiz-option flex items-center gap-3 p-4 rounded-xl border border-stone-200 dark:border-stone-700 cursor-pointer ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswerChange(currentQuestion.id, option)}
                >
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option} className="flex-1 cursor-pointer font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {/* Short Answer */}
          {currentQuestion.question_type === "short_answer" && (
            <Input
              placeholder="Type your answer..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              data-testid="short-answer-input"
            />
          )}

          {/* Paragraph */}
          {currentQuestion.question_type === "paragraph" && (
            <Textarea
              placeholder="Write your answer (3-5 sentences)..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="min-h-[120px]"
              data-testid="paragraph-input"
            />
          )}

          {/* Essay */}
          {currentQuestion.question_type === "essay" && (
            <Textarea
              placeholder="Write your essay response..."
              value={answers[currentQuestion.id] || ""}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="min-h-[200px]"
              data-testid="essay-input"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="rounded-full"
          data-testid="prev-question-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentIndex === quiz.questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full px-8"
            data-testid="submit-quiz-btn"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            Submit Quiz
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            className="rounded-full"
            data-testid="next-question-btn"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 justify-center pt-4 border-t border-stone-200 dark:border-stone-800">
        {quiz.questions.map((q, idx) => (
          <Button
            key={q.id}
            variant={currentIndex === idx ? "default" : answers[q.id] ? "secondary" : "outline"}
            size="icon"
            className="w-8 h-8 rounded-full text-xs"
            onClick={() => setCurrentIndex(idx)}
            data-testid={`question-nav-${idx}`}
          >
            {idx + 1}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default Quiz;


