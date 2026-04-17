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
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";
import ReactionTest from "@/components/ReactionTest";
import MemoryTest from "@/components/MemoryTest";
import NumberMemoryTest from "@/components/NumberMemoryTest";
import TypingTest from "@/components/TypingTest";
import AimTrainer from "@/components/AimTrainer";
import StroopTest from "@/components/StroopTest";

// Tulkojums jo stulbais db
const translateTestType = (testType: string, language: "lv" | "en"): string => {
  const translations: Record<string, { lv: string; en: string }> = {
    reaction: { lv: "Reakcijas laiks", en: "Reaction time" },
    memory: { lv: "Vizuālā atmiņa", en: "Visual memory" },
    number_memory: { lv: "Skaitļu atmiņa", en: "Number memory" },
    "number-memory": { lv: "Skaitļu atmiņa", en: "Number memory" },
    typing: { lv: "Rakstīšanas ātrums", en: "Typing speed" },
    aim: { lv: "Precizitātes treniņš", en: "Aim trainer" },
    stroop: { lv: "Krāsu-vārdu tests", en: "Color-word test" },
  };
  const translation = translations[testType];
  return translation ? translation[language] : testType.replace(/_/g, " ");
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
  const { language } = useLanguage();
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
        return <ReactionTest onBack={() => setCurrentTest("dashboard")} language={language} />;
      case "memory":
        return <MemoryTest onBack={() => setCurrentTest("dashboard")} language={language} />;
      case "number":
        return <NumberMemoryTest onBack={() => setCurrentTest("dashboard")} language={language} />;
      case "typing":
        return <TypingTest onBack={() => setCurrentTest("dashboard")} language={language} />;
      case "aim":
        return <AimTrainer onBack={() => setCurrentTest("dashboard")} language={language} />;
      case "stroop":
        return <StroopTest onBack={() => setCurrentTest("dashboard")} language={language} />;
      default:
        return <Dashboard onStartTest={setCurrentTest} language={language} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderCurrentTest()}
    </div>
  );
};

