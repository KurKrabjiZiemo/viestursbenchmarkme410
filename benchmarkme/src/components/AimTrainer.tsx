// Importē nepieciešamos React hook-us
import { useState, useEffect, useRef, useCallback } from "react";
// Importē ikonas
import { ArrowLeft, Play, RotateCcw, Target, Crosshair } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē hook rezultātu saglabāšanai
import { useTestResults } from "@/hooks/useTestResults";

// Komponentes rekvizīti
interface AimTrainerProps {
  onBack: () => void; // Funkcija atgriešanās uz sākumlapu
}

// Testa stāvokļa tipi
type TestState = "ready" | "active" | "complete";

// Mērķa objekta struktūra
interface TargetType {
  id: number; // Unikāls identifikators
  x: number; // X koordināte
  y: number; // Y koordināte
  size: number; // Mērķa izmērs pikseļos
  spawnTime: number; // Laiks, kad mērķis parādījās
}

// Testa konstantes
const TEST_DURATION = 30; // Testa ilgums sekundēs
const TARGET_LIFETIME = 3000; // Cik ilgi mērķis paliek redzams (milisekundēs)
const MIN_TARGET_SIZE = 40; // Minimālais mērķa izmērs
const MAX_TARGET_SIZE = 80; // Maksimālais mērķa izmērs

