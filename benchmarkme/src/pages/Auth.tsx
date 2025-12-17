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

// Autentifikācijas lapa - pieteikšanās un reģistrācija
const Auth = () => {
  // Stāvokļa mainīgie formas laukiem
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Iegūst autentifikācijas funkcijas un lietotāja stāvokli
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Ja lietotājs jau ir pieteicies, pārvirza uz sākumlapu
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Apstrādā pieteikšanās formas iesniegšanu
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  // Apstrādā reģistrācijas formas iesniegšanu
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-cognitive-primary/5">
      <Card className="w-full max-w-md bg-gradient-card border-border/50">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-cognitive-primary/10 rounded-2xl">
              <Brain className="w-12 h-12 text-cognitive-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Kognitīvie Testi</CardTitle>
          <CardDescription>
            Piesakies, lai izsekotu savu kognitīvo sniegumu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Ielogoties</TabsTrigger>
              <TabsTrigger value="signup">Reģistrēties</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">E-pasts</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="tavs@epasts.lv"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Parole</Label>
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
                  {isLoading ? "Ielogošanās..." : "Ielogoties"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-pasts</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tavs@epasts.lv"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Parole</Label>
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
                  {isLoading ? "Izveido kontu..." : "Izveidot Kontu"}
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
