
import { Button } from "@/components/ui/button";
import { Upload, Users, ArrowUpDown, Download, Brain, Tags, LogOut } from "lucide-react";

interface EnhancedDashboardHeaderProps {
  onUploadClick: () => void;
  onViewAllContacts: () => void;
  onSortContacts: () => void;
  onExportAllTags: () => void;
  onCategorizeAll: () => void;
  onAICategorizeAll: () => void;
  onExport: () => void;
  onSignOut: () => void;
  selectedCategoriesCount: number;
  isSorting: boolean;
  isExporting: boolean;
  isCategorizing: boolean;
}

export const EnhancedDashboardHeader = ({
  onUploadClick,
  onViewAllContacts,
  onSortContacts,
  onExportAllTags,
  onCategorizeAll,
  onAICategorizeAll,
  onExport,
  onSignOut,
  selectedCategoriesCount,
  isSorting,
  isExporting,
  isCategorizing
}: EnhancedDashboardHeaderProps) => {
  return (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Categories Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and categorize your customer contacts
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button onClick={onUploadClick} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
            
            <Button onClick={onViewAllContacts} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              View All Contacts
            </Button>
            
            <Button 
              onClick={onSortContacts} 
              variant="outline"
              disabled={isSorting}
            >
              <ArrowUpDown className="w-4 h-4 mr-2" />
              {isSorting ? "Sorting..." : "Sort Contacts"}
            </Button>
            
            <Button 
              onClick={onExportAllTags} 
              variant="outline"
              disabled={isExporting}
            >
              <Tags className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All Tags"}
            </Button>
            
            <Button 
              onClick={onCategorizeAll} 
              variant="outline"
              disabled={isCategorizing}
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Tags className="w-4 h-4 mr-2" />
              {isCategorizing ? "Categorizing..." : "Categorize All"}
            </Button>

            <Button 
              onClick={onAICategorizeAll} 
              variant="outline"
              disabled={isCategorizing}
              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200"
            >
              <Brain className="w-4 h-4 mr-2" />
              {isCategorizing ? "AI Processing..." : "AI Categorize"}
            </Button>
            
            <Button 
              onClick={onExport} 
              variant="outline"
              disabled={selectedCategoriesCount === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedCategoriesCount})
            </Button>
            
            <Button onClick={onSignOut} variant="ghost">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
