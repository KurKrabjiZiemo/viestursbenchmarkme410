/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: NUMBERMEMORYTEST.TSX - CIPARU ATMĒŅAS TESTA KOMPONENTE
 * APRAKSTS: CIPARU ATMĒŅAS TESTS, KUR LIETOTĀJAM JĀIEGAUMĒ
 *           UN JĀIEVADA AIZVIEN GARĀKAS CIPARU VIRKNES
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us
import { useState, useEffect } from "react";
// Importē ikonas
import { ArrowLeft, Play, RotateCcw, Hash, Eye, EyeOff } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// Importē hook rezultātu saglabāšanai
import { useTestResults } from "@/hooks/useTestResults";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";

// Komponentes rekvizīti
interface NumberMemoryTestProps {
  onBack: () => void; // Funkcija atgriešanās uz sākumlapu
  language: "lv" | "en";
}

// Testa stāvokļa tipi
type TestState = "ready" | "showing" | "recalling" | "complete";

// Skaitļu atmiņas testa komponente
const NumberMemoryTest = ({ onBack, language }: NumberMemoryTestProps) => {
  // Iegūst funkciju rezultātu saglabāšanai
  const { saveTestResult } = useTestResults();
  
  // Stāvokļa mainīgie
  const [testState, setTestState] = useState<TestState>("ready");
  const [currentNumber, setCurrentNumber] = useState(""); // Pašreizējais skaitlis, kas jāatceras
  const [userInput, setUserInput] = useState(""); // Lietotāja ievadītais skaitlis
  const [currentLevel, setCurrentLevel] = useState(1); // Pašreizējais līmenis
  const [score, setScore] = useState(0); // Iegūtie punkti
  const [attempts, setAttempts] = useState<{ level: number; correct: boolean; number: string; input: string }[]>([]); // Visi mēģinājumi
  const [showTime, setShowTime] = useState(3); // Cik ilgi parāda skaitli (sekundēs)
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState(false); // Lietotājam spiests mēģināt no jauna, ja zaudē

  const t = {
    back: language === "lv" ? "Atpakaļ" : "Back",
    title: language === "lv" ? "Skaitļu Atmiņas Tests" : "Number Memory Test",
    level: language === "lv" ? "Līmenis" : "Level",
    score: language === "lv" ? "Rezultāts" : "Score",
    digits: language === "lv" ? "Cipari" : "Digits",
    ready: language === "lv" ? "Gatavs iegaumēt?" : "Ready to memorize?",
    rememberNumber: language === "lv" ? "Atceries šo skaitli" : "Remember this number",
    typeNumber: language === "lv" ? "Ieraksti skaitli" : "Type the number",
    correct: language === "lv" ? "Pareizi!" : "Correct!",
    incorrect: language === "lv" ? "Nepareizi" : "Incorrect",
    readyDesc: language === "lv" ? "Iegaumē" : "Memorize a",
    showingDesc: language === "lv" ? "Koncentrējies uz secību" : "Focus on the sequence",
    recallingDesc: language === "lv" ? "Ievadi skaitli, kuru redzēji" : "Enter the number you saw",
    numberWas: language === "lv" ? "Skaitlis bija" : "The number was",
    inputPlaceholder: language === "lv" ? "Ievadi skaitli..." : "Enter the number...",
    submit: language === "lv" ? "Iesniegt" : "Submit",
    correctNumber: language === "lv" ? "Pareizais" : "Correct",
    yourInput: language === "lv" ? "Tavs Ievadītais" : "Your Input",
    start: language === "lv" ? "Sākt" : "Start",
    nextLevel: language === "lv" ? "Nākamais Līmenis" : "Next Level",
    restart: language === "lv" ? "Sākt No Jauna" : "Start Over",
    results: language === "lv" ? "Tavi Rezultāti" : "Your Results",
    resultsDescription: language === "lv" ? "Snieguma vēsture un statistika" : "Performance history and stats",
    attempts: language === "lv" ? "Mēģinājumi" : "Attempts",
    accuracy: language === "lv" ? "Precizitāte" : "Accuracy",
    bestLevel: language === "lv" ? "Labākais Līmenis" : "Best Level",
    latestAttempts: language === "lv" ? "Jaunākie Mēģinājumi:" : "Latest Attempts:",
  };

  // Ģenerē gadījuma skaitli ar noteiktu ciparu skaitu
  const generateNumber = (digits: number) => {
    let number = "";
    for (let i = 0; i < digits; i++) {
      // Izvairās no nulles kā pirmā cipara
      const digit = i === 0 ? Math.floor(Math.random() * 9) + 1 : Math.floor(Math.random() * 10);
      number += digit.toString();
    }
    return number;
  };

  // Sāk testu ar jaunu skaitli
  const startTest = () => {
    const digits = Math.min(3 + currentLevel, 15); // Sāk ar 4 cipariem, maksimums 15
    const number = generateNumber(digits);
    setCurrentNumber(number);
    setUserInput("");
    setTestState("showing"); // Sāk rādīt skaitli
    setShowTime(Math.max(2, Math.ceil(digits * 0.5))); // Rādīšanas laiks atkarīgs no ciparu skaita
  };

  // Pārvalda taimeri skaitļa rādīšanai
  useEffect(() => {
    if (testState === "showing" && showTime > 0) {
      const timer = setTimeout(() => {
        if (showTime === 1) {
          setTestState("recalling"); // Pārslēdzas uz atcerēšanās režīmu
          setShowTime(0);
        } else {
          setShowTime(showTime - 1);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [testState, showTime]);

  // Apstrādā lietotāja ievadītā skaitļa iesniegšanu
  const handleSubmit = () => {
    const isCorrect = userInput === currentNumber;
    const attempt = {
      level: currentLevel,
      correct: isCorrect,
      number: currentNumber,
      input: userInput
    };
    
    setAttempts(prev => [...prev, attempt]);
    setLastAttemptCorrect(isCorrect);
    
    // Ja pareizi, piešķir punktus un palielina līmeni
    const newScore = isCorrect ? score + currentLevel * 100 : score;
    if (isCorrect) {
      setScore(newScore);
      setCurrentLevel(currentLevel + 1);
    }
    
    setTestState("complete");
    
    // Saglabā rezultātu datubāzē
    saveTestResult("number_memory", newScore, {
      level: currentLevel,
      isCorrect,
      totalAttempts: attempts.length + 1
    });
  };

  // Atiestatīt testu uz sākuma stāvokli
  const resetTest = () => {
    setTestState("ready");
    setCurrentNumber("");
    setUserInput("");
    setCurrentLevel(1);
    setScore(0);
    setAttempts([]);
    setShowTime(3);
    setLastAttemptCorrect(false);
  };

  // Aprēķina precizitāti procentos
  const getAccuracy = () => {
    if (attempts.length === 0) return 100;
    const correct = attempts.filter(a => a.correct).length;
    return Math.round((correct / attempts.length) * 100);
  };

  // Iegūst augstāko sasniegto līmeni
  const getHighestLevel = () => {
    return Math.max(...attempts.filter(a => a.correct).map(a => a.level), 0);
  };

  // Formatē skaitļa attēlošanu ar atstarpēm starp cipariem
  const formatNumberDisplay = (number: string) => {
    return number.split('').join(' ');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
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
            <Hash className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>

        {/* Status Bar */}
        <Card className="mb-6 bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-primary">{currentLevel}</div>
                <div className="text-sm text-muted-foreground">{t.level}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-success">{score}</div>
                <div className="text-sm text-muted-foreground">{t.score}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-accent">
                  {Math.min(3 + currentLevel, 15)}
                </div>
                <div className="text-sm text-muted-foreground">{t.digits}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Test Area */}
        <Card className="mb-8 bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              {testState === "ready" && <Play className="w-6 h-6" />}
              {testState === "showing" && <Eye className="w-6 h-6 text-cognitive-warning" />}
              {testState === "recalling" && <EyeOff className="w-6 h-6 text-cognitive-accent" />}
              {testState === "complete" && <Hash className="w-6 h-6 text-cognitive-success" />}
              
              {testState === "ready" && t.ready}
              {testState === "showing" && `${t.rememberNumber} (${showTime}s)`}
              {testState === "recalling" && t.typeNumber}
              {testState === "complete" && (userInput === currentNumber ? t.correct : t.incorrect)}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && `${t.readyDesc} ${Math.min(3 + currentLevel, 15)} ${language === "lv" ? "ciparu skaitli" : "digit number"}`}
              {testState === "showing" && t.showingDesc}
              {testState === "recalling" && t.recallingDesc}
              {testState === "complete" && `${t.numberWas}: ${formatNumberDisplay(currentNumber)}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {testState === "showing" && (
              <div
                className="bg-muted/20 rounded-lg p-8 mb-6 select-none"
                onCopy={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
              >
                <div className="text-6xl font-mono font-bold text-cognitive-primary animate-pulse-glow">
                  {formatNumberDisplay(currentNumber)}
                </div>
              </div>
            )}

            {testState === "recalling" && (
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder={t.inputPlaceholder}
                  value={userInput}
                  onChange={(e) => {
                    const digitsOnly = e.target.value.replace(/\D/g, '');
                    const limited = digitsOnly.slice(0, currentNumber.length || 15);
                    setUserInput(limited);
                  }}
                  onPaste={(e) => e.preventDefault()}
                  onDrop={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    const key = e.key || '';
                    const isPasteShortcut = (e.ctrlKey || e.metaKey) && key.toLowerCase() === 'v';
                    const isShiftInsert = e.shiftKey && key === 'Insert';
                    if (isPasteShortcut || isShiftInsert) {
                      e.preventDefault();
                    }
                  }}
                  className="text-center text-2xl font-mono h-16 text-lg"
                  maxLength={currentNumber.length || 15}
                  autoFocus
                />
                <Button 
                  onClick={handleSubmit}
                  disabled={!userInput}
                  className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                  size="lg"
                >
                  {t.submit}
                </Button>
              </div>
            )}

            {testState === "complete" && (
              <div className="space-y-4">
                <div className="bg-muted/20 rounded-lg p-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.correctNumber}</div>
                      <div className="text-2xl font-mono font-bold text-cognitive-success">
                        {formatNumberDisplay(currentNumber)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">{t.yourInput}</div>
                      <div className={`text-2xl font-mono font-bold ${userInput === currentNumber ? 'text-cognitive-success' : 'text-destructive'}`}>
                        {formatNumberDisplay(userInput || "---")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6 justify-center">
              {testState === "ready" && (
                <Button 
                  onClick={startTest} 
                  className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t.start} {currentLevel}. {language === "lv" ? "līmeni" : "level"}
                </Button>
              )}
              {testState === "complete" && (
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button 
                    onClick={startTest}
                    disabled={!lastAttemptCorrect}
                    className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                  >
                    {t.nextLevel}
                  </Button>
                  <Button onClick={resetTest} variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.restart}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {attempts.length > 0 && (
          <Card className="bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
            <CardHeader>
              <CardTitle>{t.results}</CardTitle>
              <CardDescription>{t.resultsDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-accent">{attempts.length}</div>
                  <div className="text-sm text-muted-foreground">{t.attempts}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-primary">{getAccuracy()}%</div>
                  <div className="text-sm text-muted-foreground">{t.accuracy}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-success">{getHighestLevel()}</div>
                  <div className="text-sm text-muted-foreground">{t.bestLevel}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-warning">{score}</div>
                  <div className="text-sm text-muted-foreground">{t.score}</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">{t.latestAttempts}</h4>
                <div className="space-y-2">
                  {attempts.slice(-5).reverse().map((attempt, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        attempt.correct 
                          ? 'border-cognitive-success/50 bg-cognitive-success/10' 
                          : 'border-destructive/50 bg-destructive/10'
                      }`}
                    >
                      <div className="flex justify-between items-center text-sm">
                        <span>{attempt.level}. līmenis ({attempt.number.length} cipari)</span>
                        <span className={attempt.correct ? 'text-cognitive-success' : 'text-destructive'}>
                          {attempt.correct ? '✓' : '✗'}
                        </span>
                      </div>
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

export default NumberMemoryTest;