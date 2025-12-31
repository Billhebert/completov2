// web/src/pages/PartnershipsPage.tsx
import React, { useEffect, useState } from 'react';
import { usePartnershipsStore } from '../store/partnershipsStore';
import type { CreatePartnership, CreatePartnershipInvite, Partnership, PartnershipInvite } from '../types/partnerships';

export const PartnershipsPage: React.FC = () => {
  const {
    partnerships,
    selectedPartnership,
    invites,
    isLoading,
    error,
    fetchPartnerships,
    fetchInvites,
    createPartnership,
    updatePartnership,
    terminatePartnership,
    sendInvite,
    acceptInvite,
    rejectInvite,
    selectPartnership,
    clearError,
  } = usePartnershipsStore();

  const [activeTab, setActiveTab] = useState<'partnerships' | 'sent' | 'received'>('partnerships');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [partnershipForm, setPartnershipForm] = useState<CreatePartnership>({
    partnerCompanyId: '',
    name: '',
    description: '',
    type: 'strategic',
    shareJobs: true,
    shareServices: true,
    shareResources: false,
  });

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
  }, [fetchPartnerships, fetchInvites]);

  // Stats calculations
  const activePartnerships = partnerships.filter(p => p.status === 'active').length;
  const pendingInvites = invites.filter(i => i.status === 'pending').length;
  const sharedResources = partnerships.filter(p => p.status === 'active' && p.shareResources).length;
  const sentInvites = invites.filter(i => i.fromCompanyId === 'current-company-id'); // TODO: Get from auth
  const receivedInvites = invites.filter(i => i.toCompanyId === 'current-company-id'); // TODO: Get from auth

  // Handlers
  const handleCreatePartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPartnership(partnershipForm);
      setShowCreateModal(false);
      resetPartnershipForm();
      fetchPartnerships();
      alert('Partnership created successfully!');
    } catch (err) {
      console.error('Failed to create partnership:', err);
    }
  };

  const handleUpdatePartnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnership) return;
    try {
      await updatePartnership(selectedPartnership.id, {
        name: partnershipForm.name,
        description: partnershipForm.description,
        type: partnershipForm.type,
        shareJobs: partnershipForm.shareJobs,
        shareServices: partnershipForm.shareServices,
        shareResources: partnershipForm.shareResources,
      });
      setShowDetailsModal(false);
      setIsEditing(false);
      resetPartnershipForm();
      fetchPartnerships();
      alert('Partnership updated successfully!');
    } catch (err) {
      console.error('Failed to update partnership:', err);
    }
  };

  const handleTerminatePartnership = async (id: string) => {
    if (!confirm('Are you sure you want to terminate this partnership? This action cannot be undone.')) return;
    try {
      await terminatePartnership(id);
      setShowDetailsModal(false);
      selectPartnership(null);
      fetchPartnerships();
      alert('Partnership terminated successfully');
    } catch (err) {
      console.error('Failed to terminate partnership:', err);
    }
  };

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
      alert('Invite rejected');
    } catch (err) {
      console.error('Failed to reject invite:', err);
    }
  };

  const handleViewDetails = (partnership: Partnership) => {
    selectPartnership(partnership);
    setPartnershipForm({
      partnerCompanyId: partnership.companyBId, // TODO: Get correct partner ID based on current company
      name: partnership.name || '',
      description: partnership.description || '',
      type: partnership.type,
      shareJobs: partnership.shareJobs,
      shareServices: partnership.shareServices,
      shareResources: partnership.shareResources,
    });
    setShowDetailsModal(true);
    setIsEditing(false);
  };

  const resetPartnershipForm = () => {
    setPartnershipForm({
      partnerCompanyId: '',
      name: '',
      description: '',
      type: 'strategic',
      shareJobs: true,
      shareServices: true,
      shareResources: false,
    });
    selectPartnership(null);
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

  const getPartnerCompany = (partnership: Partnership) => {
    // TODO: Get current company ID from auth context
    const currentCompanyId = 'current-company-id';
    return partnership.companyAId === currentCompanyId ? partnership.companyB : partnership.companyA;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render functions
  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Partnerships</p>
            <p className="text-3xl font-bold text-green-600">{activePartnerships}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Invites</p>
            <p className="text-3xl font-bold text-yellow-600">{pendingInvites}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Shared Resources</p>
            <p className="text-3xl font-bold text-purple-600">{sharedResources}</p>
          </div>
          <div className="bg-purple-100 p-3 rounded-full">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPartnershipCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {partnerships.map((partnership) => {
        const partner = getPartnerCompany(partnership);
        return (
          <div key={partnership.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-xl font-semibold">{partner?.name || 'Partner Company'}</h3>
                <p className="text-sm text-gray-500">{partner?.domain}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${getStatusColor(partnership.status)}`}>
                {partnership.status}
              </span>
            </div>

            {partnership.name && (
              <p className="text-sm font-medium text-gray-700 mb-2">{partnership.name}</p>
            )}

            {partnership.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{partnership.description}</p>
            )}

            <div className="mb-3">
              <span className="inline-block px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded mr-2">
                {partnership.type}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {partnership.shareJobs && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Jobs</span>
              )}
              {partnership.shareServices && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Services</span>
              )}
              {partnership.shareResources && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Resources</span>
              )}
            </div>

            <div className="text-xs text-gray-500 mb-3">
              <div>Started: {formatDate(partnership.startDate)}</div>
              {partnership.endDate && <div>Ends: {formatDate(partnership.endDate)}</div>}
            </div>

            <button
              onClick={() => handleViewDetails(partnership)}
              className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
            >
              View Details
            </button>
          </div>
        );
      })}

      {partnerships.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">
          No partnerships found. Create a partnership or send an invite to get started.
        </div>
      )}
    </div>
  );

  const renderInviteCards = (type: 'sent' | 'received') => {
    const filteredInvites = type === 'sent' ? sentInvites : receivedInvites;

    return (
      <div className="space-y-4">
        {filteredInvites.map((invite: PartnershipInvite) => {
          const company = type === 'sent' ? invite.toCompany : invite.fromCompany;
          return (
            <div key={invite.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="text-sm text-gray-500 mb-1">
                    {type === 'sent' ? 'To:' : 'From:'}
                  </div>
                  <h3 className="text-lg font-semibold">{company?.name || 'Company'}</h3>
                  <p className="text-sm text-gray-500">{company?.domain}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded ${getStatusColor(invite.status)}`}>
                  {invite.status}
                </span>
              </div>

              {invite.message && (
                <div className="bg-gray-50 p-3 rounded mb-3">
                  <p className="text-sm text-gray-700 italic">"{invite.message}"</p>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {invite.shareJobs && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Jobs</span>
                )}
                {invite.shareServices && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Services</span>
                )}
                {invite.shareResources && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Resources</span>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <div>Sent: {formatDate(invite.createdAt)}</div>
                {invite.expiresAt && <div>Expires: {formatDate(invite.expiresAt)}</div>}
                {invite.respondedAt && <div>Responded: {formatDate(invite.respondedAt)}</div>}
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
                <div className="bg-red-50 p-2 rounded">
                  <p className="text-xs text-red-600">
                    <span className="font-medium">Rejection reason:</span> {invite.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredInvites.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No {type} invites found.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="partnerships-page p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Partnership Network</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              resetPartnershipForm();
              setShowCreateModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + New Partnership
          </button>
          <button
            onClick={() => {
              resetInviteForm();
              setShowInviteModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Send Invite
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Stats Cards */}
      {renderStatsCards()}

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
            My Partnerships ({partnerships.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('sent');
              fetchInvites({ type: 'sent' });
            }}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'sent'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sent Invites ({sentInvites.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('received');
              fetchInvites({ type: 'received' });
            }}
            className={`px-4 py-2 border-b-2 font-medium ${
              activeTab === 'received'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Received Invites ({receivedInvites.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {activeTab === 'partnerships' && renderPartnershipCards()}
          {activeTab === 'sent' && renderInviteCards('sent')}
          {activeTab === 'received' && renderInviteCards('received')}
        </>
      )}

      {/* Create Partnership Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Create New Partnership</h2>
            <form onSubmit={handleCreatePartnership}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Partner Company ID</label>
                  <input
                    type="text"
                    value={partnershipForm.partnerCompanyId}
                    onChange={(e) => setPartnershipForm({ ...partnershipForm, partnerCompanyId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter partner company ID"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the unique ID of the company you want to partner with
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Partnership Name (Optional)</label>
                  <input
                    type="text"
                    value={partnershipForm.name}
                    onChange={(e) => setPartnershipForm({ ...partnershipForm, name: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="e.g., Strategic Alliance 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    value={partnershipForm.description}
                    onChange={(e) => setPartnershipForm({ ...partnershipForm, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Describe the purpose and goals of this partnership..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Partnership Type</label>
                  <select
                    value={partnershipForm.type}
                    onChange={(e) => setPartnershipForm({ ...partnershipForm, type: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="strategic">Strategic</option>
                    <option value="commercial">Commercial</option>
                    <option value="technical">Technical</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Sharing Permissions</label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={partnershipForm.shareJobs}
                        onChange={(e) => setPartnershipForm({ ...partnershipForm, shareJobs: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Share Jobs</span> - Partner jobs visible to your employees
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={partnershipForm.shareServices}
                        onChange={(e) => setPartnershipForm({ ...partnershipForm, shareServices: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Share Services</span> - Services marketplace access
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={partnershipForm.shareResources}
                        onChange={(e) => setPartnershipForm({ ...partnershipForm, shareResources: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Share Resources</span> - Employees, equipment, and other resources
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Create Partnership
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetPartnershipForm();
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

      {/* Send Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Send Partnership Invite</h2>
            <form onSubmit={handleSendInvite}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company ID</label>
                  <input
                    type="text"
                    value={inviteForm.toCompanyId}
                    onChange={(e) => setInviteForm({ ...inviteForm, toCompanyId: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter company ID"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the ID of the company you want to invite
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                  <textarea
                    value={inviteForm.message}
                    onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    placeholder="Add a personal message to your invite..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Proposed Sharing Permissions</label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shareJobs}
                        onChange={(e) => setInviteForm({ ...inviteForm, shareJobs: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Share Jobs</span> - Partner jobs visible to employees
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shareServices}
                        onChange={(e) => setInviteForm({ ...inviteForm, shareServices: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Share Services</span> - Services marketplace access
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={inviteForm.shareResources}
                        onChange={(e) => setInviteForm({ ...inviteForm, shareResources: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm">
                        <span className="font-medium">Share Resources</span> - Employees, equipment, and resources
                      </span>
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

      {/* Partnership Details Modal */}
      {showDetailsModal && selectedPartnership && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold">Partnership Details</h2>
                <p className="text-sm text-gray-500">
                  {getPartnerCompany(selectedPartnership)?.name || 'Partner Company'}
                </p>
              </div>
              <span className={`px-3 py-1 text-sm rounded ${getStatusColor(selectedPartnership.status)}`}>
                {selectedPartnership.status}
              </span>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdatePartnership}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Partnership Name</label>
                    <input
                      type="text"
                      value={partnershipForm.name}
                      onChange={(e) => setPartnershipForm({ ...partnershipForm, name: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={partnershipForm.description}
                      onChange={(e) => setPartnershipForm({ ...partnershipForm, description: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Partnership Type</label>
                    <select
                      value={partnershipForm.type}
                      onChange={(e) => setPartnershipForm({ ...partnershipForm, type: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="strategic">Strategic</option>
                      <option value="commercial">Commercial</option>
                      <option value="technical">Technical</option>
                      <option value="referral">Referral</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Sharing Permissions</label>
                    <div className="space-y-2 bg-gray-50 p-3 rounded">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={partnershipForm.shareJobs}
                          onChange={(e) => setPartnershipForm({ ...partnershipForm, shareJobs: e.target.checked })}
                          className="mr-2"
                        />
                        Share Jobs
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={partnershipForm.shareServices}
                          onChange={(e) => setPartnershipForm({ ...partnershipForm, shareServices: e.target.checked })}
                          className="mr-2"
                        />
                        Share Services
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={partnershipForm.shareResources}
                          onChange={(e) => setPartnershipForm({ ...partnershipForm, shareResources: e.target.checked })}
                          className="mr-2"
                        />
                        Share Resources
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Partner Company</h3>
                    <p className="text-gray-900">{getPartnerCompany(selectedPartnership)?.name || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{getPartnerCompany(selectedPartnership)?.domain}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Partnership Type</h3>
                    <span className="inline-block px-2 py-1 text-sm bg-indigo-100 text-indigo-800 rounded">
                      {selectedPartnership.type}
                    </span>
                  </div>
                </div>

                {selectedPartnership.name && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Partnership Name</h3>
                    <p className="text-gray-900">{selectedPartnership.name}</p>
                  </div>
                )}

                {selectedPartnership.description && (
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Description</h3>
                    <p className="text-gray-700">{selectedPartnership.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-2">Sharing Permissions</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedPartnership.shareJobs && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">Jobs</span>
                    )}
                    {selectedPartnership.shareServices && (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded">Services</span>
                    )}
                    {selectedPartnership.shareResources && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded">Resources</span>
                    )}
                    {!selectedPartnership.shareJobs && !selectedPartnership.shareServices && !selectedPartnership.shareResources && (
                      <span className="text-sm text-gray-500">No sharing permissions enabled</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-gray-600 mb-1">Start Date</h3>
                    <p className="text-gray-900">{formatDate(selectedPartnership.startDate)}</p>
                  </div>

                  {selectedPartnership.endDate && (
                    <div>
                      <h3 className="font-semibold text-sm text-gray-600 mb-1">End Date</h3>
                      <p className="text-gray-900">{formatDate(selectedPartnership.endDate)}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                  <div>Created: {formatDate(selectedPartnership.createdAt)}</div>
                  <div>Updated: {formatDate(selectedPartnership.updatedAt)}</div>
                </div>

                {selectedPartnership.status === 'active' && (
                  <div className="flex gap-2 mt-6 pt-4 border-t">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Edit Partnership
                    </button>
                    <button
                      onClick={() => handleTerminatePartnership(selectedPartnership.id)}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Terminate Partnership
                    </button>
                  </div>
                )}

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    selectPartnership(null);
                  }}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 mt-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipsPage;
