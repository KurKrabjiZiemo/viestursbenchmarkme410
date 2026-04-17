/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: STROOPTEST.TSX - STRŪPA EFEKTA TESTA KOMPONENTE
 * APRAKSTS: STRŪPA EFEKTA TESTS, KUR LIETOTĀJAM JĀNOSAKA KRĀSA,
 *           KURĀ VĀRDS IR UZRAKSTĪTS, NEVIS VĀRDA NOZĪME
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { useMemo, useState } from "react";
import { ArrowLeft, Play, RotateCcw, Palette, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTestResults } from "@/hooks/useTestResults";

interface StroopTestProps {
  onBack: () => void;
  language: "lv" | "en";
}

type TestState = "ready" | "active" | "complete";

type ColorKey = "red" | "blue" | "green" | "yellow";

const TRIALS_COUNT = 20;

const COLORS: Array<{
  key: ColorKey;
  textClass: string;
  buttonClass: string;
}> = [
  {
    key: "red",
    textClass: "text-red-500",
    buttonClass: "bg-red-500 hover:bg-red-600"
  },
  {
    key: "blue",
    textClass: "text-blue-500",
    buttonClass: "bg-blue-500 hover:bg-blue-600"
  },
  {
    key: "green",
    textClass: "text-green-500",
    buttonClass: "bg-green-500 hover:bg-green-600"
  },
  {
    key: "yellow",
    textClass: "text-yellow-500",
    buttonClass: "bg-yellow-500 hover:bg-yellow-600"
  }
];

interface Trial {
  word: ColorKey;
  ink: ColorKey;
  isCongruent: boolean;
}

const buildTrials = () => {
  const trials: Trial[] = [];
  for (let i = 0; i < TRIALS_COUNT; i++) {
    const word = COLORS[Math.floor(Math.random() * COLORS.length)].key;
    const shouldMatch = Math.random() < 0.5;
    let ink = word;
    if (!shouldMatch) {
      const otherColors = COLORS.filter(color => color.key !== word);
      ink = otherColors[Math.floor(Math.random() * otherColors.length)].key;
    }
    trials.push({ word, ink, isCongruent: word === ink });
  }
  return trials;
};

