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
  const { user } = useAuth();
  const navigate = useNavigate();
  // Saglabā visus testa rezultātus un ielādes stāvokli
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Ielādē lietotāja testa rezultātus, kad komponente tiek ielādēta
  useEffect(() => {
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
      // Aprēķina uzlabojumu procentos (salīdzinot pēdējo ar pirmo)
      const improvement = latest && oldest ? ((latest.score - oldest.score) / oldest.score * 100).toFixed(1) : 0;

      return {
        testType,
        count: tests.length, // Cik reižu tests veikts
        averageScore: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0), // Vidējais rezultāts
        bestScore: Math.max(...scores), // Labākais rezultāts
        improvement: Number(improvement), // Uzlabojums procentos
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
        <div className="text-lg">Ielādē tavu paneli...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-cognitive-primary" />
            <h1 className="text-4xl font-bold">Snieguma Panelis</h1>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/profile")} variant="secondary">
              <User className="w-4 h-4 mr-2" />
              Profils
            </Button>
            <Button onClick={() => navigate("/")} className="bg-cognitive-primary hover:bg-cognitive-primary/80">
              Veikt Testus
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Kopā Testi</p>
                  <p className="text-3xl font-bold text-cognitive-primary">{totalTests}</p>
                </div>
                <Award className="w-10 h-10 text-cognitive-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Šonedēļ</p>
                  <p className="text-3xl font-bold text-cognitive-accent">{testsThisWeek}</p>
                </div>
                <Calendar className="w-10 h-10 text-cognitive-accent opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Testu Veidi</p>
                  <p className="text-3xl font-bold text-cognitive-success">{stats.length}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-cognitive-success opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Performance Cards */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Testu Sniegums un Uzlabojumi</CardTitle>
            <CardDescription>Seko savam progresam dažādos kognitīvajos testos</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Vēl nav veikti testi. Sāc testēšanu, lai redzētu savu progresu!</p>
                <Button onClick={() => navigate("/")} className="mt-4 bg-cognitive-primary hover:bg-cognitive-primary/80">
                  Veikt Pirmo Testu
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.map((stat) => (
                  <div key={stat.testType} className="p-4 rounded-lg bg-muted/20 border border-border/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg capitalize">
                          {stat.testType.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Pēdējoreiz spēlēts: {new Date(stat.latestDate).toLocaleDateString()}
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
                        <p className="text-xs text-muted-foreground">Veikti Testi</p>
                        <p className="text-xl font-bold">{stat.count}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Vidējais Rezultāts</p>
                        <p className="text-xl font-bold text-cognitive-accent">{stat.averageScore}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Labākais Rezultāts</p>
                        <p className="text-xl font-bold text-cognitive-success">{stat.bestScore}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle>Jaunākās Aktivitātes</CardTitle>
            <CardDescription>Tavi jaunākie testa rezultāti</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.slice(0, 10).map((result) => (
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
      </div>
    </div>
  );
};

export default Dashboard;
