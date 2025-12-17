// Importē UI komponentus paziņojumiem un tooltipiem
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
// Importē React Query datu pārvaldībai
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// Importē React Router navigācijai
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Importē autentifikācijas kontekstu
import { AuthProvider } from "@/hooks/useAuth";
// Importē visas lapas
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

// Izveido React Query klientu datu kešošanai un sinhronizācijai
const queryClient = new QueryClient();

// Galvenā aplikācijas komponente
const App = () => (
  // Nodrošina React Query funkcionalitāti visā aplikācijā
  <QueryClientProvider client={queryClient}>
    {/* Nodrošina tooltip funkcionalitāti */}
    <TooltipProvider>
      {/* Paziņojumu komponentes */}
      <Toaster />
      <Sonner />
      {/* Uzstāda maršrutēšanu */}
      <BrowserRouter>
        {/* Nodrošina autentifikācijas kontekstu visā aplikācijā */}
        <AuthProvider>
          {/* Definē visus maršrutus */}
          <Routes>
            <Route path="/" element={<Index />} /> {/* Sākumlapa */}
            <Route path="/auth" element={<Auth />} /> {/* Autentifikācijas lapa */}
            <Route path="/profile" element={<Profile />} /> {/* Profila lapa */}
            <Route path="/dashboard" element={<Dashboard />} /> {/* Pārskatu panelis */}
            <Route path="*" element={<NotFound />} /> {/* 404 lapa */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
