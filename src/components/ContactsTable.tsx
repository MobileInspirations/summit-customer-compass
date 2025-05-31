
import { useState } from "react";
import { useContacts } from "@/hooks/useContacts";
import { Card, CardContent } from "@/components/ui/card";
import ContactsTableHeader from "./ContactsTable/ContactsTableHeader";
import ContactsTableContent from "./ContactsTable/ContactsTableContent";
import { exportContactsToCSV } from "./ContactsTable/contactsTableUtils";

const ContactsTable = () => {
  const { data: contacts = [], isLoading, error, refetch } = useContacts();
  const [searchTerm, setSearchTerm] = useState("");

  // Filter contacts based on search term
  const filteredContacts = contacts.filter(contact => 
    contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportContacts = () => {
    exportContactsToCSV(filteredContacts);
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
      <ContactsTableHeader
        filteredCount={filteredContacts.length}
        totalCount={contacts.length}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onExport={handleExportContacts}
        onUploadComplete={() => refetch()}
      />
      <CardContent>
        <ContactsTableContent
          contacts={filteredContacts}
          searchTerm={searchTerm}
        />
      </CardContent>
    </Card>
  );
};

export default ContactsTable;
