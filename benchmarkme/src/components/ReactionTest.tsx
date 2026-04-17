/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: REACTIONTEST.TSX - REAKCIJAS LAIKA TESTA KOMPONENTE
 * APRAKSTS: REAKCIJAS ĀTRUMA TESTS, KUR LIETOTĀJAM JĀREAGĒ
 *           UZ VIZĀLU SIGNĀLU PĒC IESPĒJAS ĀTRĀK
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us
import { useState, useEffect, useRef } from "react";
// Importē ikonas
import { ArrowLeft, Play, RotateCcw, Zap } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē hook rezultātu saglabāšanai
import { useTestResults } from "@/hooks/useTestResults";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";

// Komponentes rekvizīti
interface ReactionTestProps {
  onBack: () => void; // Funkcija atgriešanās uz sākumlapu
  language: "lv" | "en";
}

// Testa stāvokļa tipi
type TestState = "ready" | "waiting" | "active" | "complete" | "early";

// Reakcijas laika testa komponente
const ReactionTest = ({ onBack, language }: ReactionTestProps) => {
  // Iegūst funkciju rezultātu saglabāšanai
  const { saveTestResult } = useTestResults();
  
  // Stāvokļa mainīgie
  const [testState, setTestState] = useState<TestState>("ready"); // Pašreizējais testa stāvoklis
  const [reactionTime, setReactionTime] = useState<number | null>(null); // Pēdējais reakcijas laiks
  const [attempts, setAttempts] = useState<number[]>([]); // Visi mēģinājumi
  const [countdown, setCountdown] = useState<number | null>(null); // Atpakaļskaitīšanas skaitlis

  const t = {
    back: language === "lv" ? "Atpakaļ" : "Back",
    title: language === "lv" ? "Reakcijas Laika Tests" : "Reaction Time Test",
    readyTitle: language === "lv" ? "Nospied Sākt, lai sāktu" : "Press Start to begin",
    prep: language === "lv" ? "Sagatavojies..." : "Get ready...",
    wait: language === "lv" ? "Gaidi..." : "Wait...",
    click: language === "lv" ? "SPIED!" : "CLICK!",
    yourResult: language === "lv" ? "Tavs rezultāts" : "Your result",
    tooEarly: language === "lv" ? "Par agru!" : "Too early!",
    readyDescription:
      language === "lv"
        ? "Pārbaudi savu reakcijas ātrumu, nospiežot, kad ekrāns mainās"
        : "Test your reaction speed by clicking when the screen changes",
    waitingDescription: language === "lv" ? "Nenospied, kamēr nav zaļš" : "Do not click until it turns green",
    activeDescription: language === "lv" ? "Ātri! Nospied, cik vari ātri" : "Quick! Click as fast as you can",
    earlyDescription: language === "lv" ? "Gaidi zaļo lauku pirms nospiešanas" : "Wait for the green area before clicking",
    start: language === "lv" ? "Sākt" : "Start",
    clickAgain: language === "lv" ? "Klikšķini, lai mēģinātu vēlreiz!" : "Click to try again!",
    tryAgainShort: language === "lv" ? "Mēģinam vēlreiz?" : "Try again?",
    results: language === "lv" ? "Tavi Rezultāti" : "Your Results",
    resultsDescription: language === "lv" ? "Snieguma vēsture un statistika" : "Performance history and stats",
    attempts: language === "lv" ? "Mēģinājumi" : "Attempts",
    average: language === "lv" ? "Vidējais" : "Average",
    best: language === "lv" ? "Labākais" : "Best",
    worst: language === "lv" ? "Sliktākais" : "Worst",
    latestAttempts: language === "lv" ? "Jaunākie Mēģinājumi:" : "Latest Attempts:",
  };
  
  // Atsauces precīzai laika mērīšanai
  const startTimeRef = useRef<number>(0); // Testa sākuma laiks
  const timeoutRef = useRef<NodeJS.Timeout>(); // Taimera atsauce
  const countdownIntervalRef = useRef<NodeJS.Timeout>(); // Atpakaļskaitīšanas intervāla atsauce

  // Sāk testu ar atpakaļskaitīšanu un gadījuma aizkavi
  const startTest = () => {
    setTestState("waiting");
    setCountdown(3);
    
    // Atpakaļskaitīšana
    countdownIntervalRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
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
    if (testState === "ready") {
      // Ja tests vēl nav sākts, sāk to
      startTest();
    } else if (testState === "active") {
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
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      setCountdown(null);
    } else if (testState === "complete" || testState === "early") {
      // Ja tests ir pabeigts vai bija pārāk agrs, atiestatīt
      resetTest();
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
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  // Aprēķina vidējo reakcijas laiku no visiem mēģinājumiem
  const getAverageTime = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, time) => sum + time, 0) / attempts.length);
  };

  // Novērtē sniegumu pēc reakcijas laika
  const getPerformanceRating = (time: number) => {
    if (time < 200) return { text: language === "lv" ? "Izcili" : "Excellent", color: "text-cognitive-success" };
    if (time < 250) return { text: language === "lv" ? "Labi" : "Good", color: "text-cognitive-accent" };
    if (time < 300) return { text: language === "lv" ? "Vidēji" : "Average", color: "text-cognitive-warning" };
    return { text: language === "lv" ? "Nepieciešama prakse" : "Needs practice", color: "text-destructive" };
  };

  // Notīra taimerus, kad komponente tiek noņemta
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
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
            {t.back}
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>

        {/* Main Test Area */}
        <Card className="mb-8 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle>
              {testState === "ready" && t.readyTitle}
              {testState === "waiting" && countdown && `${t.prep} ${countdown}`}
              {testState === "waiting" && !countdown && t.wait}
              {testState === "active" && t.click}
              {testState === "complete" && t.yourResult}
              {testState === "early" && t.tooEarly}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && t.readyDescription}
              {testState === "waiting" && t.waitingDescription}
              {testState === "active" && t.activeDescription}
              {testState === "early" && t.earlyDescription}
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
              {testState === "ready" && t.start}
              {testState === "waiting" && t.wait}
              {testState === "active" && t.click}
              {testState === "complete" &&  
              (
                <div className="text-center">
                  <div className={`text-4xl ${getPerformanceRating(reactionTime!).color}`}>
                    {reactionTime}ms
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {getPerformanceRating(reactionTime!).text}
                  </div>
                  <div className="text-base mt-4 opacity-70">
                    {t.clickAgain}
                  </div>
                </div>
              )}
              {testState === "early" && t.tryAgainShort}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {attempts.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>{t.results}</CardTitle>
              <CardDescription>{t.resultsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-accent">{attempts.length}</div>
                  <div className="text-sm text-muted-foreground">{t.attempts}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-primary">{getAverageTime()}ms</div>
                  <div className="text-sm text-muted-foreground">{t.average}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-success">{Math.min(...attempts)}ms</div>
                  <div className="text-sm text-muted-foreground">{t.best}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-muted-foreground">{Math.max(...attempts)}ms</div>
                  <div className="text-sm text-muted-foreground">{t.worst}</div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold mb-2">{t.latestAttempts}</h4>
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