// Precizitātes treniņa komponente
const AimTrainer = ({ onBack }: AimTrainerProps) => {
  // Iegūst funkciju rezultātu saglabāšanai
  const { saveTestResult } = useTestResults();
  
  // Stāvokļa mainīgie
  const [testState, setTestState] = useState<TestState>("ready");
  const [targets, setTargets] = useState<TargetType[]>([]); // Aktīvie mērķi
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION); // Atlikušais laiks
  const [score, setScore] = useState(0); // Iegūtie punkti
  const [hits, setHits] = useState(0); // Trāpījumu skaits
  const [misses, setMisses] = useState(0); // Kļūdu skaits
  const [attempts, setAttempts] = useState<{ score: number; accuracy: number; avgReactionTime: number }[]>([]); // Visi mēģinājumi
  const [reactionTimes, setReactionTimes] = useState<number[]>([]); // Reakcijas laiki
  const [gameAreaSize, setGameAreaSize] = useState({ width: 800, height: 500 }); // Spēles laukuma izmērs
  
  // Atsauces
  const gameAreaRef = useRef<HTMLDivElement>(null); // Spēles laukuma atsauce
  const nextTargetId = useRef(1); // Nākamā mērķa ID
  const startTime = useRef<number>(0); // Testa sākuma laiks

  const spawnTarget = useCallback(() => {
    if (testState !== "active") return;
    
    const padding = MAX_TARGET_SIZE;
    const x = Math.random() * (gameAreaSize.width - padding * 2) + padding;
    const y = Math.random() * (gameAreaSize.height - padding * 2) + padding;
    const size = Math.random() * (MAX_TARGET_SIZE - MIN_TARGET_SIZE) + MIN_TARGET_SIZE;
    
    const newTarget: TargetType = {
      id: nextTargetId.current++,
      x,
      y,
      size,
      spawnTime: Date.now()
    };
    
    console.log('Spawning target:', newTarget, 'Game area:', gameAreaSize);
    setTargets(prev => {
      const newTargets = [...prev, newTarget];
      console.log('Total targets:', newTargets.length);
      return newTargets;
    });
    
    // Remove target after lifetime
    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== newTarget.id));
    }, TARGET_LIFETIME);
  }, [testState, gameAreaSize]);

  const startTest = () => {
    setTestState("active");
    setTargets([]);
    setTimeLeft(TEST_DURATION);
    setScore(0);
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
    startTime.current = Date.now();
    
    // Update game area size
    if (gameAreaRef.current) {
      const rect = gameAreaRef.current.getBoundingClientRect();
      setGameAreaSize({ width: rect.width, height: rect.height });
    }
    
    // Spawn first target immediately
    setTimeout(spawnTarget, 500);
  };

  const handleTargetClick = (targetId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const target = targets.find(t => t.id === targetId);
    if (!target) return;
    
    const reactionTime = Date.now() - target.spawnTime;
    setReactionTimes(prev => [...prev, reactionTime]);
    
    // Calculate score based on target size and reaction time
    const sizeMultiplier = (MAX_TARGET_SIZE - target.size) / (MAX_TARGET_SIZE - MIN_TARGET_SIZE) + 1;
    const timeMultiplier = Math.max(0.1, (TARGET_LIFETIME - reactionTime) / TARGET_LIFETIME);
    const points = Math.round(100 * sizeMultiplier * timeMultiplier);
    
    setScore(prev => prev + points);
    setHits(prev => prev + 1);
    setTargets(prev => prev.filter(t => t.id !== targetId));
    
    // Spawn next target with random delay
    const delay = Math.random() * 800 + 200; // 200-1000ms
    setTimeout(spawnTarget, delay);
  };

  const handleAreaClick = () => {
    if (testState === "active") {
      setMisses(prev => prev + 1);
    }
  };

  const endTest = useCallback(() => {
    const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
    const avgReactionTime = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length)
      : 0;
    
    setAttempts(prev => [...prev, {
      score,
      accuracy,
      avgReactionTime
    }]);
    
    // Saglabā rezultātu datubāzē
    saveTestResult("aim", score, {
      accuracy,
      avgReactionTime,
      hits,
      misses
    });
    
    setTestState("complete");
    setTargets([]);
  }, [hits, misses, reactionTimes, score, saveTestResult]);

  const resetTest = () => {
    setTestState("ready");
    setTargets([]);
    setTimeLeft(TEST_DURATION);
    setScore(0);
    setHits(0);
    setMisses(0);
    setReactionTimes([]);
  };

  const getPerformanceRating = (accuracy: number) => {
    if (accuracy >= 80) return { text: "Izcili", color: "text-cognitive-success" };
    if (accuracy >= 60) return { text: "Labi", color: "text-cognitive-accent" };
    if (accuracy >= 40) return { text: "Vidēji", color: "text-cognitive-warning" };
    return { text: "Nepieciešama Prakse", color: "text-destructive" };
  };

  const getBestScore = () => {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.score));
  };

  const getAverageAccuracy = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length);
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (testState === "active" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testState, timeLeft, endTest]);

  const accuracy = hits + misses > 0 ? Math.round((hits / (hits + misses)) * 100) : 0;
  const avgReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Atpakaļ
          </Button>
          <div className="flex items-center gap-2">
            <Target className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">Precizitātes Treniņš</h1>
          </div>
        </div>

        {/* Stats Bar */}
        <Card className="mb-6 bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-warning">{timeLeft}s</div>
                <div className="text-sm text-muted-foreground">Atlicis Laiks</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-primary">{score}</div>
                <div className="text-sm text-muted-foreground">Rezultāts</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-success">{hits}</div>
                <div className="text-sm text-muted-foreground">Trāpījumi</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-accent">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Precizitāte</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-muted-foreground">{avgReactionTime}ms</div>
                <div className="text-sm text-muted-foreground">Vid. Reakcija</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Game Area */}
        <Card className="mb-8 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle>
              {testState === "ready" && "Gatavs mērķēt?"}
              {testState === "active" && "Nospied mērķus!"}
              {testState === "complete" && `Galīgais Rezultāts: ${score}`}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && "Nospied mērķus, cik ātri un precīzi vien vari"}
              {testState === "active" && "Mazāki mērķi un ātrākas reakcijas = vairāk punktu"}
              {testState === "complete" && `${getPerformanceRating(accuracy).text} - ${accuracy}% precizitāte`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testState === "ready" && (
              <div className="text-center py-20">
                <Button 
                  onClick={startTest} 
                  className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Sākt Precizitātes Treniņu
                </Button>
              </div>
            )}

            {(testState === "active" || testState === "complete") && (
              <div className="space-y-6">
                {/* Game Area */}
                <div 
                  ref={gameAreaRef}
                  className="relative bg-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/30 overflow-hidden cursor-crosshair"
                  style={{ height: '500px' }}
                  onClick={handleAreaClick}
                >
                  {/* Crosshair cursor indicator */}
                  <div className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground pointer-events-none">
                    <Crosshair className="w-4 h-4" />
                    <span className="text-sm">Nospied mērķus</span>
                  </div>

                  {/* Targets */}
                  {targets.map((target) => (
                    <div
                      key={target.id}
                      className="absolute rounded-full cursor-pointer transition-all duration-200 hover:scale-110 animate-pulse-glow"
                      style={{
                        left: target.x - target.size / 2,
                        top: target.y - target.size / 2,
                        width: target.size,
                        height: target.size,
                        background: `radial-gradient(circle, hsl(var(--cognitive-success)) 0%, hsl(var(--cognitive-success) / 0.8) 60%, hsl(var(--cognitive-success) / 0.4) 100%)`,
                        border: '3px solid hsl(var(--cognitive-success))',
                        boxShadow: '0 0 20px hsl(var(--cognitive-success) / 0.5)'
                      }}
                      onClick={(e) => handleTargetClick(target.id, e)}
                    >
                      {/* Target center */}
                      <div 
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                        style={{ width: '20%', height: '20%' }}
                      />
                    </div>
                  ))}

                  {testState === "complete" && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <div className="text-center space-y-4">
                        <div className="text-4xl font-bold text-cognitive-success">
                          Tests Pabeigts!
                        </div>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            onClick={startTest} 
                            className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Spēlēt Vēlreiz
                          </Button>
                          <Button onClick={resetTest} variant="secondary">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Atiestatīt
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {attempts.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Tavi Rezultāti</CardTitle>
              <CardDescription>Precizitātes treniņa snieguma vēsture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-accent">{attempts.length}</div>
                  <div className="text-sm text-muted-foreground">Sesijas</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-primary">{getBestScore()}</div>
                  <div className="text-sm text-muted-foreground">Labākais Rezultāts</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-success">{getAverageAccuracy()}%</div>
                  <div className="text-sm text-muted-foreground">Vid. Precizitāte</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-warning">
                    {attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.avgReactionTime, 0) / attempts.length) : 0}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Vid. Reakcija</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Jaunākās Sesijas:</h4>
                <div className="space-y-2">
                  {attempts.slice(-5).reverse().map((attempt, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/20"
                    >
                      <div className="flex gap-4">
                        <span className="font-bold text-cognitive-primary">
                          {attempt.score} punkti
                        </span>
                        <span className={`${getPerformanceRating(attempt.accuracy).color}`}>
                          {attempt.accuracy}% precizitāte
                        </span>
                        <span className="text-muted-foreground">
                          {attempt.avgReactionTime}ms vid.
                        </span>
                      </div>
                      <span className={`text-sm ${getPerformanceRating(attempt.accuracy).color}`}>
                        {getPerformanceRating(attempt.accuracy).text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AimTrainer;