// Importē nepieciešamos React hook-us un komponentus
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, LogOut } from "lucide-react";
// Importē UI komponentus
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Importē autentifikācijas hook un API utilītiju
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";

// Profila datu interfeiss
interface Profile {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

// Profila lapa - rāda lietotāja informāciju
const Profile = () => {
  // Iegūst lietotāju un izrakstīšanās funkciju
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  // Saglabā profila datus un ielādes stāvokli
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Ielādē profila datus, kad komponente tiek ielādēta
  useEffect(() => {
    // Ja lietotājs nav pieteicies, pārvirza uz autentifikācijas lapu
    if (!user) {
      navigate("/auth");
      return;
    }

    // Iegūst profila datus no datubāzes
    const fetchProfile = async () => {
  try {
    const data = await apiRequest<Profile | null>('/profiles');
    setProfile(data);
  } catch (error: unknown) {
    console.error('Error fetching profile:', error);
  } finally {
    setLoading(false);
  }
};

    fetchProfile();
  }, [user, navigate]);

  // Apstrādā izrakstīšanos
  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Ja dati vēl tiek ielādēti, parāda ielādes ziņojumu
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Ielādē...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Atpakaļ uz Paneli
          </Button>
        </div>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-cognitive-primary/10 rounded-full">
                <User className="w-16 h-16 text-cognitive-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Tavs Profils</CardTitle>
            <CardDescription>Pārvaldi savu kontu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">E-pasts</label>
                <p className="text-lg">{user?.email}</p>
              </div>
              
              {profile?.full_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pilns Vārds</label>
                  <p className="text-lg">{profile.full_name}</p>
                </div>
              )}

              {profile?.username && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lietotājvārds</label>
                  <p className="text-lg">{profile.username}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Konts Izveidots</label>
                <p className="text-lg">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Nav pieejams'}
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
                Izrakstīties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
