import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Contact {
  id: string;
  email: string;
  full_name: string;
  company: string;
  main_bucket_assignment: string;
  personality_bucket_assignment: string;
  tags: string[];
}

interface ContactsTableProps {
  onRefresh: () => void;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ onRefresh }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    main_bucket: '',
    personality_bucket: '',
  });

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.main_bucket && { main_bucket: filters.main_bucket }),
        ...(filters.personality_bucket && { personality_bucket: filters.personality_bucket }),
      });

      const response = await fetch(`/api/contacts?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch contacts');

      const data = await response.json();
      setContacts(data.contacts);
      setTotalPages(Math.ceil(data.total / 10));
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, filters]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="w-full p-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b">
          <div className="flex gap-4">
            <select
              className="border rounded px-3 py-2"
              value={filters.main_bucket}
              onChange={(e) => handleFilterChange('main_bucket', e.target.value)}
            >
              <option value="">All Main Buckets</option>
              <option value="Business Operations">Business Operations</option>
              <option value="Health">Health</option>
              <option value="Survivalist">Survivalist</option>
            </select>

            <select
              className="border rounded px-3 py-2"
              value={filters.personality_bucket}
              onChange={(e) => handleFilterChange('personality_bucket', e.target.value)}
            >
              <option value="">All Personality Buckets</option>
              <option value="Digital Marketing">Digital Marketing</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
              <option value="Fitness & Nutrition">Fitness & Nutrition</option>
              {/* Add other personality buckets */}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Main Bucket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Personality Bucket
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    Loading...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No contacts found
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.main_bucket_assignment}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.personality_bucket_assignment}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t">
          <div className="flex justify-between items-center">
            <button
              className="px-4 py-2 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              className="px-4 py-2 border rounded disabled:opacity-50"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 