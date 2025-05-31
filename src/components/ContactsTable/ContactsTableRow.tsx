
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getEngagementBadgeVariant, getEngagementLabel, getMainBucketLabel, getMainBucketVariant } from "./contactsTableUtils";

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

interface ContactsTableRowProps {
  contact: Contact;
}

const ContactsTableRow = ({ contact }: ContactsTableRowProps) => {
  return (
    <TableRow key={contact.id}>
      <TableCell className="font-medium">
        {contact.full_name || "—"}
      </TableCell>
      <TableCell>{contact.email}</TableCell>
      <TableCell>{contact.company || "—"}</TableCell>
      <TableCell>
        {contact.engagement_level ? (
          <Badge variant={getEngagementBadgeVariant(contact.engagement_level)}>
            {getEngagementLabel(contact.engagement_level)}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell>
        {contact.main_bucket ? (
          <Badge variant={getMainBucketVariant(contact.main_bucket)}>
            {getMainBucketLabel(contact.main_bucket)}
          </Badge>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </TableCell>
      <TableCell>
        {contact.summit_history && contact.summit_history.length > 0 ? (
          <Badge variant="outline">
            {contact.summit_history.length} summit{contact.summit_history.length !== 1 ? 's' : ''}
          </Badge>
        ) : (
          <span className="text-gray-400">None</span>
        )}
      </TableCell>
      <TableCell className="text-gray-500">
        {new Date(contact.created_at).toLocaleDateString()}
      </TableCell>
    </TableRow>
  );
};

export default ContactsTableRow;
