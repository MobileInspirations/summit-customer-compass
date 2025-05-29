
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Filter, Database } from "lucide-react";

export const QuickActions = () => {
  return (
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
  );
};
