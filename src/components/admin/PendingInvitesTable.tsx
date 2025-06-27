import React from 'react';
import { Mail, Calendar } from 'lucide-react';

interface PendingInvite {
  id: string;
  emailAddress: string;
  createdAt: string;
}

interface PendingInvitesTableProps {
  pendingInvites: PendingInvite[];
}

/**
 * PendingInvitesTable Component
 * 
 * Displays a table of pending organization invitations
 */
const PendingInvitesTable: React.FC<PendingInvitesTableProps> = ({ pendingInvites }) => {
  if (pendingInvites.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invitations</h3>
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingInvites.map((invite) => (
                <tr key={invite.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Mail className="h-4 w-4 mr-2" />
                      {invite.emailAddress}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-warning-100 text-warning-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(invite.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PendingInvitesTable;