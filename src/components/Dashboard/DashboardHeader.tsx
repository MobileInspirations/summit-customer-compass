
import { Button } from "@/components/ui/button";
import { Upload, Download, Users, Database, Filter, LogOut, Tags, ArrowUpDown, FileSpreadsheet, Table } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface DashboardHeaderProps {
  onUploadClick: () => void;
  onViewAllContacts: () => void;
  onSortContacts: () => void;
  onExportAllTags: () => void;
  onCategorizeAll: () => void;
  onExport: () => void;
  onSignOut: () => void;
  selectedCategoriesCount: number;
  isSorting: boolean;
  isExporting: boolean;
  isCategorizing: boolean;
}

export const DashboardHeader = ({
  onUploadClick,
  onViewAllContacts,
  onSortContacts,
  onExportAllTags,
  onCategorizeAll,
  onExport,
  onSignOut,
  selectedCategoriesCount,
  isSorting,
  isExporting,
  isCategorizing,
}: DashboardHeaderProps) => {
  const { user } = useAuth();

  return (
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
              onClick={onUploadClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Data
            </Button>
            <Button 
              onClick={onViewAllContacts}
              variant="outline"
            >
              <Table className="w-4 h-4 mr-2" />
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
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All Tags"}
            </Button>
            <Button 
              onClick={onCategorizeAll}
              variant="outline"
              disabled={isCategorizing}
            >
              <Tags className="w-4 h-4 mr-2" />
              {isCategorizing ? "Categorizing..." : "Categorize All"}
            </Button>
            <Button 
              onClick={onExport}
              variant="outline"
              disabled={selectedCategoriesCount === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Selected ({selectedCategoriesCount})
            </Button>
            <Button 
              onClick={onSignOut}
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
  );
};
