/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: INDEX.TSX - BENCHMARKME GALVENĀ LAPAS KOMPONENTE
 * APRAKSTS: GALVENĀ LIETOTĀJA SASKARNE KOGNITĪVO TESTU PLATFORMAI,
 *           IETVER TESTU IZVĒLI, NAVIGĀCIJU UN SNIEGUMA IZSEKOŠANU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Zap, Target, Timer, TrendingUp, Hash, Keyboard, Crosshair, User, BarChart3, Palette, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import ReactionTest from "@/components/ReactionTest";
import MemoryTest from "@/components/MemoryTest";
import NumberMemoryTest from "@/components/NumberMemoryTest";
import TypingTest from "@/components/TypingTest";
import AimTrainer from "@/components/AimTrainer";
import StroopTest from "@/components/StroopTest";

// Tulkojums jo stulbais db
const translateTestType = (testType: string): string => {
  const translations: Record<string, string> = {
    'reaction': 'Reakcijas laiks',
    'memory': 'Vizuālā atmiņa',
    'number_memory': 'Skaitļu atmiņa',
    'number-memory': 'Skaitļu atmiņa',
    'typing': 'Rakstīšanas ātrums',
    'aim': 'Precizitātes treniņš',
    'stroop': 'Krāsu-vārdu tests'
  };
  return translations[testType] || testType.replace(/_/g, ' ');
};

// Definē visus iespējamos testu veidus
type TestType = "dashboard" | "reaction" | "memory" | "number" | "typing" | "aim" | "stroop";

