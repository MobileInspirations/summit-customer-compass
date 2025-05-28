import { useState } from "react";
import { Upload, Download, Users, Database, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CategoryCard } from "@/components/CategoryCard";
import { UploadDialog } from "@/components/UploadDialog";
import { ExportDialog } from "@/components/ExportDialog";

// Current customer categories - this will be replaced with Supabase data
const customerCategories = [
  { id: 1, name: "VIP Attendees", count: 15420, description: "High-value summit participants", color: "bg-purple-500" },
  { id: 2, name: "Multi-Event Participants", count: 23680, description: "Attended 3+ summits", color: "bg-blue-500" },
  { id: 3, name: "Recent Registrants", count: 18290, description: "Registered in last 6 months", color: "bg-green-500" },
  { id: 4, name: "Industry Leaders", count: 8750, description: "C-level executives", color: "bg-orange-500" },
  { id: 5, name: "Tech Enthusiasts", count: 32150, description: "Technology-focused events", color: "bg-cyan-500" },
  { id: 6, name: "Healthcare Professionals", count: 19820, description: "Healthcare summit attendees", color: "bg-red-500" },
  { id: 7, name: "Financial Services", count: 14560, description: "Finance industry participants", color: "bg-emerald-500" },
  { id: 8, name: "Marketing Professionals", count: 28930, description: "Marketing summit attendees", color: "bg-pink-500" },
  { id: 9, name: "Inactive Contacts", count: 45670, description: "No activity in 12+ months", color: "bg-gray-500" },
  { id: 10, name: "New Prospects", count: 12340, description: "Never attended events", color: "bg-yellow-500" },
];

// Predefined business categories
const businessCategories = [
  { id: 11, name: "Holistic Wellness & Natural Living", count: 42350, description: "Natural health and wellness enthusiasts", color: "bg-emerald-600" },
  { id: 12, name: "Targeted Health Solutions & Disease Management", count: 38920, description: "Disease-specific health solutions", color: "bg-red-600" },
  { id: 13, name: "Fitness, Nutrition & Weight Management", count: 35480, description: "Fitness and nutrition focused", color: "bg-orange-600" },
  { id: 14, name: "Mental & Emotional Well-being", count: 29760, description: "Mental health and emotional wellness", color: "bg-purple-600" },
  { id: 15, name: "Women's Health & Community", count: 41200, description: "Women-focused health topics", color: "bg-pink-600" },
  { id: 16, name: "Longevity & Regenerative Health", count: 27890, description: "Anti-aging and regenerative medicine", color: "bg-cyan-600" },
  { id: 17, name: "Digital Marketing & Content Creation Skills", count: 33670, description: "Marketing and content creation", color: "bg-blue-600" },
  { id: 18, name: "Entrepreneurship & Business Development", count: 31540, description: "Business growth and entrepreneurship", color: "bg-indigo-600" },
  { id: 19, name: "Investing, Finance & Wealth Creation", count: 28430, description: "Financial education and investing", color: "bg-green-600" },
  { id: 20, name: "Self-Reliance & Preparedness", count: 24780, description: "Self-sufficiency and preparedness", color: "bg-yellow-600" },
];

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const allCategories = [...customerCategories, ...businessCategories];
  const totalContacts = allCategories.reduce((sum, cat) => sum + cat.count, 0);

  const handleCategorySelect = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleExport = () => {
    if (selectedCategories.length === 0) {
      toast({
        title: "No categories selected",
        description: "Please select at least one category to export.",
        variant: "destructive",
      });
      return;
    }
    setShowExportDialog(true);
  };

  const selectedCount = allCategories
    .filter(cat => selectedCategories.includes(cat.id))
    .reduce((sum, cat) => sum + cat.count, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">360summits.com</h1>
              <p className="text-gray-600">Customer Data Management System</p>
            </div>
            <div className="flex space-x-4">
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </Button>
              <Button 
                onClick={handleExport}
                variant="outline"
                disabled={selectedCategories.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedCategories.length})
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allCategories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selected</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedCount.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Export Files</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.ceil(selectedCount / 25000)}</div>
              <p className="text-xs text-muted-foreground">
                (max 25k per file)
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Categories</h2>
            <Badge variant="outline" className="text-sm">
              {customerCategories.filter(cat => selectedCategories.includes(cat.id)).length} of {customerCategories.length} selected
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {customerCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategories.includes(category.id)}
                onSelect={() => handleCategorySelect(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Personality Type Buckets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Personality Type Buckets</h2>
            <Badge variant="outline" className="text-sm">
              {businessCategories.filter(cat => selectedCategories.includes(cat.id)).length} of {businessCategories.length} selected
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {businessCategories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                isSelected={selectedCategories.includes(category.id)}
                onSelect={() => handleCategorySelect(category.id)}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common operations for managing your customer data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Upload className="w-6 h-6 mb-2" />
                Bulk Upload
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Filter className="w-6 h-6 mb-2" />
                Advanced Filter
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Database className="w-6 h-6 mb-2" />
                Data Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <UploadDialog 
        open={showUploadDialog} 
        onOpenChange={setShowUploadDialog} 
      />
      <ExportDialog 
        open={showExportDialog} 
        onOpenChange={setShowExportDialog}
        selectedCategories={selectedCategories.map(id => 
          allCategories.find(cat => cat.id === id)!
        )}
      />
    </div>
  );
};

export default Index;
