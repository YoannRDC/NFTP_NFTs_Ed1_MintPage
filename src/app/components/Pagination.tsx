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

  return (
    <div className="flex flex-col items-center justify-center mt-4 space-y-2">
      {/* Ligne principale avec Précédent / numéros de pages / Suivant */}
      <div className="flex space-x-4">
        {/* Bouton Précédent */}
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Précédent
        </button>

        {/* Liens numérotés pour chaque page */}
        <div className="flex space-x-1">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i)}
              className={`px-2 py-1 rounded ${
                i === currentPage
                  ? "bg-blue-600 text-white" // Page courante
                  : "underline hover:text-blue-500" // Autres pages soulignées
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Bouton Suivant */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages - 1}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Suivant
        </button>
      </div>

      {/* Affichage texte : Page X sur Y */}
      <div className="text-white">
        Page {currentPage + 1} sur {totalPages}
      </div>
    </div>
  );
}
