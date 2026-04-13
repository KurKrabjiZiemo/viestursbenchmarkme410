/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: MEMORYTEST.TSX - VIZUĀLĀS ATMĒŅAS TESTA KOMPONENTE
 * APRAKSTS: VIZUĀLĀS ATMĒŅAS TESTS, KUR LIETOTĀJAM JĀIEGAUMĒ
 *           UN JĀATVEIDO REDZĒTO ELEMENTU IZVIETOŠANA
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us
import { useState, useEffect } from "react";
// Importē ikonas
import { ArrowLeft, Play, RotateCcw, Brain, Eye, EyeOff } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē hook rezultātu saglabāšanai
import { useTestResults } from "@/hooks/useTestResults";

// Komponentes rekvizīti
interface MemoryTestProps {
  onBack: () => void; // Funkcija atgriešanās uz sākumlapu
  language: "lv" | "en";
}

// Testa stāvokļa tipi
type TestState = "ready" | "showing" | "memorizing" | "recalling" | "complete";

// Testa konstantes
const GRID_SIZE = 4; // Režģa izmērs (4x4)
const SEQUENCE_LENGTH = 4; // Sākuma secības garums
const SHOW_TIME = 2000; // Cik ilgi parāda secību (milisekundēs)
const MEMORIZE_TIME = 3000; // Cik ilgi lietotājs var atcerēties (milisekundēs)

