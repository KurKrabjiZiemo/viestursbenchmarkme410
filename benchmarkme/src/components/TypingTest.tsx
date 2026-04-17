import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, RotateCcw, Keyboard, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTestResults } from "@/hooks/useTestResults";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";

interface TypingTestProps {
  onBack: () => void;
  language: "lv" | "en";
}

type TestState = "ready" | "countdown" | "active" | "complete";

const TEST_DURATION = 60;
const COUNTDOWN_DURATION = 5;

const SAMPLE_TEXTS_LV = [
  "Atrais brunais lapsa leca pari slinkajam sunim. Sis teikums satur visus alfabetta burtus vismaz vienu reizi un ir lielisks rakstisanas trenninam.",
  "Tehnologija ir labaka, kad ta apvieno cilvekus kopa. Nkotne pieder tiem, kas apgust vairak prasmju un apvieno tas radosos veidos.",
  "Prakse rada progresu, nevis perfektumu. Katrs taustina sitiens veido muskulu atminu, un katra kluda ir macisanas iespeja.",
];

const SAMPLE_TEXTS_EN = [
  "The quick brown fox jumps over the lazy dog. This sentence includes every letter of the alphabet and is great for typing practice.",
  "Technology is best when it brings people together. The future belongs to those who keep learning and combine skills creatively.",
  "Practice builds progress, not perfection. Every keystroke builds muscle memory, and every mistake is a chance to improve.",
];

