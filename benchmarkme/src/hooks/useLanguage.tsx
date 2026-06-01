/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: USELANGUAGE.TSX - VALODAS KONTEKSTA HOOK
 * APRAKSTS: GLOBĀLĀS LIETOTNES VALODAS PĀRVALDĪBA,
 *           IETVER PERSISTENCI LOCALSTORAGE UN ĒRTU PĀRSLĒGŠANU
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "lv" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

const STORAGE_KEY = "appLanguage";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getInitialLanguage = (): Language => {
  // Pēc noklusējuma izmanto latviešu valodu, ja saglabāta vērtība nav atrasta.
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" ? "en" : "lv";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    // Uztur izvēlēto valodu starp lapas pārlādēm.
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage: (nextLanguage: Language) => setLanguageState(nextLanguage),
      toggleLanguage: () => setLanguageState((prev) => (prev === "lv" ? "en" : "lv")),
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