const Dashboard = ({ onStartTest, language }: { onStartTest: (test: TestType) => void; language: "lv" | "en" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<TestResult[]>([]);
  const [selectedLeaderboardTest, setSelectedLeaderboardTest] = useState<LeaderboardTestType>("reaction");
  const [leaderboardRows, setLeaderboardRows] = useState<LeaderboardRow[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);

  const t = {
    leaderboard: "Leaderboard",
    bestByType: language === "lv" ? "Labākie rezultāti pēc testa tipa" : "Best scores by test type",
    selectTest: language === "lv" ? "Izvēlies testu" : "Select a test",
    loadingLeaderboard: language === "lv" ? "Ielādē leaderboard..." : "Loading leaderboard...",
    noLeaderboardResults: language === "lv" ? "Vēl nav rezultātu šim testam." : "No results yet for this test.",
    you: language === "lv" ? "(Tu)" : "(You)",
    dashboard: language === "lv" ? "Panelis" : "Dashboard",
    profile: language === "lv" ? "Profils" : "Profile",
    signIn: language === "lv" ? "Pieteikties" : "Sign In",
    hero: language === "lv"
      ? "Trenē savas kognitīvās spējas ar izstrādātiem testiem, kas paredzēti, lai pārbaudītu tavas spējas!"
      : "Train your cognitive skills with purpose-built tests designed to challenge your abilities!",
    start: language === "lv" ? "Sākt!" : "Start!",
    recentActivity: language === "lv" ? "Jaunākās aktivitātes" : "Recent Activity",
    latestResults: language === "lv" ? "Tavi jaunākie testa rezultāti" : "Your latest test results",
    score: language === "lv" ? "Rezultāts" : "Score",
    level: language === "lv" ? "Līmenis" : "Level",
    accuracy: language === "lv" ? "Precizitāte" : "Accuracy",
    points: language === "lv" ? "Punkti" : "Points",
    digits: language === "lv" ? "Cipari" : "Digits",
    avgTime: language === "lv" ? "Vid. laiks" : "Avg time",
    attempts: language === "lv" ? "Mēģinājumi" : "Attempts",
  };

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
      details.push(`${t.level}: ${row.level_reached}`);
    }

    if (row.accuracy_percent != null) {
      details.push(`${t.accuracy}: ${Number(row.accuracy_percent).toFixed(1)}%`);
    }

    if (row.points != null && testType !== 'reaction') {
      details.push(`${t.points}: ${Math.round(Number(row.points))}`);
    }

    if (row.digits_remembered != null) {
      details.push(`${t.digits}: ${Math.round(Number(row.digits_remembered))}`);
    }

    if (row.average_time_ms != null && (testType === 'reaction' || testType === 'aim' || testType === 'stroop')) {
      details.push(`${t.avgTime}: ${Math.round(Number(row.average_time_ms))} ms`);
    }

    if (row.attempts_count != null) {
      details.push(`${t.attempts}: ${Math.round(Number(row.attempts_count))}`);
    }

    return details.slice(0, 3);
  };

  const leaderboardTestOptions: Array<{ value: LeaderboardTestType; label: string }> = [
    { value: 'typing', label: language === "lv" ? 'Rakstīšanas ātrums' : 'Typing speed' },
    { value: 'reaction', label: language === "lv" ? 'Reakcijas laiks' : 'Reaction time' },
    { value: 'memory', label: language === "lv" ? 'Vizuālā atmiņa' : 'Visual memory' },
    { value: 'number_memory', label: language === "lv" ? 'Skaitļu atmiņa' : 'Number memory' },
    { value: 'aim', label: language === "lv" ? 'Precizitātes treniņš' : 'Aim trainer' },
    { value: 'stroop', label: language === "lv" ? 'Stroop tests' : 'Stroop test' }
  ];

  const tests = [
    {
      id: "reaction" as TestType,
      title: language === "lv" ? "Reakcijas laiks" : "Reaction time",
      description: language === "lv" ? "Pārbaudi savus refleksus!" : "Test your reflexes!",
      icon: Zap,
      gradient: "bg-gradient-primary",
      delay: "0ms"
    },
    {
      id: "memory" as TestType,
      title: language === "lv" ? "Vizuālā atmiņa" : "Visual memory",
      description: language === "lv" ? "Mēģini atcerēties lauciņus!" : "Try to remember the tiles!",
      icon: Brain,
      gradient: "bg-gradient-accent",
      delay: "150ms"
    },
    {
      id: "number" as TestType,
      title: language === "lv" ? "Skaitļu atmiņa" : "Number memory",
      description: language === "lv" ? "Atceries skaitļu secību!" : "Remember the number sequence!",
      icon: Hash,
      gradient: "bg-gradient-primary",
      delay: "300ms"
    },
    {
      id: "typing" as TestType,
      title: language === "lv" ? "Rakstīšanas ātrums" : "Typing speed",
      description: language === "lv" ? "Pārbaudi savu rakstīšanas ātrumu!" : "Test your typing speed!",
      icon: Keyboard,
      gradient: "bg-gradient-accent",
      delay: "450ms"
    },
    {
      id: "aim" as TestType,
      title: language === "lv" ? "Precizitātes treniņš" : "Aim trainer",
      description: "W.I.P",
      icon: Crosshair,
      gradient: "bg-gradient-primary",
      delay: "600ms",
      disabled: true
    },
    {
      id: "stroop" as TestType,
      title: language === "lv" ? "Stroop krāsu-vārdu tests" : "Stroop color-word test",
      description: language === "lv" ? "Nosaki krāsu, nevis vārdu!" : "Identify the color, not the word!",
      icon: Palette,
      gradient: "bg-gradient-accent",
      delay: "750ms"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 xl:pr-[420px] xl:ml-[740px]">
      <aside className="hidden xl:block fixed right-5 top-24 w-[380px] z-20">
        <Card className="bg-gradient-card border-border/50 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-cognitive-accent" />
              {t.leaderboard}
            </CardTitle>
            <CardDescription>{t.bestByType}</CardDescription>
            <Select value={selectedLeaderboardTest} onValueChange={(value) => setSelectedLeaderboardTest(value as LeaderboardTestType)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectTest} />
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
              <p className="text-sm text-muted-foreground">{t.loadingLeaderboard}</p>
            ) : leaderboardRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noLeaderboardResults}</p>
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
                            {isCurrentUser ? ` ${t.you}` : ''}
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
        <div className="flex justify-end items-center gap-3 mb-6">
          {user ? (
            <>
              <Button onClick={() => navigate("/dashboard")} variant="secondary">
                <BarChart3 className="w-4 h-4 mr-2" />
                {t.dashboard}
              </Button>
              <Button onClick={() => navigate("/profile")} variant="secondary">
                <User className="w-4 h-4 mr-2" />
                {t.profile}
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate("/auth")} className="bg-cognitive-primary hover:bg-cognitive-primary/80">
              <User className="w-4 h-4 mr-2" />
              {t.signIn}
            </Button>
          )}
          <ThemeToggle />
          <LanguageSwitch />
        </div>
        
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="w-12 h-12 text-cognitive-primary" />
          <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            BenchmarkMe
          </h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t.hero}
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
                  {test.disabled ? "W.I.P" : t.start}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      {user && results.length > 0 && (
        <Card className="max-w-2xl mx-auto bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cognitive-success" />
              {t.recentActivity}
            </CardTitle>
            <CardDescription>{t.latestResults}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div key={result.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                  <div>
                    <p className="font-medium capitalize">{translateTestType(result.test_type, language)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(result.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-cognitive-primary">{result.score}</p>
                    <p className="text-xs text-muted-foreground">{t.score}</p>
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
              {t.leaderboard}
            </CardTitle>
            <CardDescription>{t.bestByType}</CardDescription>
            <Select value={selectedLeaderboardTest} onValueChange={(value) => setSelectedLeaderboardTest(value as LeaderboardTestType)}>
              <SelectTrigger>
                <SelectValue placeholder={t.selectTest} />
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
              <p className="text-sm text-muted-foreground">{t.loadingLeaderboard}</p>
            ) : leaderboardRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.noLeaderboardResults}</p>
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
                            {isCurrentUser ? ` ${t.you}` : ''}
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