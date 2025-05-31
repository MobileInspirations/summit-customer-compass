
import { Search, Users, Download } from "lucide-react";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ZipUploadDialog from "../ZipUploadDialog";

interface ContactsTableHeaderProps {
  filteredCount: number;
  totalCount: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onExport: () => void;
  onUploadComplete: () => void;
}

const ContactsTableHeader = ({
  filteredCount,
  totalCount,
  searchTerm,
  onSearchChange,
  onExport,
  onUploadComplete
}: ContactsTableHeaderProps) => {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Contacts
          </CardTitle>
          <CardDescription>
            {filteredCount} of {totalCount} contacts
          </CardDescription>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <ZipUploadDialog onUploadComplete={onUploadComplete} />
          <Button onClick={onExport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>
    </CardHeader>
  );
};

export default ContactsTableHeader;
