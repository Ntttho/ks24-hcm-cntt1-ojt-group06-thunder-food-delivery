import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';

interface RestaurantMenuCategoriesProps {
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export const RestaurantMenuCategories: React.FC<RestaurantMenuCategoriesProps> = ({
  categories,
  activeCategory,
  onSelectCategory,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [categories, checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -220 : 220;
    el.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <div className="relative group/categories border-b border-gray-100 py-1">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => handleScroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-300 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Cuộn sang trái"
        >
          <LeftOutlined className="text-xs" />
        </button>
      )}

      {/* Categories Scroll Rail */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 overflow-x-auto py-2 px-1 scroll-smooth thin-scrollbar"
      >
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80 hover:border-orange-200'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => handleScroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/95 shadow-md border border-gray-200 text-gray-700 hover:text-orange-600 hover:border-orange-300 flex items-center justify-center transition-all cursor-pointer"
          aria-label="Cuộn sang phải"
        >
          <RightOutlined className="text-xs" />
        </button>
      )}
    </div>
  );
};

export default RestaurantMenuCategories;
