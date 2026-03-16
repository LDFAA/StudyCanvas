import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { 
  BookOpen, 
  Sparkles, 
  Brain, 
  Users, 
  ArrowRight,
  FileText,
  Layers,
  CheckCircle
} from "lucide-react";

const Landing = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: FileText,
      title: "Import Your Notes",
      description: "Paste text or upload PDF, DOCX, TXT files. We'll extract and organize your content."
    },
    {
      icon: Sparkles,
      title: "AI-Powered Flashcards",
      description: "Automatically generate study flashcards from your notes with GPT-5.2."
    },
    {
      icon: Brain,
      title: "Smart Quizzes",
      description: "Create quizzes with multiple choice, true/false, short answer, and essay questions."
    },
    {
      icon: Layers,
      title: "Improve Your Notes",
      description: "Let AI enhance your notes with better structure, clarity, and key definitions."
    },
    {
      icon: Users,
      title: "Share & Discover",
      description: "Make your notes public to help others, or browse community study materials."
    },
    {
      icon: CheckCircle,
      title: "Track Progress",
      description: "Take quizzes, get instant feedback, and track your learning journey."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-4 z-50 mx-4 md:mx-auto max-w-5xl">
        <div className="nav-pill rounded-full px-6 py-3 shadow-soft flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span className="font-heading font-semibold text-lg text-stone-900 dark:text-stone-100">
              StudyCanvas
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/browse" className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors">
              Browse
            </Link>
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="rounded-full px-6" data-testid="goto-dashboard-btn">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button className="rounded-full px-6" data-testid="get-started-btn">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 py-20 md:py-32">
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="font-heading text-5xl md:text-6xl tracking-tight font-light text-stone-900 dark:text-stone-100 mb-6 animate-fade-in">
            Study Smarter,
            <br />
            <span className="text-primary">Not Harder</span>
          </h1>
          <p className="text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-8 max-w-2xl mx-auto animate-fade-in stagger-1">
            Transform your study notes into powerful learning tools. AI-generated flashcards, 
            quizzes, and improved notes — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in stagger-2">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
              <Button size="lg" className="rounded-full px-8 py-6 text-base shadow-glow btn-press" data-testid="hero-cta-btn">
                Start Learning
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/browse">
              <Button variant="secondary" size="lg" className="rounded-full px-8 py-6 text-base btn-press" data-testid="browse-btn">
                Browse Public Notes
              </Button>
            </Link>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative max-w-5xl mx-auto mt-16 animate-fade-in stagger-3">
          <div className="rounded-2xl overflow-hidden shadow-soft-lg border border-stone-200 dark:border-stone-800">
            <img 
              src="https://images.unsplash.com/photo-1767102060241-130cb9260718?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwyfHxzdHVkZW50JTIwc3R1ZHlpbmclMjBjb25jZW50cmF0ZWQlMjBsaWJyYXJ5fGVufDB8fHx8MTc3MzIxODU0N3ww&ixlib=rb-4.1.0&q=85"
              alt="Student studying"
              className="w-full h-[300px] md:h-[400px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 bg-stone-50 dark:bg-stone-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-normal text-stone-900 dark:text-stone-100 mb-4">
              Everything You Need to Excel
            </h2>
            <p className="text-stone-600 dark:text-stone-400 text-lg max-w-2xl mx-auto">
              Powerful AI tools designed for students, by students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 shadow-soft card-hover animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-medium text-stone-900 dark:text-stone-100 mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-600 dark:text-stone-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl tracking-tight font-normal text-stone-900 dark:text-stone-100 mb-4">
            Ready to Transform Your Studies?
          </h2>
          <p className="text-stone-600 dark:text-stone-400 text-lg mb-8">
            Join thousands of students learning smarter with StudyCanvas
          </p>
          <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
            <Button size="lg" className="rounded-full px-10 py-6 text-base shadow-glow btn-press" data-testid="final-cta-btn">
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-heading font-medium text-stone-900 dark:text-stone-100">
              StudyCanvas
            </span>
          </div>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Made with AI for better learning
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;


