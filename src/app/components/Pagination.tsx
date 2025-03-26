// Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrev = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  // Regrouper les numéros de pages par blocs de 10
  const pageChunks: number[][] = [];
  for (let i = 0; i < totalPages; i += 10) {
    pageChunks.push(Array.from({ length: Math.min(10, totalPages - i) }, (_, j) => i + j));
  }

  return (
    <div className="flex flex-col items-center justify-center mt-4 space-y-2">
      {/* Ligne avec Bouton Précédent, numéros de pages (groupés) et Bouton Suivant */}
      <div className="flex space-x-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Précédent
        </button>

        {/* Blocs de numéros de pages avec retour à la ligne toutes les 10 pages */}
        <div className="flex flex-col space-y-1">
          {pageChunks.map((chunk, index) => (
            <div key={index} className="flex space-x-1">
              {chunk.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`px-1 py-1 rounded ${
                    page === currentPage
                      ? "bg-blue-600 text-white"
                      : "underline hover:text-blue-500"
                  }`}
                >
                  {page + 1}
                </button>
              ))}
            </div>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Suivant
        </button>
      </div>

      <div className="text-white">
        Page {currentPage + 1} sur {totalPages}
      </div>
    </div>
  );
}
