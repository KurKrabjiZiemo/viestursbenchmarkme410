/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: NOTFOUND.TSX - 404 KĻŪDAS LAPAS KOMPONENTE
 * APRAKSTS: KĻŪDAS LAPA, KAS TIEK PARĀDĪTA, KAD LIETOTĀJS MĒĢINA
 *           PIEKĻŪT NEESOŠAM MARŠRUTAM APLIKĀCIJĀ
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import LanguageSwitch from "@/components/LanguageSwitch";

// 404 kļūdas lapa - parādās, kad lietotājs mēģina piekļūt neesošam maršrutam
const NotFound = () => {
  // Iegūst pašreizējo atrašanās vietu (URL)
  const location = useLocation();
  const { language } = useLanguage();

  const t = {
    message: language === "lv" ? "Ups! Lapa nav atrasta" : "Oops! Page not found",
    backHome: language === "lv" ? "Atgriezties uz Sākumu" : "Back to Home",
  };

  // Reģistrē kļūdu konsolē, kad lietotājs nonāk uz neesošu lapu
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Atgriež 404 kļūdas lapu ar ziņojumu un saiti uz sākumu
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="fixed right-4 top-4 z-20">
        <LanguageSwitch />
      </div>
      <div className="text-center">
        {/* 404 kļūdas numurs */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Kļūdas ziņojums */}
        <p className="mb-4 text-xl text-gray-600">{t.message}</p>
        {/* Saite atpakaļ uz sākumlapu */}
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          {t.backHome}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