// Vizuālās atmiņas testa komponente
const MemoryTest = ({ onBack, language }: MemoryTestProps) => {
  // Iegūst funkciju rezultātu saglabāšanai
  const { saveTestResult } = useTestResults();
  
  // Stāvokļa mainīgie
  const [testState, setTestState] = useState<TestState>("ready");
  const [sequence, setSequence] = useState<number[]>([]); // Pareizā secība
  const [userSequence, setUserSequence] = useState<number[]>([]); // Lietotāja izvēlētā secība
  const [currentLevel, setCurrentLevel] = useState(1); // Pašreizējais līmenis
  const [score, setScore] = useState(0); // Iegūtie punkti
  const [showingIndex, setShowingIndex] = useState(0); // Kurš elements pašlaik tiek rādīts
  const [timeLeft, setTimeLeft] = useState(0); // Atlikušais laiks
  const [lastAttemptCorrect, setLastAttemptCorrect] = useState(false); // Lietotājam spiests mēģināt no jauna, ja zaudē

  const t = {
    back: language === "lv" ? "Atpakaļ" : "Back",
    title: language === "lv" ? "Vizuālās Atmiņas Tests" : "Visual Memory Test",
    level: language === "lv" ? "Līmenis" : "Level",
    score: language === "lv" ? "Rezultāts" : "Score",
    sequence: language === "lv" ? "Secība" : "Sequence",
    ready: language === "lv" ? "Gatavs sākt" : "Ready to start",
    watch: language === "lv" ? "Skaties secību" : "Watch the sequence",
    memorize: language === "lv" ? "Atceries kvadrātus" : "Memorize the squares",
    repeat: language === "lv" ? "Atkārto secību" : "Repeat the sequence",
    completed: language === "lv" ? "līmenis pabeigts!" : "level completed!",
    tryAgain: language === "lv" ? "Mēģini vēlreiz!" : "Try again!",
    readyDesc: language === "lv" ? "Iegaumē iezīmētos kvadrātus!" : "Memorize the highlighted squares!",
    watchDesc: language === "lv" ? "Pievērs uzmanību secībai" : "Focus on the sequence",
    memorizeDesc: language === "lv" ? "Sagatavojies atkārtot secību" : "Get ready to repeat the sequence",
    repeatDesc: language === "lv" ? "Nospied kvadrātus tajā pašā secībā" : "Click the squares in the same order",
    accuracy: language === "lv" ? "Precizitāte" : "Accuracy",
    startLevel: language === "lv" ? "Sākt" : "Start",
    nextLevel: language === "lv" ? "Nākamais Līmenis" : "Next Level",
    restart: language === "lv" ? "Sākt No Jauna" : "Start Over",
    progress: language === "lv" ? "Progress" : "Progress",
  };

  // Ģenerē gadījuma secību ar noteiktu garumu (bez atkārtošanās)
  const generateSequence = (length: number) => {
    const newSequence: number[] = [];
    const usedIndices = new Set<number>();
    for (let i = 0; i < length; i++) {
      let randomIndex: number;
      do {
        randomIndex = Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE));
      } while (usedIndices.has(randomIndex));
      usedIndices.add(randomIndex);
      newSequence.push(randomIndex);
    }
    return newSequence;
  };

  // Sāk testu ar jaunu secību
  const startTest = () => {
    const newSequence = generateSequence(SEQUENCE_LENGTH + currentLevel - 1);
    setSequence(newSequence);
    setUserSequence([]);
    setTestState("showing"); // Sāk rādīt secību
    setShowingIndex(0);
    setTimeLeft(SHOW_TIME / 1000);
  };

  // Apstrādā lietotāja klikšķi uz režģa šūnas
  const handleCellClick = (index: number) => {
    if (testState === "recalling" && !userSequence.includes(index)) {
      const newUserSequence = [...userSequence, index];
      setUserSequence(newUserSequence);

      // Ja lietotājs ir izvēlējies visu secību, pārbauda vai tā ir pareiza
      if (newUserSequence.length === sequence.length) {
        const isCorrect = newUserSequence.every((item, idx) => item === sequence[idx]);
        const newScore = isCorrect ? score + currentLevel * 10 : score;
        if (isCorrect) {
          setScore(newScore); // Piešķir punktus
          setCurrentLevel(currentLevel + 1); // Palielina līmeni
        }
        setLastAttemptCorrect(isCorrect);
        setTestState("complete");
        
        // Saglabā rezultātu datubāzē
        saveTestResult("memory", newScore, {
          level: currentLevel,
          accuracy: getAccuracy(),
          isCorrect
        });
      }
    }
  };

  // Atiestatīt testu uz sākuma stāvokli
  const resetTest = () => {
    setTestState("ready");
    setSequence([]);
    setUserSequence([]);
    setCurrentLevel(1);
    setScore(0);
    setShowingIndex(0);
    setTimeLeft(0);
    setLastAttemptCorrect(false);
  };

  // Aprēķina precizitāti procentos
  const getAccuracy = () => {
    if (userSequence.length === 0) return 100;
    const correct = userSequence.filter((item, idx) => item === sequence[idx]).length;
    return Math.round((correct / sequence.length) * 100);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (testState === "showing") {
      interval = setInterval(() => {
        setShowingIndex(prev => {
          if (prev < sequence.length - 1) {
            return prev + 1;
          } else {
            setTestState("memorizing");
            setTimeLeft(MEMORIZE_TIME / 1000);
            return prev;
          }
        });
      }, SHOW_TIME / sequence.length);
    }

    if (testState === "memorizing") {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTestState("recalling");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testState, sequence.length]);

  const isInSequence = (index: number, upToIndex?: number) => {
    const checkIndex = upToIndex !== undefined ? upToIndex : showingIndex;
    return sequence.slice(0, checkIndex + 1).includes(index);
  };

  const isCurrentShowing = (index: number) => {
    return testState === "showing" && sequence[showingIndex] === index;
  };

  const isUserSelected = (index: number) => {
    return userSequence.includes(index);
  };

  const isCorrectPosition = (index: number) => {
    const userIndex = userSequence.indexOf(index);
    return userIndex !== -1 && sequence[userIndex] === index;
  };

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
            <Brain className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
        </div>

        {/* Status Bar */}
        <Card className="mb-6 bg-gradient-card border-border/50">
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
                  {sequence.length || SEQUENCE_LENGTH}
                </div>
                <div className="text-sm text-muted-foreground">{t.sequence}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              {testState === "ready" && <Play className="w-5 h-5" />}
              {testState === "showing" && <Eye className="w-5 h-5 text-cognitive-warning" />}
              {testState === "memorizing" && <EyeOff className="w-5 h-5 text-cognitive-accent" />}
              {testState === "recalling" && <Brain className="w-5 h-5 text-cognitive-primary" />}
              {testState === "complete" && <Brain className="w-5 h-5 text-cognitive-success" />}
              
              {testState === "ready" && t.ready}
              {testState === "showing" && t.watch}
              {testState === "memorizing" && `${t.memorize} (${timeLeft}s)`}
              {testState === "recalling" && t.repeat}
              {testState === "complete" && (lastAttemptCorrect ? `${currentLevel - 1}. ${t.completed}` : t.tryAgain)}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && t.readyDesc}
              {testState === "showing" && t.watchDesc}
              {testState === "memorizing" && t.memorizeDesc}
              {testState === "recalling" && t.repeatDesc}
              {testState === "complete" && `${t.accuracy}: ${getAccuracy()}%`}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Game Grid */}
        <Card className="mb-6 bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => (
                <div
                  key={index}
                  className={`
                    aspect-square rounded-lg border-2 transition-all duration-300 flex items-center justify-center font-bold
                    ${testState === "recalling" && !userSequence.includes(index) ? "cursor-pointer hover:scale-105" : testState === "recalling" && userSequence.includes(index) ? "cursor-not-allowed" : ""}
                    ${isCurrentShowing(index) 
                      ? "border-cognitive-warning bg-cognitive-warning/30 animate-pulse-glow" 
                      : ""
                    }
                    ${testState === "memorizing" && isInSequence(index, sequence.length - 1)
                      ? "border-cognitive-accent bg-cognitive-accent/20"
                      : ""
                    }
                    ${testState === "recalling" && isUserSelected(index)
                      ? isCorrectPosition(index)
                        ? "border-cognitive-success bg-cognitive-success/20"
                        : "border-destructive bg-destructive/20"
                      : ""
                    }
                    ${testState === "complete" && sequence.includes(index)
                      ? isCorrectPosition(index)
                        ? "border-cognitive-success bg-cognitive-success/20"
                        : "border-cognitive-warning bg-cognitive-warning/20"
                      : ""
                    }
                    ${!isCurrentShowing(index) && 
                      !isUserSelected(index) && 
                      testState !== "memorizing" && 
                      (testState !== "complete" || !sequence.includes(index))
                      ? "border-muted bg-muted/10"
                      : ""
                    }
                  `}
                  onClick={() => handleCellClick(index)}
                >
                  {testState === "complete" && sequence.includes(index) && (
                    <span className="text-sm">
                      {sequence.indexOf(index) + 1}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-8 justify-center">
              {testState === "ready" && (
                <Button 
                  onClick={startTest} 
                  className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t.startLevel} {currentLevel}. {language === "lv" ? "līmeni" : "level"}
                </Button>
              )}
              {testState === "complete" && (
                <div className="flex gap-2">
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

        {/* Progress Indicator */}
        {testState === "recalling" && (
          <Card className="bg-gradient-card border-border/50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm text-muted-foreground mb-2">
                  {t.progress}: {userSequence.length}/{sequence.length}
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-cognitive-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(userSequence.length / sequence.length) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MemoryTest;