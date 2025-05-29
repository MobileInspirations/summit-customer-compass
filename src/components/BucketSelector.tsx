
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface BucketSelectorProps {
  selectedBucket: string;
  onBucketChange: (bucket: string) => void;
}

const buckets = [
  {
    id: 'biz-op',
    name: 'Business Operations',
    description: 'Business-focused contacts and operations'
  },
  {
    id: 'health',
    name: 'Health',
    description: 'Health and wellness related contacts'
  },
  {
    id: 'survivalist',
    name: 'Survivalist',
    description: 'Emergency preparedness and survival contacts'
  }
];

export const BucketSelector = ({ selectedBucket, onBucketChange }: BucketSelectorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Main Bucket</CardTitle>
        <CardDescription>
          Choose which main category these contacts should be placed in
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedBucket} onValueChange={onBucketChange}>
          {buckets.map((bucket) => (
            <div key={bucket.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={bucket.id} id={bucket.id} />
              <Label htmlFor={bucket.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{bucket.name}</div>
                <div className="text-sm text-gray-500">{bucket.description}</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
