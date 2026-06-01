/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: USE-MOBILE.TSX - MOBILĀ EKRĀNA NOTEIKŠANAS HOOK
 * APRAKSTS: REAKTĪVI NOSAKA, VAI EKRĀNS IR MAZĀKS PAR DEFINĒTO
 *           BREAKPOINT UN ATJAUNINA VĒRTĪBU PIE IZMĒRA MAIŅAS
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // Izmanto matchMedia, lai izmaiņas klausītos efektīvi un bez polling.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
