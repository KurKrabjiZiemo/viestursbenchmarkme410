import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiRequest, setToken, removeToken, getToken } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Lietotāja tips
interface User {
  id: string;
  email: string;
  created_at: string;
}

// Autentifikācijas konteksta tips
interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

// Izveido kontekstu
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider komponente
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
  const signUp = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Saglabā tokenu un lietotāju
      setToken(data.token);
      setUser(data.user);

      toast({
        title: "Veiksmīgi!",
        description: "Konts izveidots veiksmīgi. Tu esi ielogojies.",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Reģistrācijas Kļūda",
        description: err.message,
        variant: "destructive"
      });
      return { error: err };
    }
  };

  // Pieteikšanās funkcija
  const signIn = async (email: string, password: string): Promise<{ error: Error | null }> => {
    try {
      const data = await apiRequest<{ user: User; token: string }>('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Saglabā tokenu un lietotāju
      setToken(data.token);
      setUser(data.user);

      toast({
        title: "Laipni lūdzam atpakaļ!",
        description: "Tu esi veiksmīgi ielogojies.",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Ielogošanās Kļūda",
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
        title: "Izrakstījies",
        description: "Tu esi veiksmīgi izrakstījies.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
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