// Testa rezultāta datu struktūra
interface TestResult {
  id: string;
  test_type: string;
  score: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

type LeaderboardTestType = "reaction" | "memory" | "number_memory" | "typing" | "aim" | "stroop";

interface LeaderboardRow {
  user_id: number;
  username: string;
  best_score: number;
  last_played_at: string;
  attempts_count?: number | null;
  level_reached?: number | null;
  accuracy_percent?: number | null;
  points?: number | null;
  average_time_ms?: number | null;
  digits_remembered?: number | null;
}

interface RecentResultRow {
  user_id: number;
  username: string;
  test_type: string;
  score: number;
  created_at: string;
}

// Galvenā sākumlapas komponente
const Index = () => {
  // Saglabā pašreiz aktīvo testu vai paneli
  const [currentTest, setCurrentTest] = useState<TestType>(() => {
    // Ielādē saglabāto testu no localStorage, ja tas pastāv
    const saved = localStorage.getItem("currentTest") as TestType | null;
    return saved || "dashboard";
  });

  // Saglabā aktīvo testu localStorage kad tas mainās
  useEffect(() => {
    localStorage.setItem("currentTest", currentTest);
  }, [currentTest]);

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
      case "stroop":
        return <StroopTest onBack={() => setCurrentTest("dashboard")} />;
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
  const [selectedLeaderboardTest, setSelectedLeaderboardTest] = useState<LeaderboardTestType>("reaction");
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  // Ielādē lietotāja jaunākos testa rezultātus
  useEffect(() => {
    if (!user) return;

    const fetchResults = async () => {
  try {
    // SVARĪGI <TestResult[]> norāda atgriežamo tipu
    const data = await apiRequest<TestResult[] >('/test-results/all');
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

  useEffect(() => {
    const buildLeaderboardFromRecent = (items: RecentResultRow[]): LeaderboardRow[] => {
      const filtered = items.filter((item) => item.test_type === selectedLeaderboardTest);
      const byUser = new Map<number, LeaderboardRow>();

      filtered.forEach((item) => {
        const current = byUser.get(item.user_id);
        if (!current) {
          byUser.set(item.user_id, {
            user_id: item.user_id,
            username: item.username,
            best_score: Number(item.score),
            last_played_at: item.created_at
          });
          return;
        }

        const betterScore = selectedLeaderboardTest === 'reaction'
          ? Number(item.score) < current.best_score
          : Number(item.score) > current.best_score;

        if (betterScore) {
          current.best_score = Number(item.score);
        }

        if (new Date(item.created_at) > new Date(current.last_played_at)) {
          current.last_played_at = item.created_at;
        }
      });

      const sortDirection = selectedLeaderboardTest === 'reaction' ? 1 : -1;
      return Array.from(byUser.values())
        .sort((a, b) => {
          if (a.best_score === b.best_score) {
            return new Date(b.last_played_at).getTime() - new Date(a.last_played_at).getTime();
          }
          return (a.best_score - b.best_score) * sortDirection;
        })
        .slice(0, 10);
    };

    const fetchLeaderboard = async () => {
      try {
        setLeaderboardLoading(true);
        const data = await apiRequest<{ results: LeaderboardRow[] }>(
          `/test-results/leaderboard?testType=${selectedLeaderboardTest}&limit=10`
        );
        setLeaderboardRows(data.results);
      } catch (error: unknown) {
        try {
          // Fallback for older backend instances that do not yet expose /leaderboard
          const recent = await apiRequest<RecentResultRow[]>(`/test-results/recent?limit=200`);
          const derivedRows = buildLeaderboardFromRecent(recent);
          setLeaderboardRows(derivedRows);
        } catch (fallbackError: unknown) {
          if (fallbackError instanceof Error) {
            console.error('Kļūda ielādējot leaderboard:', fallbackError.message);
          }
          setLeaderboardRows([]);
        }
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchLeaderboard();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedLeaderboardTest]);

  const formatLeaderboardScore = (testType: LeaderboardTestType, score: number): string => {
    if (testType === 'reaction') return `${Math.round(score)} ms`;
    if (testType === 'aim') return `${Number(score).toFixed(1)}%`;
    return `${Math.round(score)}`;
  };

  const getLeaderboardDetails = (testType: LeaderboardTestType, row: LeaderboardRow): string[] => {
    const details: string[] = [];

    if (row.level_reached != null) {
      details.push(`Level: ${row.level_reached}`);
    }

    if (row.accuracy_percent != null) {
      details.push(`Precizitāte: ${Number(row.accuracy_percent).toFixed(1)}%`);
    }

    if (row.points != null && testType !== 'reaction') {
      details.push(`Punkti: ${Math.round(Number(row.points))}`);
    }

    if (row.digits_remembered != null) {
      details.push(`Cipari: ${Math.round(Number(row.digits_remembered))}`);
    }

    if (row.average_time_ms != null && (testType === 'reaction' || testType === 'aim' || testType === 'stroop')) {
      details.push(`Vid. laiks: ${Math.round(Number(row.average_time_ms))} ms`);
    }

    if (row.attempts_count != null) {
      details.push(`Mēģinājumi: ${Math.round(Number(row.attempts_count))}`);
    }

    return details.slice(0, 3);
  };

  const leaderboardTestOptions: Array<{ value: LeaderboardTestType; label: string }> = [
    { value: 'typing', label: 'Rakstīšanas ātrums' },
    { value: 'reaction', label: 'Reakcijas laiks' },
    { value: 'memory', label: 'Vizuālā atmiņa' },
    { value: 'number_memory', label: 'Skaitļu atmiņa' },
    { value: 'aim', label: 'Precizitātes treniņš' },
    { value: 'stroop', label: 'Stroop tests' }
  ];

  const tests = [
    {
      id: "reaction" as TestType,
      title: "Reakcijas laiks",
      description: "Pārbaudi savus refleksus!",
      icon: Zap,
      gradient: "bg-gradient-primary",
      delay: "0ms"
    },
    {
      id: "memory" as TestType,
      title: "Vizuālā atmiņa",
      description: "Mēģini atcerēties lauciņus!",
      icon: Brain,
      gradient: "bg-gradient-accent",
      delay: "150ms"
    },
    {
      id: "number" as TestType,
      title: "Skaitļu atmiņa",
      description: "Atceries skaitļu secību!",
      icon: Hash,
      gradient: "bg-gradient-primary",
      delay: "300ms"
    },
    {
      id: "typing" as TestType,
      title: "Rakstīšanas ātrums",
      description: "Pārbaudi savu rakstīšanas ātrumu!",
      icon: Keyboard,
      gradient: "bg-gradient-accent",
      delay: "450ms"
    },
    {
      id: "aim" as TestType,
      title: "Precizitātes treniņš",
      description: "W.I.P",
      icon: Crosshair,
      gradient: "bg-gradient-primary",
      delay: "600ms",
      disabled: true
    },
    {
      id: "stroop" as TestType,
      title: "Stroop krāsu-vārdu tests",
      description: "Nosaki krāsu, nevis vārdu!",
      icon: Palette,
      gradient: "bg-gradient-accent",
      delay: "750ms"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <aside className="hidden xl:block fixed right-5 top-24 w-[380px] z-20">
        <Card className="bg-gradient-card border-border/50 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cognitive-accent" />
              Leaderboard
            </CardTitle>
            <CardDescription>Labākie rezultāti pēc testa tipa</CardDescription>
            <Select value={selectedLeaderboardTest} onValueChange={(value) => setSelectedLeaderboardTest(value as LeaderboardTestType)}>
              <SelectTrigger>
                <SelectValue placeholder="Izvēlies testu" />
              </SelectTrigger>
              <SelectContent>
                {leaderboardTestOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <p className="text-sm text-muted-foreground">Ielādē leaderboard...</p>
            ) : leaderboardRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vēl nav rezultātu šim testam.</p>
            ) : (
              <div className="space-y-2.5 max-h-[68vh] overflow-y-auto pr-1">
                {leaderboardRows.map((row, index) => {
                  const isCurrentUser = user?.id === row.user_id;
                  const details = getLeaderboardDetails(selectedLeaderboardTest, row);
                  return (
                    <div
                      key={`${row.user_id}-${index}`}
                      className={`p-2.5 rounded-lg border ${isCurrentUser ? 'bg-cognitive-primary/10 border-cognitive-primary/40' : 'bg-muted/20 border-border/30'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-sm leading-tight truncate">
                            #{index + 1} {row.username}
                            {isCurrentUser ? ' (Tu)' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(row.last_played_at).toLocaleDateString()}
                          </p>
                          {details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {details.slice(0, 2).map((detail) => (
                                <span
                                  key={`${row.user_id}-${detail}`}
                                  className="px-1.5 py-0.5 rounded-md bg-muted/40 text-[11px] text-foreground/90"
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xl font-bold text-cognitive-primary ml-2 shrink-0">
                          {formatLeaderboardScore(selectedLeaderboardTest, row.best_score)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </aside>

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
          Trenē savas kognitīvās spējas ar izstrādātiem testiem, kas paredzēti, lai pārbaudītu tavas spējas!
        </p>
      </header>

      {/* Test Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-12">
        {tests.map((test) => {
          const Icon = test.icon;
          return (
            <Card 
              key={test.id}
              className={`group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-cognitive animate-fade-in-up border-border/50 bg-gradient-card ${test.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ animationDelay: test.delay }}
              onClick={() => !test.disabled && onStartTest(test.id)}
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
                  disabled={test.disabled}
                  variant="secondary" 
                  className="w-full group-hover:bg-cognitive-accent group-hover:text-cognitive-accent-foreground transition-all duration-300"
                >
                  {test.disabled ? "W.I.P" : "Sākt!"}
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
              Jaunākās aktivitātes
            </CardTitle>
            <CardDescription>Tavi jaunākie testa rezultāti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium capitalize">{translateTestType(result.test_type)}</p>
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

      <aside className="xl:hidden mt-8 max-w-2xl mx-auto">
        <Card className="bg-gradient-card border-border/50 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cognitive-accent" />
              Leaderboard
            </CardTitle>
            <CardDescription>Labākie rezultāti pēc testa tipa</CardDescription>
            <Select value={selectedLeaderboardTest} onValueChange={(value) => setSelectedLeaderboardTest(value as LeaderboardTestType)}>
              <SelectTrigger>
                <SelectValue placeholder="Izvēlies testu" />
              </SelectTrigger>
              <SelectContent>
                {leaderboardTestOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <p className="text-sm text-muted-foreground">Ielādē leaderboard...</p>
            ) : leaderboardRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Vēl nav rezultātu šim testam.</p>
            ) : (
              <div className="space-y-2.5">
                {leaderboardRows.map((row, index) => {
                  const isCurrentUser = user?.id === row.user_id;
                  const details = getLeaderboardDetails(selectedLeaderboardTest, row);
                  return (
                    <div
                      key={`${row.user_id}-${index}`}
                      className={`p-2.5 rounded-lg border ${isCurrentUser ? 'bg-cognitive-primary/10 border-cognitive-primary/40' : 'bg-muted/20 border-border/30'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-sm leading-tight truncate">
                            #{index + 1} {row.username}
                            {isCurrentUser ? ' (Tu)' : ''}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(row.last_played_at).toLocaleDateString()}
                          </p>
                          {details.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {details.slice(0, 2).map((detail) => (
                                <span
                                  key={`${row.user_id}-${detail}`}
                                  className="px-1.5 py-0.5 rounded-md bg-muted/40 text-[11px] text-foreground/90"
                                >
                                  {detail}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xl font-bold text-cognitive-primary ml-2 shrink-0">
                          {formatLeaderboardScore(selectedLeaderboardTest, row.best_score)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
};

export default Index;