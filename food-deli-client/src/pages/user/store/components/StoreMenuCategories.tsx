import React from 'react';

interface StoreMenuCategoriesProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export const StoreMenuCategories: React.FC<StoreMenuCategoriesProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 scroll-smooth no-scrollbar border-b border-gray-100">
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-100'
            }`}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};

export default StoreMenuCategories;

