
import { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Users, Download } from "lucide-react";

const ContactsTable = () => {
  const { data: contacts = [], isLoading, error } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportContacts = () => {
    const csvHeaders = "Name,Email,Company,Created Date,Summit History Count\n";
    const csvRows = filteredContacts.map(contact => 
      `"${contact.full_name || ''}","${contact.email}","${contact.company || ''}","${contact.created_at}","${contact.summit_history?.length || 0}"`
    ).join("\n");
    
    const csvContent = csvHeaders + csvRows;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `all_contacts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error loading contacts: {error.message}</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Contacts
            </CardTitle>
            <CardDescription>
              {filteredContacts.length} of {contacts.length} contacts
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={handleExportContacts} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchTerm ? "No contacts match your search" : "No contacts found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.full_name || "—"}
                    </TableCell>
                    <TableCell>{contact.email}</TableCell>
                    <TableCell>{contact.company || "—"}</TableCell>
                    <TableCell>
                      {contact.summit_history && contact.summit_history.length > 0 ? (
                        <Badge variant="outline">
                          {contact.summit_history.length} tags
                        </Badge>
                      ) : (
                        <span className="text-gray-400">No tags</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContactsTable;
