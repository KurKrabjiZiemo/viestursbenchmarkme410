/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: DASHBOARD.TSX - LIETOTĀJA INFORMĀCIJAS PANEĻA KOMPONENTE
 * APRAKSTS: LIETOTĀJA STATISTIKAS, TESTU REZULTĀTU UN SNIEGUMA
 *           ANALĪZES PĀRSKATS AR VIZUĀLIEM DATIEM
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us un komponentus
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, User, TrendingUp, Award, Calendar } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē autentifikācijas hook un API utilītiju
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";

const translateTestType = (testType: string, language: "lv" | "en"): string => {
  const translations: Record<string, { lv: string; en: string }> = {
    reaction: { lv: "Reakcijas Laiks", en: "Reaction Time" },
    memory: { lv: "Vizuālā Atmiņa", en: "Visual Memory" },
    number_memory: { lv: "Skaitļu Atmiņa", en: "Number Memory" },
    "number-memory": { lv: "Skaitļu Atmiņa", en: "Number Memory" },
    typing: { lv: "Rakstīšanas Ātrums", en: "Typing Speed" },
    aim: { lv: "Precizitātes Treniņš", en: "Aim Trainer" },
    stroop: { lv: "Stroop Krāsu-Vārdu Tests", en: "Stroop Color-Word Test" },
  };
  const translation = translations[testType];
  return translation ? translation[language] : testType.replace(/_/g, " ");
};

// Testa rezultāta datu struktūra
interface TestResult {
  id: string;
  test_type: string;
  score: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Pārskatu panelis - parāda lietotāja testa rezultātus un statistiku
const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  // Saglabā visus testa rezultātus un ielādes stāvokli
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  const t = {
    loading: language === "lv" ? "Ielādē tavu paneli..." : "Loading your dashboard...",
    title: language === "lv" ? "Rezultātu panelis" : "Results Dashboard",
    profile: language === "lv" ? "Profils" : "Profile",
    takeTests: language === "lv" ? "Veikt testus" : "Take tests",
    totalTests: language === "lv" ? "Kopā testi" : "Total tests",
    thisWeek: language === "lv" ? "Šonedēļ" : "This week",
    testTypes: language === "lv" ? "Testu veidi" : "Test types",
    testResults: language === "lv" ? "Testu rezultāti" : "Test Results",
    resultsSubtitle:
      language === "lv"
        ? "Seko saviem rezultātiem dažādos testos!"
        : "Track your results across different tests!",
    noTests:
      language === "lv"
        ? "Vēl nav veikti testi. Sāc testēšanu, lai redzētu savus rezultātus!"
        : "No tests completed yet. Start testing to see your results!",
    firstTest: language === "lv" ? "Veikt pirmo testu" : "Take your first test",
    lastPlayed: language === "lv" ? "Pēdējoreiz spēlēts" : "Last played",
    completedTests: language === "lv" ? "Veikti testi" : "Completed tests",
    averageScore: language === "lv" ? "Vidējais rezultāts" : "Average score",
    bestScore: language === "lv" ? "Labākais rezultāts" : "Best score",
    recentActivity: language === "lv" ? "Jaunākās aktivitātes" : "Recent Activity",
    recentSubtitle: language === "lv" ? "Tavi jaunākie testa rezultāti" : "Your latest test results",
    score: language === "lv" ? "Rezultāts" : "Score",
  };

  // Ielādē lietotāja testa rezultātus, kad komponente tiek ielādēta
  useEffect(() => {
    // Gaida, līdz autentifikācija ir pārbaudīta
    if (authLoading) {
      return;
    }
    // Ja lietotājs nav pieteicies, pārvirza uz autentifikācijas lapu
    if (!user) {
      navigate("/auth");
      return;
    }

    // Iegūst visus lietotāja testa rezultātus no datubāzes
    const fetchResults = async () => {
  try {
    const data = await apiRequest<TestResult[]>('/test-results/all');
    setResults(data);
  } catch (error: unknown) {
    console.error('Error fetching results:', error);
  } finally {
    setLoading(false);
  }
};

    fetchResults();

    // Automātiski atjauno datus, kad logs kļūst aktīvs (kad lietotājs atgriežas)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchResults();
      }
    };

