
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

// Mock data for the 10 categories - this will be replaced with Supabase data
const categories = [
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

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const totalContacts = categories.reduce((sum, cat) => sum + cat.count, 0);

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

  const selectedCount = categories
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
              <div className="text-2xl font-bold">{categories.length}</div>
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

        {/* Categories Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Categories</h2>
            <Badge variant="outline" className="text-sm">
              {selectedCategories.length} of {categories.length} selected
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {categories.map((category) => (
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
          categories.find(cat => cat.id === id)!
        )}
      />
    </div>
  );
};

export default Index;