const StroopTest = ({ onBack, language }: StroopTestProps) => {
  const { saveTestResult } = useTestResults();

  const [testState, setTestState] = useState<TestState>("ready");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [lastResult, setLastResult] = useState<"correct" | "incorrect" | null>(null);

  const getColorLabel = (color: ColorKey) => {
    const map = {
      red: language === "lv" ? "Sarkans" : "Red",
      blue: language === "lv" ? "Zils" : "Blue",
      green: language === "lv" ? "Zaļš" : "Green",
      yellow: language === "lv" ? "Dzeltens" : "Yellow",
    };
    return map[color];
  };

  const t = {
    back: language === "lv" ? "Atpakaļ" : "Back",
    title: language === "lv" ? "Stroop Krāsu-Vārdu Tests" : "Stroop Color-Word Test",
    attempt: language === "lv" ? "Mēģinājums" : "Attempt",
    correct: language === "lv" ? "Pareizi" : "Correct",
    incorrect: language === "lv" ? "Nepareizi" : "Incorrect",
    accuracy: language === "lv" ? "Precizitāte" : "Accuracy",
    ready: language === "lv" ? "Gatavs pārbaudīt uzmanību?" : "Ready to test your focus?",
    active: language === "lv" ? "Izvēlies teksta krāsu" : "Choose the text color",
    complete: language === "lv" ? "Tests pabeigts" : "Test complete",
    readyDesc:
      language === "lv"
        ? "Nosauc krāsu, ar kuru uzrakstīts vārds, nevis pašu vārdu"
        : "Name the color of the text, not the word itself",
    activeDesc: language === "lv" ? "Koncentrējies uz krāsu, nevis uz vārdu" : "Focus on the color, not the word",
    start: language === "lv" ? "Sākt Stroop Testu" : "Start Stroop Test",
    matching: language === "lv" ? "saskanīgi" : "matching",
    tryAgain: language === "lv" ? "Mēģināt Vēlreiz" : "Try Again",
    reset: language === "lv" ? "Atiestatīt" : "Reset",
  };

  const currentTrial = trials[currentIndex];

  const startTest = () => {
    const newTrials = buildTrials();
    setTrials(newTrials);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setLastResult(null);
    setTestState("active");
  };

  const resetTest = () => {
    setTestState("ready");
    setTrials([]);
    setCurrentIndex(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setLastResult(null);
  };

  const handleAnswer = (selected: ColorKey) => {
    if (testState !== "active" || !currentTrial) return;

    const isCorrect = selected === currentTrial.ink;
    setLastResult(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }

    if (currentIndex + 1 >= trials.length) {
      const totalTrials = trials.length;
      const accuracy = totalTrials > 0 ? Math.round(((isCorrect ? correctCount + 1 : correctCount) / totalTrials) * 100) : 0;

      saveTestResult("stroop", isCorrect ? correctCount + 1 : correctCount, {
        accuracy,
        totalTrials,
        correct: isCorrect ? correctCount + 1 : correctCount,
        incorrect: isCorrect ? incorrectCount : incorrectCount + 1
      });

      setTestState("complete");
      return;
    }

    setCurrentIndex(prev => prev + 1);
  };

  const accuracy = useMemo(() => {
    const total = correctCount + incorrectCount;
    if (total === 0) return 0;
    return Math.round((correctCount / total) * 100);
  }, [correctCount, incorrectCount]);

  const congruentCount = useMemo(() => trials.filter(trial => trial.isCongruent).length, [trials]);

  const inkColor = currentTrial ? COLORS.find(color => color.key === currentTrial.ink) : null;
  const wordLabel = currentTrial ? getColorLabel(currentTrial.word) : "";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
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
            <Palette className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">{t.title}</h1>
          </div>
        </div>

        <Card className="mb-6 bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-primary">
                  {testState === "active" ? currentIndex + 1 : trials.length}
                </div>
                <div className="text-sm text-muted-foreground">{t.attempt}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-success">{correctCount}</div>
                <div className="text-sm text-muted-foreground">{t.correct}</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-warning">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">{t.accuracy}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle>
              {testState === "ready" && t.ready}
              {testState === "active" && t.active}
              {testState === "complete" && t.complete}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && t.readyDesc}
              {testState === "active" && t.activeDesc}
              {testState === "complete" && `${t.accuracy}: ${accuracy}%`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testState === "ready" && (
              <div className="text-center py-12">
                <Button
                  onClick={startTest}
                  className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {t.start}
                </Button>
                <p className="text-sm text-muted-foreground mt-4">
                  {TRIALS_COUNT} {language === "lv" ? "mēģinājumi" : "attempts"}, {congruentCount || 0} {t.matching}
                </p>
              </div>
            )}

            {testState === "active" && currentTrial && (
              <div className="space-y-6">
                <div className="bg-muted/20 rounded-lg p-8 text-center">
                  <div className={`text-5xl md:text-6xl font-bold tracking-wide ${inkColor?.textClass || ""}`}>
                    {wordLabel}
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    {currentIndex + 1} / {trials.length}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COLORS.map(color => (
                    <Button
                      key={color.key}
                      onClick={() => handleAnswer(color.key)}
                      className={`${color.buttonClass} text-foreground font-semibold`}
                    >
                      {getColorLabel(color.key)}
                    </Button>
                  ))}
                </div>

                {lastResult && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {lastResult === "correct" ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-cognitive-success" />
                        <span className="text-cognitive-success">{t.correct}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-destructive" />
                        <span className="text-destructive">{t.incorrect}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {testState === "complete" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-cognitive-success">{correctCount}</div>
                    <div className="text-sm text-muted-foreground">{t.correct}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-destructive">{incorrectCount}</div>
                    <div className="text-sm text-muted-foreground">{t.incorrect}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-cognitive-warning">{accuracy}%</div>
                    <div className="text-sm text-muted-foreground">{t.accuracy}</div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={startTest}
                    className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t.tryAgain}
                  </Button>
                  <Button onClick={resetTest} variant="secondary">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t.reset}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StroopTest;
