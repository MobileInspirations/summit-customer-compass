
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Filter, Users, Download, Target } from "lucide-react";

interface StatsCardsProps {
  totalContacts: number;
  totalUniqueContacts: number;
  categoriesCount: number;
  selectedCount: number;
}

export const StatsCards = ({ totalContacts, totalUniqueContacts, categoriesCount, selectedCount }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
          <Database className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalContacts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            All contacts in database
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Categorized</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalUniqueContacts.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Unique contacts in buckets
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Filter className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categoriesCount}</div>
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
  );
};
