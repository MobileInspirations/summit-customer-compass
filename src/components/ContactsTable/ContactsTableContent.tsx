
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ContactsTableRow from "./ContactsTableRow";

interface Contact {
  id: string;
  full_name?: string;
  email: string;
  company?: string;
  engagement_level?: string;
  main_bucket?: string;
  summit_history?: string[];
  created_at: string;
}

interface ContactsTableContentProps {
  contacts: Contact[];
  searchTerm: string;
}

const ContactsTableContent = ({ contacts, searchTerm }: ContactsTableContentProps) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Engagement</TableHead>
            <TableHead>Main Bucket</TableHead>
            <TableHead>Summit History</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                {searchTerm ? "No contacts match your search" : "No contacts found"}
              </TableCell>
            </TableRow>
          ) : (
            contacts.map((contact) => (
              <ContactsTableRow key={contact.id} contact={contact} />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ContactsTableContent;
