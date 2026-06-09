/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: AUTH.TSX - AUTENTIFIKĀCIJAS LAPAS KOMPONENTE
 * APRAKSTS: LIETOTĀJA PIETEIKŠANĀS UN REĢISTRĀCIJAS SASKARNE,
 *           IETVER FORMU VALIDĀCIJU UN AUTENTIFIKĀCIJAS LOĢIKU
 * VERSIJA: 2026. GADA MAIJA VERSIJA
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";
import ThemeToggle from "@/components/ThemeToggle";

// Autentifikācijas lapa - pieteikšanās un reģistrācija
const Auth = () => {
  // Stāvokļa mainīgie formas laukiem
  const [signInIdentifier, setSignInIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInErrorAttempts, setSignInErrorAttempts] = useState(0);
  const [signUpError, setSignUpError] = useState("");
  const [signUpErrorAttempts, setSignUpErrorAttempts] = useState(0);
  const [signUpPasswordError, setSignUpPasswordError] = useState("");
  const [signUpPasswordErrorAttempts, setSignUpPasswordErrorAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  // Iegūst autentifikācijas funkcijas un lietotāja stāvokli
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();

  const isStrongPassword = (value: string): boolean => /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/.test(value);

  const t = {
    missingDataDescription:
      language === "lv" ? "Ievadi e-pastu vai lietotājvārdu" : "Enter your email or username",
    invalidEmailDescription:
      language === "lv"
        ? "Lūdzu ievadiet derīgu e-pasta adresi (piemēram, tavs@epasts.lv)"
        : "Please enter a valid email address (for example, you@example.com)",
    invalidUsernameDescription:
      language === "lv"
        ? "Lietotājvārdam jābūt no 3 līdz 50 rakstzīmēm"
        : "Username must be between 3 and 50 characters",
    invalidPasswordDescription:
      language === "lv"
        ? "Parolei jābūt vismaz 8 rakstzīmēm, vienam ciparam un vienam simbolam"
        : "Password must be at least 8 characters and contain at least one number and one symbol",
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

  const signInHasInlineError = activeTab === "signin" && Boolean(signInError);
  const signUpHasInlineError = activeTab === "signup" && (Boolean(signUpPasswordError) || Boolean(signUpError));

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
      setSignInError(t.missingDataDescription);
      setSignInErrorAttempts((current) => current + 1);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(trimmedIdentifier, password);
    if (error) {
      setSignInError(error.message);
      setSignInErrorAttempts((current) => current + 1);
    } else {
      setSignInError("");
      setSignInErrorAttempts(0);
    }
    setIsLoading(false);
  };

  // Apstrādā reģistrācijas formas iesniegšanu
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Pārbauda vai e-pasts ir derīgs pirms reģistrācijas
    if (!isValidEmail(email)) {
      setSignUpError(t.invalidEmailDescription);
      setSignUpErrorAttempts((current) => current + 1);
      return;
    }

    if (!isStrongPassword(password)) {
      setSignUpError("");
      setSignUpErrorAttempts(0);
      setSignUpPasswordError(t.invalidPasswordDescription);
      setSignUpPasswordErrorAttempts((current) => current + 1);
      return;
    }

    setSignUpPasswordError("");
    setSignUpPasswordErrorAttempts(0);

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      setSignUpError(t.invalidUsernameDescription);
      setSignUpErrorAttempts((current) => current + 1);
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(email, password, trimmedUsername);
    if (error) {
      setSignUpError(error.message);
      setSignUpErrorAttempts((current) => current + 1);
    } else {
      setSignUpError("");
      setSignUpErrorAttempts(0);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-cognitive-primary/5">
      <div className="fixed right-4 top-4 z-20 flex gap-2 animate-fade-in-up" style={{ animationDelay: "0ms" }}>
        <ThemeToggle />
        <LanguageSwitch />
      </div>
      <Card className="w-full max-w-md bg-gradient-card border-border/50 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <div className="p-3 bg-cognitive-primary/10 rounded-2xl">
              <Brain className="w-12 h-12 text-cognitive-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">{t.title}</CardTitle>
          <CardDescription>
            {t.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[430px]">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "signin" | "signup")} className="w-full">
            <TabsList className="relative grid w-full grid-cols-2 mb-6 overflow-hidden">
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-1 left-1 z-0 w-[calc(50%-0.25rem)] rounded-sm bg-background shadow-lg transition-transform duration-500 ease-in-out ${
                  activeTab === "signin" ? "translate-x-0" : "translate-x-full"
                }`}
              />
              <TabsTrigger
                value="signin"
                className={`relative z-10 bg-transparent shadow-none transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
                  activeTab === "signin" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t.signIn}
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className={`relative z-10 bg-transparent shadow-none transition-colors duration-200 data-[state=active]:bg-transparent data-[state=active]:shadow-none ${
                  activeTab === "signup" ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {t.signUp}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div
            className={`relative mt-2 transition-[height] duration-200 ${signUpHasInlineError ? "h-[372px]" : signInHasInlineError ? "h-[372px]" : "h-[320px]"}`}
          >
            <form
              onSubmit={handleSignIn}
              noValidate
              className={`absolute inset-0 space-y-4 transition-opacity duration-300 ${
                activeTab === "signin"
                  ? "opacity-100 visible pointer-events-auto"
                  : "opacity-0 invisible pointer-events-none"
              }`}
            >
                <div className="space-y-2">
                  <Label htmlFor="signin-identifier">{t.emailOrUsername}</Label>
                  <Input
                    id="signin-identifier"
                    type="text"
                    placeholder={t.emailOrUsernamePlaceholder}
                    value={signInIdentifier}
                    onChange={(e) => {
                      setSignInIdentifier(e.target.value);
                      if (signInError) {
                        setSignInError("");
                        setSignInErrorAttempts(0);
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">{t.password}</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);

                        if (signInError) {
                          setSignInError("");
                          setSignInErrorAttempts(0);
                        }
                      }}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signInError && (
                    <p
                      key={`signin-error-${signInErrorAttempts}`}
                      className={`rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive ${signInErrorAttempts > 1 ? "field-error-shake" : "field-error-popup"}`}
                      role="alert"
                    >
                      {signInError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-cognitive-primary hover:bg-cognitive-primary/80"
                  disabled={isLoading}
                >
                  {isLoading ? t.signingIn : t.signIn}
                </Button>
              </form>

              <form
                onSubmit={handleSignUp}
                noValidate
                className={`absolute inset-0 space-y-4 transition-opacity duration-300 ${
                  activeTab === "signup"
                    ? "opacity-100 visible pointer-events-auto"
                    : "opacity-0 invisible pointer-events-none"
                }`}
              >
                <div className="space-y-2">
                  <Label htmlFor="signup-username">{t.username}</Label>
                  <Input
                    id="signup-username"
                    type="text"
                    placeholder={t.usernamePlaceholder}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (signUpError) {
                        setSignUpError("");
                        setSignUpErrorAttempts(0);
                      }
                    }}
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
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (signUpError) {
                        setSignUpError("");
                        setSignUpErrorAttempts(0);
                      }
                    }}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t.password}</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        const nextValue = e.target.value;
                        setPassword(nextValue);

                        if (signUpPasswordError && isStrongPassword(nextValue)) {
                          setSignUpPasswordError("");
                          setSignUpPasswordErrorAttempts(0);
                        }

                        if (signUpError) {
                          setSignUpError("");
                          setSignUpErrorAttempts(0);
                        }
                      }}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {signUpPasswordError && (
                    <p
                      key={`signup-password-error-${signUpPasswordErrorAttempts}`}
                      className={`rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive ${signUpPasswordErrorAttempts > 1 ? "field-error-shake" : "field-error-popup"}`}
                      role="alert"
                    >
                      {signUpPasswordError}
                    </p>
                  )}
                  {signUpError && (
                    <p
                      key={`signup-error-${signUpErrorAttempts}`}
                      className={`rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive ${signUpErrorAttempts > 1 ? "field-error-shake" : "field-error-popup"}`}
                      role="alert"
                    >
                      {signUpError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-cognitive-primary hover:bg-cognitive-primary/80"
                  disabled={isLoading}
                >
                  {isLoading ? t.creatingAccount : t.createAccount}
                </Button>
              </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
