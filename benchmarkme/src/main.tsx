/**
 * AUTORS: VIESTURS IVANCOVS
 * DATNE: MAIN.TSX - BENCHMARKME APLIKĀCIJAS IEEJAS PUNKTS
 * APRAKSTS: REACT APLIKĀCIJAS INICIALIZĀCIJA UN RENDERĒŠANA DOM ELEMENTĀ
 * VERSIJA: 2026. GADA MARTA VERSIJA
 */
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
