// web/src/pages/PartnershipsPage.tsx
import React, { useEffect, useState } from 'react';
import { usePartnershipsStore } from '../store/partnershipsStore';
import type { CreatePartnershipInvite } from '../types/partnerships';

export const PartnershipsPage: React.FC = () => {
  const {
    partnerships,
    invites,
    isLoading,
    error,
    fetchPartnerships,
    fetchInvites,
    sendInvite,
    acceptInvite,
    rejectInvite,
    updatePartnership,
    terminatePartnership,
    clearError,
  } = usePartnershipsStore();

  const [activeTab, setActiveTab] = useState<'partnerships' | 'sent' | 'received'>('partnerships');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [_showDetailsModal, _setShowDetailsModal] = useState(false);
  const [_selectedItem, _setSelectedItem] = useState<any>(null);

  const [inviteForm, setInviteForm] = useState<CreatePartnershipInvite>({
    toCompanyId: '',
    message: '',
    shareJobs: true,
    shareServices: true,
    shareResources: false,
  });

  useEffect(() => {
    fetchPartnerships();
    fetchInvites();
  }, []);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendInvite(inviteForm);
      setShowInviteModal(false);
      resetInviteForm();
      fetchInvites({ type: 'sent' });
      alert('Partnership invite sent successfully!');
    } catch (err) {
      console.error('Failed to send invite:', err);
    }
  };

  const handleAcceptInvite = async (id: string) => {
    if (!confirm('Accept this partnership invite?')) return;
    try {
      await acceptInvite(id);
      fetchPartnerships();
      fetchInvites({ type: 'received' });
      alert('Partnership established successfully!');
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  };

  const handleRejectInvite = async (id: string) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await rejectInvite(id, reason || undefined);
      fetchInvites({ type: 'received' });
    } catch (err) {
      console.error('Failed to reject invite:', err);
    }
  };

  const handleTerminatePartnership = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this partnership?')) return;
    try {
      await terminatePartnership(id);
      fetchPartnerships();
      alert('Partnership terminated');
    } catch (err) {
      console.error('Failed to terminate partnership:', err);
    }
  };

  const handleTogglePermission = async (partnershipId: string, field: string, currentValue: boolean) => {
    try {
      await updatePartnership(partnershipId, { [field]: !currentValue });
      fetchPartnerships();
    } catch (err) {
      console.error('Failed to update partnership:', err);
    }
  };

  const resetInviteForm = () => {
    setInviteForm({
      toCompanyId: '',
      message: '',
      shareJobs: true,
      shareServices: true,
      shareResources: false,
    });
  };

  const getPartnerCompany = (partnership: any, currentUserCompanyId: string) => {
    return partnership.companyAId === currentUserCompanyId ? partnership.companyB : partnership.companyA;
  };

  const renderPartnerships = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {partnerships.filter(p => p.status === 'active').map((partnership) => {
        const partner = getPartnerCompany(partnership, 'current-company-id'); // TODO: Get from auth context
        return (
          <div key={partnership.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-semibold">{partner?.name || 'Partner Company'}</h3>
                <p className="text-sm text-gray-500">{partner?.domain}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                partnership.status === 'active' ? 'bg-green-100 text-green-800' :
                partnership.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {partnership.status}
              </span>
            </div>

            {partnership.description && (
              <p className="text-sm text-gray-600 mb-3">{partnership.description}</p>
            )}

            <div className="space-y-2 mb-4">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={partnership.shareJobs}
                  onChange={() => handleTogglePermission(partnership.id, 'shareJobs', partnership.shareJobs)}
                  className="mr-2"
                />
                Share Jobs
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={partnership.shareServices}
                  onChange={() => handleTogglePermission(partnership.id, 'shareServices', partnership.shareServices)}
                  className="mr-2"
                />
                Share Services
              </label>
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={partnership.shareResources}
                  onChange={() => handleTogglePermission(partnership.id, 'shareResources', partnership.shareResources)}
                  className="mr-2"
                />
                Share Resources
              </label>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              Since: {new Date(partnership.startDate).toLocaleDateString()}
            </div>

            <button
              onClick={() => handleTerminatePartnership(partnership.id)}
              className="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
            >
              Terminate Partnership
            </button>
          </div>
        );
      })}
    </div>
  );

  const renderInvites = (type: 'sent' | 'received') => {
    const filteredInvites = invites.filter(i =>
      type === 'sent' ? i.fromCompanyId === 'current-company-id' : i.toCompanyId === 'current-company-id'
    );

    return (
      <div className="space-y-4">
        {filteredInvites.map((invite) => {
          const company = type === 'sent' ? invite.toCompany : invite.fromCompany;
          return (
            <div key={invite.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold">{company?.name || 'Company'}</h3>
                  <p className="text-sm text-gray-500">{company?.domain}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${
                  invite.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  invite.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  invite.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invite.status}
                </span>
              </div>

              {invite.message && (
                <p className="text-sm text-gray-700 mb-3 italic">"{invite.message}"</p>
              )}

              <div className="flex gap-2 text-xs mb-3">
                {invite.shareJobs && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Jobs</span>}
                {invite.shareServices && <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Services</span>}
                {invite.shareResources && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Resources</span>}
              </div>

              <div className="text-xs text-gray-500 mb-3">
                Sent: {new Date(invite.createdAt).toLocaleString()}
                {invite.expiresAt && ` • Expires: ${new Date(invite.expiresAt).toLocaleDateString()}`}
              </div>

              {type === 'received' && invite.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAcceptInvite(invite.id)}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRejectInvite(invite.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              )}

              {invite.status === 'rejected' && invite.rejectionReason && (
                <p className="text-xs text-red-600 mt-2">Reason: {invite.rejectionReason}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="partnerships-page p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Partnership Network</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Send Partnership Invite
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('partnerships')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'partnerships'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Active Partnerships ({partnerships.filter(p => p.status === 'active').length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'sent'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sent Invites ({invites.filter(i => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'received'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Received Invites ({invites.filter(i => i.status === 'pending').length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {activeTab === 'partnerships' && renderPartnerships()}
          {activeTab === 'sent' && renderInvites('sent')}
          {activeTab === 'received' && renderInvites('received')}
        </>
      )}

      {/* Send Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Send Partnership Invite</h2>
            <form onSubmit={handleSendInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Partner Company ID</label>
                  <input
                    type="text"
                    value={inviteForm.toCompanyId}
                    onChange={(e) => setInviteForm({ ...inviteForm, toCompanyId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter company ID or select from list"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Add a personal message..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Share Permissions</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shareJobs}
                        onChange={(e) => setInviteForm({ ...inviteForm, shareJobs: e.target.checked })}
                        className="mr-2"
                      />
                      Share Jobs (Partner jobs visible to employees)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shareServices}
                        onChange={(e) => setInviteForm({ ...inviteForm, shareServices: e.target.checked })}
                        className="mr-2"
                      />
                      Share Services (Services marketplace access)
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shareResources}
                        onChange={(e) => setInviteForm({ ...inviteForm, shareResources: e.target.checked })}
                        className="mr-2"
                      />
                      Share Resources (Employees, equipment)
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false);
                    resetInviteForm();
                  }}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipsPage;