const TypingTest = ({ onBack, language }: TypingTestProps) => {
  const { saveTestResult } = useTestResults();

  const [testState, setTestState] = useState<TestState>("ready");
  const [testText, setTestText] = useState("");
  const [userInput, setUserInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [countdownLeft, setCountdownLeft] = useState(COUNTDOWN_DURATION);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [attempts, setAttempts] = useState<{ wpm: number; accuracy: number; timestamp: Date }[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const t = {
    back: language === "lv" ? "Atpakal" : "Back",
    title: language === "lv" ? "Rakstisanas Atruma Tests" : "Typing Speed Test",
    time: language === "lv" ? "Laiks" : "Time",
    wpmShort: language === "lv" ? "VM" : "WPM",
    accuracy: language === "lv" ? "Precizitate" : "Accuracy",
    progress: language === "lv" ? "Progress" : "Progress",
    ready: language === "lv" ? "Gatavs rakstit?" : "Ready to type?",
    active: language === "lv" ? "Ieraksti tekstu zemak" : "Type the text below",
    finalAccuracy: language === "lv" ? "Galiga precizitate" : "Final accuracy",
    readyDesc:
      language === "lv"
        ? "Parbaudi savu rakstisanas atrumu un precizitati 60 sekundes"
        : "Test your typing speed and accuracy for 60 seconds",
      activeDesc: language === "lv" ? "Raksti, cik precizi un atri vari" : "Type as accurately and quickly as you can",
      start: language === "lv" ? "Sakt Rakstisanas Testu" : "Start Typing Test",
      placeholder: language === "lv" ? "Sac rakstit seit..." : "Start typing here...",
      chars: language === "lv" ? "Rakstzimes" : "Characters",
      retry: language === "lv" ? "Meginat Velreiz" : "Try Again",
      reset: language === "lv" ? "Atiestatit" : "Reset",
    prepare: language === "lv" ? "Sagatavojies!" : "Get ready!",
    results: language === "lv" ? "Tavi Rezultati" : "Your Results",
    history: language === "lv" ? "Rakstisanas snieguma vesture" : "Typing performance history",
    tests: language === "lv" ? "Testi" : "Tests",
    avgWpm: language === "lv" ? "Vid. VM" : "Avg WPM",
    bestWpm: language === "lv" ? "Labakais VM" : "Best WPM",
    avgAccuracy: language === "lv" ? "Vid. Precizitate" : "Avg Accuracy",
    latestTests: language === "lv" ? "Jaunakie Testi:" : "Latest Tests:",
    accuracyWord: language === "lv" ? "precizitate" : "accuracy",
  };

  const startTest = () => {
    const sourceTexts = language === "lv" ? SAMPLE_TEXTS_LV : SAMPLE_TEXTS_EN;
    const randomText = sourceTexts[Math.floor(Math.random() * sourceTexts.length)];
    setTestText(randomText);
    setUserInput("");
    setTimeLeft(TEST_DURATION);
    setCountdownLeft(COUNTDOWN_DURATION);
    setStartTime(null);
    setTestState("countdown");
  };

  const calculateWPM = (text: string, timeElapsed: number) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = timeElapsed / 60000;
    return Math.max(0, Math.round(words / Math.max(minutes, 0.01)));
  };

  const calculateAccuracy = (original: string, typed: string) => {
    if (typed.length === 0) return 100;
    let correct = 0;
    const minLength = Math.min(original.length, typed.length);
    for (let i = 0; i < minLength; i++) {
      if (original[i] === typed[i]) {
        correct++;
      }
    }
    return Math.round((correct / typed.length) * 100);
  };

  const endTest = useCallback((typedText?: string) => {
    const input = typedText ?? userInput;
    if (startTime) {
      const finalWPM = calculateWPM(input, Date.now() - startTime);
      const finalAccuracy = calculateAccuracy(testText, input);

      setWpm(finalWPM);
      setAccuracy(finalAccuracy);
      setAttempts((prev) => [...prev, { wpm: finalWPM, accuracy: finalAccuracy, timestamp: new Date() }]);

      saveTestResult("typing", finalWPM, {
        wpm: finalWPM,
        accuracy: finalAccuracy,
      });
    }
    setTestState("complete");
  }, [startTime, userInput, testText, saveTestResult]);

  const endTestRef = useRef(endTest);
  useEffect(() => {
    endTestRef.current = endTest;
  }, [endTest]);

  const handleInputChange = (value: string) => {
    if (testState !== "active") return;

    setUserInput(value);

    if (startTime) {
      const timeElapsed = Date.now() - startTime;
      setWpm(calculateWPM(value, timeElapsed));
      setAccuracy(calculateAccuracy(testText, value));
    }

    if (value.length >= testText.length) {
      endTest(value);
    }
  };

  const resetTest = () => {
    setTestState("ready");
    setTestText("");
    setUserInput("");
    setTimeLeft(TEST_DURATION);
    setCountdownLeft(COUNTDOWN_DURATION);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
  };

  const getPerformanceRating = (value: number) => {
    if (value >= 60) return { text: language === "lv" ? "Izcili" : "Excellent", color: "text-cognitive-success" };
    if (value >= 40) return { text: language === "lv" ? "Labi" : "Good", color: "text-cognitive-accent" };
    if (value >= 25) return { text: language === "lv" ? "Vidji" : "Average", color: "text-cognitive-warning" };
    return { text: language === "lv" ? "Nepiecieama Prakse" : "Needs Practice", color: "text-destructive" };
  };

  const getAverageWPM = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + attempt.wpm, 0) / attempts.length);
  };

  const getBestWPM = () => {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map((a) => a.wpm));
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (testState === "countdown") {
      interval = setInterval(() => {
        setCountdownLeft((prev) => {
          if (prev <= 1) {
            setTestState("active");
            setStartTime(Date.now());
            setTimeLeft(TEST_DURATION);
            setTimeout(() => textareaRef.current?.focus(), 100);
            return COUNTDOWN_DURATION;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (testState === "active") {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endTestRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testState]);

  const renderTextWithHighlight = () => {
    const words = testText.split(" ");
    const typedWords = userInput.split(" ");

    const getWordClass = (index: number): string => {
      const base = "px-1 py-0.5 rounded select-none";
      const isTyped = index < typedWords.length - 1;
      const isCurrent = index === typedWords.length - 1;
      const isCorrect = typedWords[index] === words[index];

      if (isTyped || (isCurrent && testState === "complete")) {
        return base + (isCorrect ? " bg-cognitive-success/20 text-cognitive-success" : " bg-destructive/20 text-destructive");
      }
      if (isCurrent) return base + " bg-cognitive-accent/20 text-cognitive-accent";
      return base + " text-muted-foreground";
    };

    return words
      .map((word, index) => <span key={index} className={getWordClass(index)}>{word}</span>)
      .reduce((acc, word, index) => {
        if (index === 0) return [word];
        return [...acc, " ", word];
      }, [] as React.ReactNode[]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="secondary" size="sm" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Button>
          <div className="flex items-center gap-2">
            <Keyboard className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>

        <Card className="mb-6 bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Timer className="w-4 h-4 text-cognitive-warning" />
                  <div className="text-2xl font-bold text-cognitive-warning">{timeLeft}s</div>
                </div>
                <div className="text-sm text-muted-foreground">{t.time}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-primary">{wpm}</div>
                <div className="text-sm text-muted-foreground">{t.wpmShort}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-success">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">{t.accuracy}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-accent">
                  {testText.length > 0 ? Math.round((userInput.length / testText.length) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">{t.progress}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle>
              {testState === "ready" && t.ready}
              {testState === "active" && t.active}
              {testState === "complete" && `${wpm} ${t.wpmShort} - ${getPerformanceRating(wpm).text}`}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && t.readyDesc}
              {testState === "active" && t.activeDesc}
              {testState === "complete" && `${t.finalAccuracy}: ${accuracy}%`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testState === "ready" && (
              <div className="text-center">
                <Button onClick={startTest} className="bg-cognitive-primary hover:bg-cognitive-primary/80" size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  {t.start}
                </Button>
              </div>
            )}

            {(testState === "active" || testState === "complete") && (
              <div className="space-y-6">
                <div
                  className="bg-muted/20 rounded-lg p-6 select-none"
                  onCopy={(e) => e.preventDefault()}
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div className="text-lg leading-relaxed font-mono">{renderTextWithHighlight()}</div>
                </div>

                <div className="space-y-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder={t.placeholder}
                    value={userInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                    onDrop={(e) => e.preventDefault()}
                    disabled={testState === "complete"}
                    className="min-h-32 text-lg font-mono resize-none"
                    spellCheck={false}
                  />
                  <div className="text-sm text-muted-foreground">
                    {t.chars}: {userInput.length} / {testText.length}
                  </div>
                </div>

                {testState === "complete" && (
                  <div className="flex gap-4 justify-center pt-4">
                    <Button onClick={startTest} className="bg-cognitive-primary hover:bg-cognitive-primary/80">
                      <Play className="w-4 h-4 mr-2" />
                      {t.retry}
                    </Button>
                    <Button onClick={resetTest} variant="secondary">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t.reset}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {testState === "countdown" && (
              <div className="text-center py-12">
                <div className="text-6xl font-bold text-cognitive-primary mb-4 animate-pulse">{countdownLeft}</div>
                <p className="text-lg text-muted-foreground">{t.prepare}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {attempts.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>{t.results}</CardTitle>
              <CardDescription>{t.history}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-accent">{attempts.length}</div>
                  <div className="text-sm text-muted-foreground">{t.tests}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-primary">{getAverageWPM()}</div>
                  <div className="text-sm text-muted-foreground">{t.avgWpm}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-success">{getBestWPM()}</div>
                  <div className="text-sm text-muted-foreground">{t.bestWpm}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-warning">
                    {Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)}%
                  </div>
                  <div className="text-sm text-muted-foreground">{t.avgAccuracy}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">{t.latestTests}</h4>
                <div className="space-y-2">
                  {attempts.slice(-5).reverse().map((attempt, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-muted/20">
                      <div className="flex gap-4">
                        <span className={`font-bold ${getPerformanceRating(attempt.wpm).color}`}>
                          {attempt.wpm} WPM
                        </span>
                        <span className="text-muted-foreground">
                          {attempt.accuracy}% {t.accuracyWord}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{attempt.timestamp.toLocaleTimeString()}</span>
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

export default TypingTest;
