
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  id: number;
  name: string;
  count: number;
  description: string;
  color: string;
}

interface CategoryCardProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
}

export const CategoryCard = ({ category, isSelected, onSelect }: CategoryCardProps) => {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-sm"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("w-3 h-3 rounded-full", category.color)} />
          {isSelected && (
            <div className="bg-blue-500 text-white rounded-full p-1">
              <Check className="w-3 h-3" />
            </div>
          )}
        </div>
        
        <h3 className="font-semibold text-sm mb-1 line-clamp-2">
          {category.name}
        </h3>
        
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {category.description}
        </p>
        
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category.count.toLocaleString()}
          </Badge>
          
          {category.count > 25000 && (
            <Badge variant="outline" className="text-xs">
              {Math.ceil(category.count / 25000)} files
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
