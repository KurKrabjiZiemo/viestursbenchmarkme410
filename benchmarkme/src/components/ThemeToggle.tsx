/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: THEMETOGGLE.TSX - TĒMAS PĀRSLĒGŠANAS KOMPONENTE
 * APRAKSTS: GAIŠĀS/TUMŠĀS TĒMAS PĀRSLĒGŠANAS POGA,
 *           KAS BALSTĀS UZ GLOBĀLO TĒMAS KONTEKSTU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  className?: string;
}

const ThemeToggle = ({ className = "" }: ThemeToggleProps) => {
  // Nodrošina pieeju aktīvajai tēmai un pārslēgšanas loģikai.
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className={`gap-2 ${className}`.trim()}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
};

export default ThemeToggle;
