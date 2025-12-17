import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Play, RotateCcw, Keyboard, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useTestResults } from "@/hooks/useTestResults";

// Komponentes rekvizīti
interface TypingTestProps {
  onBack: () => void; // Funkcija atgriešanās uz sākumlapu
}

// Testa stāvokļa tipi
type TestState = "ready" | "active" | "complete";

// Testa ilgums sekundēs
const TEST_DURATION = 60;

// Parauga teksti latviskajiem rakstīšanas testiem
const SAMPLE_TEXTS = [
  "Ātrais brūnais lapsas lēca pāri slinkajam sunim. Šis teikums satur visus alfabēta burtus vismaz vienu reizi, padarot to lielisku rakstīšanas praksei.",
  "Caurumā zemē dzīvoja hobits. Ne netīrā, mitrajā, slapjā caurumā, kas piepildīta ar tārpu galiem un dubļainu smaku, ne arī sausā, tukšā, smilšainā caurumā.",
  "Tehnoloģija ir labākā, kad tā apvieno cilvēkus kopā. Nākotne pieder tiem, kas apgūst vairāk prasmju un apvieno tās radošos veidos, lai risinātu problēmas.",
  "Prakse rada progresu, nevis perfektu. Katrs taustiņa sitiens veido muskuļu atmiņu, un katra kļūda ir mācīšanās iespēja uzlabot tavu rakstīšanas ātrumu.",
  "Rakstīšanas māksla ir atklāšanas māksla par to, ko tu tici. Skaidra domāšana kļūst par skaidru rakstīšanu, un skaidra rakstīšana ved uz labāku komunikāciju."
];