    // Atjauno datus katras 3 sekundes, kad logs ir aktīvs
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchResults();
      }
    }, 3000);

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [user, navigate]);

  // Aprēķina statistiku katram testa veidam
  const getTestStats = () => {
    // Grupē rezultātus pēc testa veida
    const testsByType: { [key: string]: TestResult[] } = {};
    
    results.forEach(result => {
      if (!testsByType[result.test_type]) {
        testsByType[result.test_type] = [];
      }
      testsByType[result.test_type].push(result);
    });

    // Katram testa veidam aprēķina statistiku
    return Object.keys(testsByType).map(testType => {
      const tests = testsByType[testType];
      const scores = tests.map(t => t.score);
      const latest = tests[0];
      const oldest = tests[tests.length - 1];
      const isLowerBetter = testType === 'reaction';
      const oldestScore = oldest?.score || 0;

      // Aprēķina uzlabojumu procentos (salīdzinot pēdējo ar pirmo)
      const improvementValue = latest && oldest && oldestScore !== 0
        ? (isLowerBetter
            ? ((oldest.score - latest.score) / oldest.score) * 100
            : ((latest.score - oldest.score) / oldest.score) * 100)
        : 0;

      return {
        testType,
        count: tests.length, // Cik reižu tests veikts
        averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0), // Vidējais rezultāts
        bestScore: isLowerBetter ? Math.min(...scores) : Math.max(...scores), // Labākais rezultāts
        scoreSuffix: isLowerBetter ? 'ms' : '',
        improvement: Number(improvementValue.toFixed(1)), // Uzlabojums procentos
        latestDate: latest.created_at // Pēdējā testa datums
      };
    });
  };

  const stats = getTestStats();
  const totalTests = results.length;
  const testsThisWeek = results.filter(r => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return new Date(r.created_at) > weekAgo;
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.loading}</div>
        <div className="fixed right-4 top-4 z-20 flex gap-2">
          <ThemeToggle />
          <LanguageSwitch />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="fixed right-4 top-4 z-20 flex gap-2">
        <ThemeToggle />
        <LanguageSwitch />
      </div>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-cognitive-primary" />
            <h1 className="text-4xl font-bold">{t.title}</h1>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/profile")} variant="secondary">
              <User className="w-4 h-4 mr-2" />
              {t.profile}
            </Button>
            <Button onClick={() => navigate("/")} className="bg-cognitive-primary hover:bg-cognitive-primary/80">
              {t.takeTests}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.totalTests}</p>
                  <p className="text-3xl font-bold text-cognitive-primary">{totalTests}</p>
                </div>
                <Award className="w-10 h-10 text-cognitive-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.thisWeek}</p>
                  <p className="text-3xl font-bold text-cognitive-accent">{testsThisWeek}</p>
                </div>
                <Calendar className="w-10 h-10 text-cognitive-accent opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t.testTypes}</p>
                  <p className="text-3xl font-bold text-cognitive-success">{stats.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-cognitive-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Performance Cards */}
        <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
          <CardHeader>
            <CardTitle>{t.testResults}</CardTitle>
            <CardDescription>{t.resultsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">{t.noTests}</p>
                <Button onClick={() => navigate("/")} className="mt-4 bg-cognitive-primary hover:bg-cognitive-primary/80">
                  {t.firstTest}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div key={stat.testType} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg capitalize">
                          {translateTestType(stat.testType, language)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t.lastPlayed}: {new Date(stat.latestDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                        stat.improvement > 0 ? 'bg-cognitive-success/20 text-cognitive-success' : 
                        stat.improvement < 0 ? 'bg-destructive/20 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">
                          {stat.improvement > 0 ? '+' : ''}{stat.improvement}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground">{t.completedTests}</p>
                        <p className="text-xl font-bold">{stat.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.averageScore}</p>
                        <p className="text-xl font-bold text-cognitive-accent">{stat.averageScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t.bestScore}</p>
                        <p className="text-xl font-bold text-cognitive-success">{stat.bestScore}{stat.scoreSuffix}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "500ms" }}>
          <CardHeader>
            <CardTitle>{t.recentActivity}</CardTitle>
            <CardDescription>{t.recentSubtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 10).map((result) => (
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
      </div>
    </div>
  );
};

export default Dashboard;
