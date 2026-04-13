/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: AUTH.TSX - AUTENTIFIKĀCIJAS LAPAS KOMPONENTE
 * APRAKSTS: LIETOTĀJA PIETEIKŠANĀS UN REĢISTRĀCIJAS SASKARNE,
 *           IETVER FORMU VALIDĀCIJU UN AUTENTIFIKĀCIJAS LOĢIKU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us un komponentus
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Importē autentifikācijas hook
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";

// Autentifikācijas lapa - pieteikšanās un reģistrācija
const Auth = () => {
  // Stāvokļa mainīgie formas laukiem
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Iegūst autentifikācijas funkcijas un lietotāja stāvokli
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = {
    missingDataTitle: language === "lv" ? "Trūkst dati" : "Missing data",
    missingDataDescription:
      language === "lv" ? "Ievadi e-pastu vai lietotājvārdu" : "Enter your email or username",
    invalidEmailTitle: language === "lv" ? "Nederīgs E-pasts" : "Invalid email",
    invalidEmailDescription:
      language === "lv"
        ? "Lūdzu ievadiet derīgu e-pasta adresi (piemēram, tavs@epasts.lv)"
        : "Please enter a valid email address (for example, you@example.com)",
    invalidUsernameTitle: language === "lv" ? "Nederīgs Lietotājvārds" : "Invalid username",
    invalidUsernameDescription:
      language === "lv"
        ? "Lietotājvārdam jābūt no 3 līdz 50 rakstzīmēm"
        : "Username must be between 3 and 50 characters",
    title: language === "lv" ? "Kognitīvie Testi" : "Cognitive Tests",
    subtitle:
      language === "lv"
        ? "Piesakies, lai izsekotu savu kognitīvo sniegumu"
        : "Sign in to track your cognitive performance",
    signIn: language === "lv" ? "Ielogoties" : "Sign In",
    signUp: language === "lv" ? "Reģistrēties" : "Sign Up",
    emailOrUsername: language === "lv" ? "E-pasts vai lietotājvārds" : "Email or username",
    emailOrUsernamePlaceholder:
      language === "lv" ? "tavs@epasts.lv vai mans_lietotajs" : "you@example.com or my_username",
    password: language === "lv" ? "Parole" : "Password",
    username: language === "lv" ? "Lietotājvārds" : "Username",
    usernamePlaceholder: language === "lv" ? "mans_lietotajs" : "my_username",
    email: language === "lv" ? "E-pasts" : "Email",
    emailPlaceholder: language === "lv" ? "tavs@epasts.lv" : "you@example.com",
    signingIn: language === "lv" ? "Ielogošanās..." : "Signing in...",
    creatingAccount: language === "lv" ? "Izveido kontu..." : "Creating account...",
    createAccount: language === "lv" ? "Izveidot Kontu" : "Create Account",
  };

  // Funkcija, kas pārbauda vai e-pasts ir derīgs
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Ja lietotājs jau ir pieteicies, pārvirza uz sākumlapu
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Apstrādā pieteikšanās formas iesniegšanu
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedIdentifier = signInIdentifier.trim();
    if (!trimmedIdentifier) {
      toast({
        title: t.missingDataTitle,
        description: t.missingDataDescription,
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    await signIn(trimmedIdentifier, password);
    setIsLoading(false);
  };

  // Apstrādā reģistrācijas formas iesniegšanu
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pārbauda vai e-pasts ir derīgs pirms reģistrācijas
    if (!isValidEmail(email)) {
      toast({
        title: t.invalidEmailTitle,
        description: t.invalidEmailDescription,
        variant: "destructive"
      });
      return;
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      toast({
        title: t.invalidUsernameTitle,
        description: t.invalidUsernameDescription,
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    await signUp(email, password, trimmedUsername);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-cognitive-primary/5">
      <div className="fixed right-4 top-4 z-20">
        <LanguageSwitch />
      </div>
      <Card className="w-full max-w-md bg-gradient-card border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-cognitive-primary/10 rounded-2xl">
              <Brain className="w-12 h-12 text-cognitive-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">{t.title}</CardTitle>
          <CardDescription>
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
              <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-identifier">{t.emailOrUsername}</Label>
                  <Input
                    id="signin-identifier"
                    type="text"
                    placeholder={t.emailOrUsernamePlaceholder}
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t.password}</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-cognitive-primary hover:bg-cognitive-primary/80"
                  disabled={isLoading}
                >
                  {isLoading ? t.signingIn : t.signIn}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-username">{t.username}</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder={t.usernamePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    minLength={3}
                    maxLength={50}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t.email}</Label>
                  <Input
                    id="signup-email"
                    type="text"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-cognitive-primary hover:bg-cognitive-primary/80"
                  disabled={isLoading}
                >
                  {isLoading ? t.creatingAccount : t.createAccount}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
