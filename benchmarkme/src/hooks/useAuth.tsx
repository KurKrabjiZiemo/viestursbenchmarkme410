/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: USEAUTH.TSX - AUTENTIFIKĀCIJAS HOOK KOMPONENTE
 * APRAKSTS: REACT KONTEKSTS UN HOOK LIETOTĀJA AUTENTIFIKĀCIJAI,
 *           IETVER PIETEIKŠANOS, REĢISTRĀCIJU UN SESIJAS PĀRVALDĪBU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest, setToken, removeToken, getToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

// Lietotāja tips
interface User {
  id: number;
  email: string;
  username: string | null;
  profile_picture: string | null;
  created_at: string;
}

// Autentifikācijas konteksta tips
interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateUser: (nextUser: User) => void;
  loading: boolean;
}

// Izveido kontekstu
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider komponente
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { language } = useLanguage();

  // Pārbauda sesiju pie ielādes
  useEffect(() => {
    const checkSession = async () => {
      const token = getToken();
      
      // Ja nav tokena, nav sesijas
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Pārbauda sesiju ar backend
        const data = await apiRequest<{ user: User }>('/auth/session');
        setUser(data.user);
      } catch (error) {
        // Ja tokens nederīgs, dzēš to
        console.error('Sesijas pārbaudes kļūda:', error);
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Reģistrācijas funkcija
  const signUp = async (email: string, password: string, username: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, username }),
      });

      // Saglabā tokenu un lietotāju
      setToken(data.token);
      setUser(data.user);

      toast({
        title: language === "lv" ? "Veiksmīgi!" : "Success!",
        description:
          language === "lv"
            ? "Konts izveidots veiksmīgi. Tu esi ielogojies."
            : "Account created successfully. You are now signed in.",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: language === "lv" ? "Reģistrācijas Kļūda" : "Sign up error",
        description: err.message,
        variant: "destructive"
      });
      return { error: err };
    }
  };

  // Pieteikšanās funkcija
  const signIn = async (identifier: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      });

      // Saglabā tokenu un lietotāju
      setToken(data.token);
      setUser(data.user);

      toast({
        title: language === "lv" ? "Laipni lūdzam atpakaļ!" : "Welcome back!",
        description: language === "lv" ? "Tu esi veiksmīgi ielogojies." : "You have signed in successfully.",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: language === "lv" ? "Ielogošanās Kļūda" : "Sign in error",
        description: err.message,
        variant: "destructive"
      });
      return { error: err };
    }
  };

  // Izrakstīšanās funkcija
  const signOut = async (): Promise<void> => {
    try {
      // Mēģina izrakstīties backend
      await apiRequest('/auth/signout', { method: 'POST' });
    } catch (error) {
      // Pat ja backend kļūda, turpinām izrakstīšanos
      console.error('Izrakstīšanās kļūda:', error);
    } finally {
      // Vienmēr dzēš lokālos datus
      removeToken();
      setUser(null);
      
      toast({
        title: language === "lv" ? "Izrakstījies" : "Signed out",
        description: language === "lv" ? "Tu esi veiksmīgi izrakstījies." : "You have signed out successfully.",
      });
    }
  };

  const updateUser = (nextUser: User) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
