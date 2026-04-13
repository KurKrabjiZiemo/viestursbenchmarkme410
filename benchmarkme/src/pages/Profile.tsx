/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: PROFILE.TSX - LIETOTĀJA PROFILA LAPAS KOMPONENTE
 * APRAKSTS: LIETOTĀJA PROFILA INFORMĀCIJAS APSKATE UN REDIĢĒŠANA,
 *           IETVER LIETOTĀJVĀRDA MAIŅU UN KONTA PĀRVALDĪBU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
// Importē nepieciešamos React hook-us un komponentus
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, User, LogOut } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē autentifikācijas hook un API utilītiju
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";

// Profila datu interfeiss
interface Profile {
  id: number;
  email: string;
  username: string | null;
  created_at: string;
  updated_at: string;
}

// Profila lapa - rāda lietotāja informāciju
const Profile = () => {
  // Iegūst lietotāju un izrakstīšanās funkciju
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { language } = useLanguage();
  // Saglabā profila datus un ielādes stāvokli
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const t = {
    loading: language === "lv" ? "Ielādē..." : "Loading...",
    backToDashboard: language === "lv" ? "Atpakaļ uz Paneli" : "Back to Dashboard",
    home: language === "lv" ? "Sākumlapa" : "Home",
    profileTitle: language === "lv" ? "Tavs Profils" : "Your Profile",
    profileSubtitle: language === "lv" ? "Pārvaldi savu kontu" : "Manage your account",
    email: language === "lv" ? "E-pasts" : "Email",
    username: language === "lv" ? "Lietotājvārds" : "Username",
    notSet: language === "lv" ? "Nav iestatīts" : "Not set",
    accountCreated: language === "lv" ? "Konts Izveidots" : "Account Created",
    notAvailable: language === "lv" ? "Nav pieejams" : "Not available",
    signOut: language === "lv" ? "Izrakstīties" : "Sign Out",
  };

  // Ielādē profila datus, kad komponente tiek ielādēta
  useEffect(() => {
    // Gaida, līdz autentifikācija ir pārbaudīta
    if (authLoading) {
      return;
    }
    // Ja lietotājs nav pieteicies, pārvirza uz autentifikācijas lapu
    if (!user) {
      navigate("/auth");
      return;
    }

    // Iegūst profila datus no datubāzes
    const fetchProfile = async () => {
      try {
        const data = await apiRequest<{ profile: Profile }>('/profiles');
        setProfile(data.profile);
      } catch (error: unknown) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading, user, navigate]);

  // Apstrādā izrakstīšanos
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Ja dati vēl tiek ielādēti, parāda ielādes ziņojumu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t.loading}</div>
        <div className="fixed right-4 top-4 z-20">
          <LanguageSwitch />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="fixed right-4 top-4 z-20">
        <LanguageSwitch />
      </div>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToDashboard}
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            {t.home}
          </Button>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-cognitive-primary/10 rounded-full">
                <User className="w-16 h-16 text-cognitive-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">{t.profileTitle}</CardTitle>
            <CardDescription>{t.profileSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.email}</label>
                <p className="text-lg">{user?.email}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.username}</label>
                <p className="text-lg">{profile?.username || user?.username || t.notSet}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t.accountCreated}</label>
                <p className="text-lg">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t.notAvailable}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <Button 
                onClick={handleSignOut}
                variant="destructive"
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.signOut}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
