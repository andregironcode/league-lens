
import { useState } from 'react';

interface CategoryTabsProps {
  onSelectCategory: (category: string) => void;
}

const CategoryTabs = ({ onSelectCategory }: CategoryTabsProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'highlights', label: 'Highlights' },
    { id: 'live', label: 'Live' }
  ];
  
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onSelectCategory(categoryId);
  };
  
  return (
    <div className="flex justify-center mb-8">
      <div className="flex space-x-8 border-b border-gray-800">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleSelectCategory(category.id)}
            className={`px-4 py-2 text-lg font-medium relative ${
              selectedCategory === category.id
                ? 'text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {category.label}
            {selectedCategory === category.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-yellow-500"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryTabs;
