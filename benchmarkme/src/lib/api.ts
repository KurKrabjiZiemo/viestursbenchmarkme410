// src/lib/api.ts
// API utilītiju fails - visi HTTP pieprasījumi iet caur šo

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Kļūdas tips
export interface ApiError {
  error: string;
  message?: string;
}

// Galvenā API pieprasījumu funkcija
export const apiRequest = async <T = unknown>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> => {
  // Iegūst JWT tokenu no localStorage
  const token = localStorage.getItem('token');
  
  // Konfigurē pieprasījumu
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  
  // Veic pieprasījumu
  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Parsē atbildi
  const data = await response.json();
  
  // Ja kļūda, izmet to
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Kaut kas nogāja greizi');
  }
  
  return data as T;
};

// Saglabāt tokenu
export const setToken = (token: string) => {
  localStorage.setItem('token', token);
};

// Dzēst tokenu
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Iegūt tokenu
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};
