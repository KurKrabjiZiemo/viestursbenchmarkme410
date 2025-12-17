import { apiRequest } from '@/lib/api';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Definē metadata tipu
interface TestMetadata {
  attempts?: number[];
  average_time?: number;
  level?: number;
  accuracy?: number;
  wpm?: number;
  correct_chars?: number;
  total_chars?: number;
  hits?: number;
  misses?: number;
  average_hit_time?: number;
  [key: string]: string | number | boolean | number[] | undefined;
}

// Definē API kļūdas tipu
interface ApiError {
  message?: string;
}

// Testa tipu un endpoint saraksts
const TEST_ENDPOINTS: Record<string, string> = {
  'reaction': '/test-results/reaction',
  'memory': '/test-results/memory',
  'number_memory': '/test-results/number-memory',
  'typing': '/test-results/typing',
  'aim': '/test-results/aim'
};

// Custom hook testa rezultātu saglabāšanai datubāzē
export const useTestResults = () => {
  // Iegūst pašreizējo lietotāju
  const { user } = useAuth();
  // Iegūst toast funkciju paziņojumiem
  const { toast } = useToast();

  // Funkcija testa rezultāta saglabāšanai
  const saveTestResult = async (
    testType: string,
    score: number,
    metadata?: TestMetadata
  ) => {
    // Ja lietotājs nav pieteicies, neglabā rezultātu
    if (!user) {
      console.log('No user logged in, skipping test result save');
      return;
    }

    // Atrod pareizo endpoint priekš testa tipa
    const endpoint = TEST_ENDPOINTS[testType];
    if (!endpoint) {
      console.error(`Unknown test type: ${testType}`);
      return;
    }

    try {
      // Mēģina saglabāt rezultātu datubāzē
      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          score,
          metadata
        })
      });

      console.log('Test result saved successfully');
    } catch (error: unknown) {
      // Ja saglabāšana neizdevās, parāda kļūdas paziņojumu
      const apiError = error as ApiError;
      console.error('Error saving test result:', apiError.message || error);
      toast({
        title: "Kļūda saglabājot rezultātu",
        description: "Tavs tests tika pabeigts, bet rezultātu neizdevās saglabāt.",
        variant: "destructive"
      });
    }
  };

  // Atgriež funkciju un lietotāja pieteikšanās statusu
  return { saveTestResult, isLoggedIn: !!user };
};