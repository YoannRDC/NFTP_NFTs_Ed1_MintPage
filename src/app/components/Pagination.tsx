// Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Génère la liste des éléments à afficher dans la pagination.
  // Si totalPages <= 8, on affiche toutes les pages.
  // Sinon, on affiche :
  // - La première page (index 0)
  // - Des points de suspension si la première partie du bloc est omise
  // - Un bloc de pages autour de la page courante (3 avant et 3 après)
  // - Des points de suspension si la fin du bloc est omise
  // - La dernière page (index totalPages - 1)
  const getPaginationItems = (): (number | string)[] => {
    if (totalPages <= 8) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }
    const items: (number | string)[] = [];
    items.push(0); // première page

    const left = Math.max(1, currentPage - 3);
    const right = Math.min(totalPages - 2, currentPage + 3);

    if (left > 1) {
      items.push("...");
    }
    for (let i = left; i <= right; i++) {
      items.push(i);
    }
    if (right < totalPages - 2) {
      items.push("...");
    }
    items.push(totalPages - 1); // dernière page

    return items;
  };

  const paginationItems = getPaginationItems();

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
      {/* Ligne principale avec Précédent, les pages et Suivant */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handlePrev}
          disabled={currentPage === 0}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Précédent
        </button>

        <div className="flex items-center space-x-1">
          {paginationItems.map((item, index) => {
            if (typeof item === "number") {
              return (
                <button
                  key={index}
                  onClick={() => onPageChange(item)}
                  className={`px-2 py-1 rounded ${
                    item === currentPage ? "bg-blue-600 text-white" : "underline hover:text-blue-500"
                  }`}
                >
                  {item + 1}
                </button>
              );
            } else {
              // Affiche les points de suspension
              return (
                <span key={index} className="px-2 py-1 text-white">
                  {item}
                </span>
              );
            }
          })}
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
