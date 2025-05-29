
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BucketSelectorProps {
  selectedBucket: string;
  onBucketChange: (bucket: string) => void;
  bucketCounts: Record<string, number>;
}

const buckets = [
  {
    id: 'biz-op',
    name: 'Business Operations',
    description: 'Business-focused contacts and operations',
    color: 'bg-blue-500'
  },
  {
    id: 'health',
    name: 'Health',
    description: 'Health and wellness related contacts',
    color: 'bg-green-500'
  },
  {
    id: 'survivalist',
    name: 'Survivalist',
    description: 'Emergency preparedness and survival contacts',
    color: 'bg-orange-500'
  }
];

export const BucketSelector = ({ selectedBucket, onBucketChange, bucketCounts }: BucketSelectorProps) => {
  const selectedCount = buckets.filter(bucket => selectedBucket === bucket.id).length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Main Buckets</h2>
        <Badge variant="outline" className="text-sm">
          {selectedCount} of {buckets.length} selected
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map((bucket) => {
          const isSelected = selectedBucket === bucket.id;
          const count = bucketCounts[bucket.id] || 0;
          
          return (
            <Card 
              key={bucket.id}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                isSelected ? "ring-2 ring-blue-500 shadow-md" : "hover:shadow-sm"
              )}
              onClick={() => onBucketChange(bucket.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn("w-3 h-3 rounded-full", bucket.color)} />
                  {isSelected && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                  {bucket.name}
                </h3>
                
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">
                  {bucket.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {count.toLocaleString()}
                  </Badge>
                  
                  {count > 25000 && (
                    <Badge variant="outline" className="text-xs">
                      {Math.ceil(count / 25000)} files
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
