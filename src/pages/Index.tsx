
import { useState } from "react";
import { Upload, Download, Users, Database, Filter, LogOut, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CategoryCard } from "@/components/CategoryCard";
import { UploadDialog } from "@/components/UploadDialog";
import { ExportDialog } from "@/components/ExportDialog";
import { useCategoriesByType } from "@/hooks/useCategories";
import { useContactsCount } from "@/hooks/useContacts";
import { categorizeContacts } from "@/services/contactCategorizationService";
import { useQueryClient } from "@tanstack/react-query";

const Index = () => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [isCategorizing, setIsCategorizing] = useState(false);
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  // Fetch data from Supabase
  const { data: customerCategories = [], isLoading: customerLoading } = useCategoriesByType("customer");
  const { data: personalityCategories = [], isLoading: personalityLoading } = useCategoriesByType("personality");
  const { data: totalContacts = 0, isLoading: contactsLoading } = useContactsCount();

  const allCategories = [...customerCategories, ...personalityCategories];
  const isLoading = customerLoading || personalityLoading || contactsLoading;

  const handleCategorySelect = (categoryId: string) => {
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

  const handleCategorizeAll = async () => {
    setIsCategorizing(true);
    try {
      await categorizeContacts(); // Categorize all contacts
      
      // Refresh the category counts
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      
      toast({
        title: "Categorization complete",
        description: "All contacts have been automatically categorized into appropriate buckets.",
      });
    } catch (error) {
      console.error('Categorization error:', error);
      toast({
        title: "Categorization failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsCategorizing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const selectedCount = allCategories
    .filter(cat => selectedCategories.includes(cat.id))
    .reduce((sum, cat) => sum + cat.count, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">360summits.com</h1>
              <p className="text-gray-600">Customer Data Management System</p>
              {user && (
                <p className="text-sm text-gray-500">Welcome, {user.email}</p>
              )}
            </div>
            <div className="flex space-x-4 items-center">
              <Button 
                onClick={() => setShowUploadDialog(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Data
              </Button>
              <Button 
                onClick={handleCategorizeAll}
                variant="outline"
                disabled={isCategorizing}
              >
                <Tags className="w-4 h-4 mr-2" />
                {isCategorizing ? "Categorizing..." : "Categorize All"}
              </Button>
              <Button 
                onClick={handleExport}
                variant="outline"
                disabled={selectedCategories.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedCategories.length})
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                size="sm"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
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
              {personalityCategories.filter(cat => selectedCategories.includes(cat.id)).length} of {personalityCategories.length} selected
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {personalityCategories.map((category) => (
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
        ).filter(Boolean)}
      />
    </div>
  );
};

export default Index;