// Rakstīšanas ātruma testa komponente
const TypingTest = ({ onBack }: TypingTestProps) => {
  // Iegūst funkciju rezultātu saglabāšanai
  const { saveTestResult } = useTestResults();
  
  // Stāvokļa mainīgie
  const [testState, setTestState] = useState<TestState>("ready");
  const [testText, setTestText] = useState(""); // Teksts, kas jāraksta
  const [userInput, setUserInput] = useState(""); // Lietotāja ievadītais teksts
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION); // Atlikušais laiks
  const [startTime, setStartTime] = useState<number | null>(null); // Testa sākuma laiks
  const [wpm, setWpm] = useState(0); // Vārdi minūtē (Words Per Minute)
  const [accuracy, setAccuracy] = useState(100); // Precizitāte procentos
  const [attempts, setAttempts] = useState<{ wpm: number; accuracy: number; timestamp: Date }[]>([]); // Visi mēģinājumi
  const [currentWordIndex, setCurrentWordIndex] = useState(0); // Pašreizējā vārda indekss
  
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Teksta lauka atsauce

  // Sāk testu ar gadījuma tekstu
  const startTest = () => {
    const randomText = SAMPLE_TEXTS[Math.floor(Math.random() * SAMPLE_TEXTS.length)];
    setTestText(randomText);
    setUserInput("");
    setTimeLeft(TEST_DURATION);
    setStartTime(Date.now());
    setTestState("active");
    setCurrentWordIndex(0);
    
    // Fokusē teksta lauku
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  // Aprēķina rakstīšanas ātrumu
  const calculateWPM = (text: string, timeElapsed: number) => {
    const words = text.trim().split(/\s+/).length;
    const minutes = timeElapsed / 60000; // Pārvērš milisekundēs uz minūtēm
    return Math.round(words / minutes);
  };

  // Aprēķina precizitāti procentos
  const calculateAccuracy = (original: string, typed: string) => {
    if (typed.length === 0) return 100;
    
    let correct = 0;
    const minLength = Math.min(original.length, typed.length);
    
    // Salīdzina katru simbolu
    for (let i = 0; i < minLength; i++) {
      if (original[i] === typed[i]) {
        correct++;
      }
    }
    
    return Math.round((correct / typed.length) * 100);
  };

  const handleInputChange = (value: string) => {
    if (testState !== "active") return;
    
    setUserInput(value);
    
    // Reallaika rezultatus aprekina
    if (startTime) {
      const timeElapsed = Date.now() - startTime;
      const currentWPM = calculateWPM(value, timeElapsed);
      const currentAccuracy = calculateAccuracy(testText, value);
      
      setWpm(currentWPM);
      setAccuracy(currentAccuracy);
      
      // Pasreizeja varda indekss
      const wordsTyped = value.trim().split(/\s+/).length;
      setCurrentWordIndex(Math.min(wordsTyped - 1, testText.split(/\s+/).length - 1));
    }

    // Beigas
    if (value.length >= testText.length) {
      endTest(value);
    }
  };

  const endTest = useCallback((typedText?: string) => {
    const input = typedText ?? userInput;
    if (startTime) {
      const finalWPM = calculateWPM(input, Date.now() - startTime);
      const finalAccuracy = calculateAccuracy(testText, input);
      
      setWpm(finalWPM);
      setAccuracy(finalAccuracy);
      
      setAttempts(prev => [...prev, {
        wpm: finalWPM,
        accuracy: finalAccuracy,
        timestamp: new Date()
      }]);
      
      // Saglabā rezultātu datubāzē
      saveTestResult("typing", finalWPM, {
        wpm: finalWPM,
        accuracy: finalAccuracy
      });
    }
    
    setTestState("complete");
  }, [startTime, userInput, testText, saveTestResult]);

  const resetTest = () => {
    setTestState("ready");
    setTestText("");
    setUserInput("");
    setTimeLeft(TEST_DURATION);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setCurrentWordIndex(0);
  };

  const getPerformanceRating = (wpm: number) => {
    if (wpm >= 60) return { text: "Izcili", color: "text-cognitive-success" };
    if (wpm >= 40) return { text: "Labi", color: "text-cognitive-accent" };
    if (wpm >= 25) return { text: "Vidēji", color: "text-cognitive-warning" };
    return { text: "Nepieciešama Prakse", color: "text-destructive" };
  };

  const getAverageWPM = () => {
    if (attempts.length === 0) return 0;
    return Math.round(attempts.reduce((sum, attempt) => sum + attempt.wpm, 0) / attempts.length);
  };

  const getBestWPM = () => {
    if (attempts.length === 0) return 0;
    return Math.max(...attempts.map(a => a.wpm));
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

  const renderTextWithHighlight = () => {
    const words = testText.split(' ');
    const typedWords = userInput.split(' ');
    
    return words.map((word, index) => {
      let className = "px-1 py-0.5 rounded";
      
      if (index < typedWords.length - 1) {
        className += typedWords[index] === word 
          ? " bg-cognitive-success/20 text-cognitive-success" 
          : " bg-destructive/20 text-destructive";
      } else if (index === typedWords.length - 1) {
        className += " bg-cognitive-accent/20 text-cognitive-accent";
      } else {
        className += " text-muted-foreground";
      }
      
      return (
        <span key={index} className={className}>
          {word}
        </span>
      );
    }).reduce((acc, word, index) => {
      if (index === 0) return [word];
      return [...acc, ' ', word];
    }, [] as React.ReactNode[]);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/*Galv*/}
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
            <Keyboard className="w-6 h-6 text-cognitive-primary" />
            <h1 className="text-3xl font-bold">Rakstīšanas Ātruma Tests</h1>
          </div>
        </div>

        {/*Status*/}
        <Card className="mb-6 bg-gradient-card border-border/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Timer className="w-4 h-4 text-cognitive-warning" />
                  <div className="text-2xl font-bold text-cognitive-warning">{timeLeft}s</div>
                </div>
                <div className="text-sm text-muted-foreground">Atlicis Laiks</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-primary">{wpm}</div>
                <div className="text-sm text-muted-foreground">VPM</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-success">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Precizitāte</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-cognitive-accent">
                  {Math.round((userInput.length / testText.length) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/*Galvena testa dala*/}
        <Card className="mb-8 bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle>
              {testState === "ready" && "Gatavs rakstīt?"}
              {testState === "active" && "Ieraksti tekstu zemāk"}
              {testState === "complete" && `${wpm} VPM - ${getPerformanceRating(wpm).text}`}
            </CardTitle>
            <CardDescription>
              {testState === "ready" && "Pārbaudi savu rakstīšanas ātrumu un precizitāti 60 sekundes"}
              {testState === "active" && "Raksti, cik precīzi un ātri vari"}
              {testState === "complete" && `Galīgā precizitāte: ${accuracy}%`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testState === "ready" && (
              <div className="text-center">
                <Button 
                  onClick={startTest} 
                  className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Sākt Rakstīšanas Testu
                </Button>
              </div>
            )}

            {(testState === "active" || testState === "complete") && (
              <div className="space-y-6">
                {/*Rakstit*/}
                <div className="bg-muted/20 rounded-lg p-6">
                  <div className="text-lg leading-relaxed font-mono">
                    {renderTextWithHighlight()}
                  </div>
                </div>

                {/*Rakstisanas vieta*/}
                <div className="space-y-2">
                  <Textarea
                    ref={textareaRef}
                    placeholder="Sāc rakstīt šeit..."
                    value={userInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={testState === "complete"}
                    className="min-h-32 text-lg font-mono resize-none"
                    spellCheck={false}
                  />
                  <div className="text-sm text-muted-foreground">
                    Rakstzīmes: {userInput.length} / {testText.length}
                  </div>
                </div>

                {testState === "complete" && (
                  <div className="flex gap-4 justify-center pt-4">
                    <Button 
                      onClick={startTest} 
                      className="bg-cognitive-primary hover:bg-cognitive-primary/80"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Mēģināt Vēlreiz
                    </Button>
                    <Button onClick={resetTest} variant="secondary">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Atiestatīt
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/*Rezultati*/}
        {attempts.length > 0 && (
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Tavi Rezultāti</CardTitle>
              <CardDescription>Rakstīšanas snieguma vēsture</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mb-6">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-accent">{attempts.length}</div>
                  <div className="text-sm text-muted-foreground">Testi</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-primary">{getAverageWPM()}</div>
                  <div className="text-sm text-muted-foreground">Vid. VPM</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-success">{getBestWPM()}</div>
                  <div className="text-sm text-muted-foreground">Labākais VPM</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-cognitive-warning">
                    {Math.round(attempts.reduce((sum, a) => sum + a.accuracy, 0) / attempts.length)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Vid. Precizitāte</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Jaunākie Testi:</h4>
                <div className="space-y-2">
                  {attempts.slice(-5).reverse().map((attempt, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/20"
                    >
                      <div className="flex gap-4">
                        <span className={`font-bold ${getPerformanceRating(attempt.wpm).color}`}>
                          {attempt.wpm} VPM
                        </span>
                        <span className="text-muted-foreground">
                          {attempt.accuracy}% precizitāte
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {attempt.timestamp.toLocaleTimeString()}
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

export default TypingTest;