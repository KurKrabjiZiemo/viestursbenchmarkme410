// Importē nepieciešamos React hook-us
import { useState, useEffect, useRef } from "react";
// Importē ikonas
import { ArrowLeft, Play, RotateCcw, Zap } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē hook rezultātu saglabāšanai
import { useTestResults } from "@/hooks/useTestResults";

// Komponentes rekvizīti
interface ReactionTestProps {
  onBack: () => void; // Funkcija atgriešanās uz sākumlapu
}

// Testa stāvokļa tipi
type TestState = "ready" | "waiting" | "active" | "complete" | "early";

// Reakcijas laika testa komponente
const ReactionTest = ({ onBack }: ReactionTestProps) => {
  // Iegūst funkciju rezultātu saglabāšanai
  const { saveTestResult } = useTestResults();
  
  // Stāvokļa mainīgie
  const [testState, setTestState] = useState<TestState>("ready"); // Pašreizējais testa stāvoklis
  const [reactionTime, setReactionTime] = useState<number | null>(null); // Pēdējais reakcijas laiks
  const [attempts, setAttempts] = useState<number[]>([]); // Visi mēģinājumi
  const [countdown, setCountdown] = useState<number | null>(null); // Atpakaļskaitīšanas skaitlis
  
  // Atsauces precīzai laika mērīšanai
  const startTimeRef = useRef<number>(0); // Testa sākuma laiks
  const timeoutRef = useRef<NodeJS.Timeout>(); // Taimera atsauce

  // Sāk testu ar atpakaļskaitīšanu un gadījuma aizkavi
  const startTest = () => {
    setTestState("waiting");
    setCountdown(3);
    
    // Atpakaļskaitīšana
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          clearInterval(countdownInterval);
          setCountdown(null);
          
          // Gadījuma aizkave starp 1-4 sekundēm
          const delay = Math.random() * 3000 + 1000;
          
          // Pēc aizkaves aktivizē testu
          timeoutRef.current = setTimeout(() => {
            setTestState("active");
            startTimeRef.current = performance.now(); // Precīzs sākuma laiks
          }, delay);
          
          return null;
        }
        return prev! - 1;
      });
    }, 1000);
  };

  // Apstrādā lietotāja klikšķi
  const handleClick = () => {
    if (testState === "active") {
      // Ja tests ir aktīvs, mēra reakcijas laiku
      const endTime = performance.now();
      const reaction = Math.round(endTime - startTimeRef.current);
      setReactionTime(reaction);
      const newAttempts = [...attempts, reaction];
      setAttempts(newAttempts); // Pievieno mēģinājumu sarakstam
      setTestState("complete");
      
      // Saglabā rezultātu datubāzē
      saveTestResult("reaction", reaction, {
        attempts: newAttempts,
        averageTime: Math.round(newAttempts.reduce((sum, time) => sum + time, 0) / newAttempts.length)
      });
    } else if (testState === "waiting") {
      // Ja lietotājs klikšķina pārāk agri
      setTestState("early");
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }
  };

  // Atiestatīt testu uz sākuma stāvokli
  const resetTest = () => {
    setTestState("ready");
    setReactionTime(null);
    setCountdown(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // Aprēķina vidējo reakcijas laiku no visiem mēģinājumiem
  const getAverageTime = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, time) => sum + time, 0) / attempts.length);
  };

  // Novērtē sniegumu pēc reakcijas laika
  const getPerformanceRating = (time: number) => {
    if (time < 200) return { text: "Izcili", color: "text-cognitive-success" };
    if (time < 250) return { text: "Labi", color: "text-cognitive-accent" };
    if (time < 300) return { text: "Vidēji", color: "text-cognitive-warning" };
    return { text: "Nepieciešama Prakse", color: "text-destructive" };
  };

  // Notīra taimerus, kad komponente tiek noņemta
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
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
            <Zap className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">Reakcijas Laika Tests</h1>
          </div>
        </div>

        {/* Main Test Area */}
        <Card className="mb-8 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle>
              {testState === "ready" && "Nospied Sākt, lai sāktu"}
              {testState === "waiting" && countdown && `Sagatavojies... ${countdown}`}
              {testState === "waiting" && !countdown && "Gaidi signālu..."}
              {testState === "active" && "NOSPIED TAGAD!"}
              {testState === "complete" && `${reactionTime}ms`}
              {testState === "early" && "Par agru!"}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && "Pārbaudi savu reakcijas ātrumu, nospiežot, kad ekrāns mainās"}
              {testState === "waiting" && "Nenospied, kamēr neredzēsi signālu"}
              {testState === "active" && "Ātri! Nospied, cik vari ātri"}
              {testState === "complete" && getPerformanceRating(reactionTime!).text}
              {testState === "early" && "Gaidi zaļo signālu pirms nospiešanas"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div 
              className={`
                w-full h-64 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300 flex items-center justify-center text-2xl font-bold
                ${testState === "ready" ? "border-muted-foreground bg-muted/20 hover:bg-muted/30" : ""}
                ${testState === "waiting" ? "border-cognitive-warning bg-cognitive-warning/10 animate-pulse" : ""}
                ${testState === "active" ? "border-cognitive-success bg-cognitive-success/20 animate-pulse-glow" : ""}
                ${testState === "complete" ? "border-cognitive-accent bg-cognitive-accent/10" : ""}
                ${testState === "early" ? "border-destructive bg-destructive/10" : ""}
              `}
              onClick={handleClick}
            >
              {testState === "ready" && "Nospied, lai sāktu"}
              {testState === "waiting" && "Gaidi..."}
              {testState === "active" && "NOSPIED!"}
              {testState === "complete" && (
                <div className="text-center">
                  <div className={`text-4xl ${getPerformanceRating(reactionTime!).color}`}>
                    {reactionTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {getPerformanceRating(reactionTime!).text}
                  </div>
                </div>
              )}
              {testState === "early" && "Par Agru!"}
            </div>

            <div className="flex gap-4 mt-6 justify-center">
              {testState === "ready" && (
                <Button onClick={startTest} className="bg-cognitive-primary hover:bg-cognitive-primary/80">
                  <Play className="w-4 h-4 mr-2" />
                  Sākt Testu
                </Button>
              )}
              {(testState === "complete" || testState === "early") && (
                <Button onClick={resetTest} variant="secondary">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Mēģināt Vēlreiz
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {attempts.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Tavi Rezultāti</CardTitle>
              <CardDescription>Snieguma vēsture un statistika</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-accent">{attempts.length}</div>
                  <div className="text-sm text-muted-foreground">Mēģinājumi</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-primary">{getAverageTime()}ms</div>
                  <div className="text-sm text-muted-foreground">Vidējais</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-success">{Math.min(...attempts)}ms</div>
                  <div className="text-sm text-muted-foreground">Labākais</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-muted-foreground">{Math.max(...attempts)}ms</div>
                  <div className="text-sm text-muted-foreground">Sliktākais</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Jaunākie Mēģinājumi:</h4>
                <div className="flex flex-wrap gap-2">
                  {attempts.slice(-10).map((time, index) => (
                    <span 
                      key={index} 
                      className={`px-3 py-1 rounded-full text-sm ${getPerformanceRating(time).color} bg-muted/50`}
                    >
                      {time}ms
                    </span>
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

export default ReactionTest;