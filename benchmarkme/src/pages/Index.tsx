import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Zap, Target, Timer, TrendingUp, Hash, Keyboard, Crosshair, User, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import ReactionTest from "@/components/ReactionTest";
import MemoryTest from "@/components/MemoryTest";
import NumberMemoryTest from "@/components/NumberMemoryTest";
import TypingTest from "@/components/TypingTest";
import AimTrainer from "@/components/AimTrainer";

// Definē visus iespējamos testu veidus
type TestType = "dashboard" | "reaction" | "memory" | "number" | "typing" | "aim";

// Testa rezultāta datu struktūra
interface TestResult {
  id: string;
  test_type: string;
  score: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Galvenā sākumlapas komponente
const Index = () => {
  // Saglabā pašreiz aktīvo testu vai paneli
  const [currentTest, setCurrentTest] = useState<TestType>("dashboard");

  // Funkcija, kas atgriež pareizo komponentu atkarībā no izvēlētā testa
  const renderCurrentTest = () => {
    switch (currentTest) {
      case "reaction":
        return <ReactionTest onBack={() => setCurrentTest("dashboard")} />;
      case "memory":
        return <MemoryTest onBack={() => setCurrentTest("dashboard")} />;
      case "number":
        return <NumberMemoryTest onBack={() => setCurrentTest("dashboard")} />;
      case "typing":
        return <TypingTest onBack={() => setCurrentTest("dashboard")} />;
      case "aim":
        return <AimTrainer onBack={() => setCurrentTest("dashboard")} />;
      default:
        return <Dashboard onStartTest={setCurrentTest} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentTest()}
    </div>
  );
};

const Dashboard = ({ onStartTest }: { onStartTest: (test: TestType) => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);

  // Ielādē lietotāja jaunākos testa rezultātus
  useEffect(() => {
    if (!user) return;

    const fetchResults = async () => {
  try {
    // SVARĪGI <TestResult[]> norāda atgriežamo tipu
    const data = await apiRequest<TestResult[]>('/test-results/all');
    setResults(data);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Kļūda ielādējot rezultātus:', error.message);
    }
  }
};


    fetchResults();

    // Atjauno datus katras 3 sekundes
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchResults();
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [user]);

  const tests = [
    {
      id: "reaction" as TestType,
      title: "Reakcijas Laiks",
      description: "Pārbaudi savus refleksus un atbildes ātrumu",
      icon: Zap,
      gradient: "bg-gradient-primary",
      delay: "0ms"
    },
    {
      id: "memory" as TestType,
      title: "Vizuālā Atmiņa",
      description: "Izmēģini savu modeļu atpazīšanas spēju",
      icon: Brain,
      gradient: "bg-gradient-accent",
      delay: "150ms"
    },
    {
      id: "number" as TestType,
      title: "Skaitļu Atmiņa",
      description: "Atceries un atgūsti skaitļu secības",
      icon: Hash,
      gradient: "bg-gradient-primary",
      delay: "300ms"
    },
    {
      id: "typing" as TestType,
      title: "Rakstīšanas Ātrums",
      description: "Izmēri savus vārdus minūtē",
      icon: Keyboard,
      gradient: "bg-gradient-accent",
      delay: "450ms"
    },
    {
      id: "aim" as TestType,
      title: "Precizitātes Treniņš",
      description: "Pārbaudi savu precizitāti un reakciju",
      icon: Crosshair,
      gradient: "bg-gradient-primary",
      delay: "600ms"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with Auth Buttons */}
      <header className="text-center mb-12 animate-fade-in-up">
        <div className="flex justify-end gap-3 mb-6">
          {user ? (
            <>
              <Button onClick={() => navigate("/dashboard")} variant="secondary">
                <BarChart3 className="w-4 h-4 mr-2" />
                Panelis
              </Button>
              <Button onClick={() => navigate("/profile")} variant="secondary">
                <User className="w-4 h-4 mr-2" />
                Profils
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="bg-cognitive-primary hover:bg-cognitive-primary/80">
              <User className="w-4 h-4 mr-2" />
              Pieteikties
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-12 h-12 text-cognitive-primary" />
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BenchmarkMe
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Trenē savas kognitīvās spējas ar precīzi izstrādātiem testiem, kas paredzēti, lai mērītu un uzlabotu tavu mentālo sniegumu.
        </p>
      </header>

      {/* Test Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
        {tests.map((test) => {
          const Icon = test.icon;
          return (
            <Card 
              key={test.id}
              className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-cognitive animate-fade-in-up border-border/50 bg-gradient-card"
              style={{ animationDelay: test.delay }}
              onClick={() => onStartTest(test.id)}
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${test.gradient} flex items-center justify-center group-hover:animate-pulse-glow transition-all duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {test.title}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {test.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  variant="secondary" 
                  className="w-full group-hover:bg-cognitive-accent group-hover:text-cognitive-accent-foreground transition-all duration-300"
                >
                  Sākt Testu
                  <Target className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      {user && results.length > 0 && (
        <Card className="max-w-2xl mx-auto bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cognitive-success" />
              Jaunākās Aktivitātes
            </CardTitle>
            <CardDescription>Tavi jaunākie testa rezultāti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium capitalize">{result.test_type.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cognitive-primary">{result.score}</p>
                    <p className="text-xs text-muted-foreground">Rezultāts</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;