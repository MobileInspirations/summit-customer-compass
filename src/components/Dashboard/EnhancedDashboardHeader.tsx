
import { Button } from "@/components/ui/button";
import { Upload, Users, ArrowUpDown, Download, Brain, Tags, LogOut, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          
          <div className="flex items-center space-x-3">
            {/* Primary Actions */}
            <Button onClick={onUploadClick} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload CSV
            </Button>
            
            <Button onClick={onViewAllContacts} variant="outline">
              <Users className="w-4 h-4 mr-2" />
              View Contacts
            </Button>
            
            {/* Categorization Actions */}
            <div className="flex items-center space-x-2 border-l pl-3">
              <Button 
                onClick={onCategorizeAll} 
                variant="outline"
                disabled={isCategorizing}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <Tags className="w-4 h-4 mr-2" />
                {isCategorizing ? "Categorizing..." : "Auto Categorize"}
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
            </div>
            
            {/* Export Actions */}
            <div className="flex items-center space-x-2 border-l pl-3">
              <Button 
                onClick={onExport} 
                variant="outline"
                disabled={selectedCategoriesCount === 0}
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selected ({selectedCategoriesCount})
              </Button>
            </div>
            
            {/* More Actions Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white">
                <DropdownMenuItem 
                  onClick={onSortContacts}
                  disabled={isSorting}
                >
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  {isSorting ? "Sorting..." : "Sort Contacts"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onExportAllTags}
                  disabled={isExporting}
                >
                  <Tags className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export All Tags"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};
