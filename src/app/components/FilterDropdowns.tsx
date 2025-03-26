// FilterDropdowns.tsx
"use client";
import React from "react";

interface FilterProps {
  categoryOptions: string[];
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  textureOptions: string[];
  selectedTexture: string;
  onTextureChange: (value: string) => void;
  reveOptions: string[];
  selectedReve: string;
  onReveChange: (value: string) => void;
}

export function FilterDropdowns({
  categoryOptions,
  selectedCategory,
  onCategoryChange,
  textureOptions,
  selectedTexture,
  onTextureChange,
  reveOptions,
  selectedReve,
  onReveChange,
}: FilterProps) {
  return (
    <div className="flex flex-wrap gap-4 mb-4 justify-center">
      <div className="relative">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Categories</option>
          {categoryOptions.map((opt, index) => (
            <option key={index} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          value={selectedTexture}
          onChange={(e) => onTextureChange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Textures</option>
          {textureOptions.map((opt, index) => (
            <option key={index} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <select
          value={selectedReve}
          onChange={(e) => onReveChange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Reve</option>
          {reveOptions.map((opt, index) => (
            <option key={index} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
