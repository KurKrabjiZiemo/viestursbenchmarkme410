import { useLocation } from "react-router-dom";
import { useEffect } from "react";

// 404 kļūdas lapa - parādās, kad lietotājs mēģina piekļūt neesošam maršrutam
const NotFound = () => {
  // Iegūst pašreizējo atrašanās vietu (URL)
  const location = useLocation();

  // Reģistrē kļūdu konsolē, kad lietotājs nonāk uz neesošu lapu
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Atgriež 404 kļūdas lapu ar ziņojumu un saiti uz sākumu
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        {/* 404 kļūdas numurs */}
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        {/* Kļūdas ziņojums */}
        <p className="mb-4 text-xl text-gray-600">Ups! Lapa nav atrasta</p>
        {/* Saite atpakaļ uz sākumlapu */}
        <a href="/" className="text-blue-500 underline hover:text-blue-700">
          Atgriezties uz Sākumu
        </a>
      </div>
    </div>
  );
};

export default NotFound;
