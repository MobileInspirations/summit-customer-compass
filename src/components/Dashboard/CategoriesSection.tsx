
import { Badge } from "@/components/ui/badge";
import { CategoryCard } from "@/components/CategoryCard";

interface Category {
  id: string;
  name: string;
  count: number;
}

interface CategoriesSectionProps {
  title: string;
  categories: Category[];
  selectedCategories: string[];
  onCategorySelect: (categoryId: string) => void;
}

export const CategoriesSection = ({ 
  title, 
  categories, 
  selectedCategories, 
  onCategorySelect 
}: CategoriesSectionProps) => {
  const selectedCount = categories.filter(cat => selectedCategories.includes(cat.id)).length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Badge variant="outline" className="text-sm">
          {selectedCount} of {categories.length} selected
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isSelected={selectedCategories.includes(category.id)}
            onSelect={() => onCategorySelect(category.id)}
          />
        ))}
      </div>
    </div>
  );
};
