// web/src/pages/ServicesPage.tsx
import React, { useEffect, useState } from 'react';
import { useServicesStore } from '../store/servicesStore';
import type { CreateService } from '../types/services';

export const ServicesPage: React.FC = () => {
  const {
    services,
    selectedService,
    proposals,
    transactions,
    isLoading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    submitProposal,
    fetchProposals,
    acceptProposal,
    rejectProposal,
    completeService,
    rateService,
    fetchTransactions,
    selectService,
    clearError,
  } = useServicesStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });

  // Form states
  const [serviceForm, setServiceForm] = useState<CreateService>({
    title: '',
    description: '',
    category: '',
    allowCompanies: true,
    allowIndividuals: true,
    budget: 0,
    currency: 'BRL',
  });

  const [proposalForm, setProposalForm] = useState({
    proposerType: 'individual',
    message: '',
    estimatedDuration: 0,
    portfolio: null as any,
  });

  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    feedback: '',
  });

  useEffect(() => {
    fetchServices(filters);
  }, [filters]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService(serviceForm);
      setShowCreateModal(false);
      resetServiceForm();
      fetchServices(filters);
    } catch (err) {
      console.error('Failed to create service:', err);
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await updateService(selectedService.id, serviceForm);
      setShowCreateModal(false);
      resetServiceForm();
      fetchServices(filters);
    } catch (err) {
      console.error('Failed to update service:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteService(id);
      fetchServices(filters);
    } catch (err) {
      console.error('Failed to delete service:', err);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await submitProposal(selectedService.id, proposalForm);
      setShowProposalModal(false);
      resetProposalForm();
      alert('Proposal submitted successfully!');
    } catch (err) {
      console.error('Failed to submit proposal:', err);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    if (!confirm('Accept this proposal?')) return;
    try {
      await acceptProposal(proposalId);
      if (selectedService) {
        fetchProposals(selectedService.id);
      }
    } catch (err) {
      console.error('Failed to accept proposal:', err);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    const reason = prompt('Reason for rejection (optional):');
    try {
      await rejectProposal(proposalId, reason || undefined);
      if (selectedService) {
        fetchProposals(selectedService.id);
      }
    } catch (err) {
      console.error('Failed to reject proposal:', err);
    }
  };

  const handleCompleteService = async (serviceId: string) => {
    const notes = prompt('Completion notes (optional):');
    try {
      await completeService(serviceId, { notes: notes || undefined });
      fetchServices(filters);
      alert('Service marked as completed!');
    } catch (err) {
      console.error('Failed to complete service:', err);
    }
  };

  const handleRateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    try {
      await rateService(selectedService.id, ratingForm);
      setShowRatingModal(false);
      resetRatingForm();
      fetchServices(filters);
    } catch (err) {
      console.error('Failed to rate service:', err);
    }
  };

  const handleViewDetails = async (service: any) => {
    selectService(service);
    setShowDetailsModal(true);
    if (service.id) {
      fetchProposals(service.id);
    }
  };

  const handleEditService = (service: any) => {
    selectService(service);
    setServiceForm({
      title: service.title,
      description: service.description,
      category: service.category,
      allowCompanies: service.allowCompanies,
      allowIndividuals: service.allowIndividuals,
      budget: service.budget,
      currency: service.currency || 'BRL',
    });
    setShowCreateModal(true);
  };

  const resetServiceForm = () => {
    setServiceForm({
      title: '',
      description: '',
      category: '',
      allowCompanies: true,
      allowIndividuals: true,
      budget: 0,
      currency: 'BRL',
    });
    selectService(null);
  };

  const resetProposalForm = () => {
    setProposalForm({
      proposerType: 'individual',
      message: '',
      estimatedDuration: 0,
      portfolio: null,
    });
  };

  const resetRatingForm = () => {
    setRatingForm({
      rating: 5,
      feedback: '',
    });
  };

  return (
    <div className="services-page p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Services Marketplace</h1>
        <div className="flex gap-2">
          <button
            onClick={() => fetchTransactions()}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            View Transactions
          </button>
          <button
            onClick={() => {
              resetServiceForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Create Service Request
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search services..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <input
            type="text"
            placeholder="Category..."
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="border rounded px-3 py-2"
          />
        </div>
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{service.title}</h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  service.status === 'open' ? 'bg-green-100 text-green-800' :
                  service.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  service.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {service.status}
                </span>
              </div>

              <div className="flex gap-1 mb-3">
                <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded">
                  {service.category}
                </span>
                {service.allowCompanies && (
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                    Companies
                  </span>
                )}
                {service.allowIndividuals && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Individuals
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>

              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl font-bold text-green-600">
                  {service.currency} {service.budget.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  {service._count?.proposals || 0} proposals
                </span>
              </div>

              {service.rating && (
                <div className="flex items-center mb-4">
                  <span className="text-yellow-500">{'★'.repeat(Math.round(service.rating))}</span>
                  <span className="text-gray-400 ml-1">
                    {'★'.repeat(5 - Math.round(service.rating))}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(service)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  View Details
                </button>
                {service.status === 'open' && (
                  <button
                    onClick={() => {
                      selectService(service);
                      setShowProposalModal(true);
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Propose
                  </button>
                )}
                {service.status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteService(service.id)}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
                  >
                    Complete
                  </button>
                )}
                {service.status === 'completed' && !service.rating && (
                  <button
                    onClick={() => {
                      selectService(service);
                      setShowRatingModal(true);
                    }}
                    className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700"
                  >
                    Rate
                  </button>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEditService(service)}
                  className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteService(service.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedService ? 'Edit Service' : 'Create Service Request'}
            </h2>
            <form onSubmit={selectedService ? handleUpdateService : handleCreateService}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <input
                    type="text"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Budget ({serviceForm.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceForm.budget}
                    onChange={(e) => setServiceForm({ ...serviceForm, budget: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Who can fulfill this service?</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.allowCompanies}
                        onChange={(e) => setServiceForm({ ...serviceForm, allowCompanies: e.target.checked })}
                        className="mr-2"
                      />
                      Companies
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={serviceForm.allowIndividuals}
                        onChange={(e) => setServiceForm({ ...serviceForm, allowIndividuals: e.target.checked })}
                        className="mr-2"
                      />
                      Individuals
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {selectedService ? 'Update Service' : 'Create Service'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetServiceForm();
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

      {/* Proposal Modal */}
      {showProposalModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Submit Proposal for {selectedService.title}</h2>
            <div className="bg-green-50 p-3 rounded mb-4">
              <p className="font-semibold">Budget: {selectedService.currency} {selectedService.budget.toFixed(2)}</p>
              <p className="text-sm text-gray-600">This is a fixed price. No negotiation.</p>
            </div>
            <form onSubmit={handleSubmitProposal}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Proposer Type</label>
                  <select
                    value={proposalForm.proposerType}
                    onChange={(e) => setProposalForm({ ...proposalForm, proposerType: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    {selectedService.allowIndividuals && <option value="individual">Individual</option>}
                    {selectedService.allowCompanies && <option value="company">Company</option>}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Message</label>
                  <textarea
                    value={proposalForm.message}
                    onChange={(e) => setProposalForm({ ...proposalForm, message: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    placeholder="Explain why you're the best fit for this service..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Duration (days)</label>
                  <input
                    type="number"
                    value={proposalForm.estimatedDuration}
                    onChange={(e) => setProposalForm({ ...proposalForm, estimatedDuration: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Proposal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProposalModal(false);
                    resetProposalForm();
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

      {/* Rating Modal */}
      {showRatingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Rate Service</h2>
            <form onSubmit={handleRateService}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                        className="text-3xl"
                      >
                        {star <= ratingForm.rating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Feedback</label>
                  <textarea
                    value={ratingForm.feedback}
                    onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                >
                  Submit Rating
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingModal(false);
                    resetRatingForm();
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

      {/* Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedService.title}</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedService.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Budget</h3>
                <p className="text-2xl font-bold text-green-600">
                  {selectedService.currency} {selectedService.budget.toFixed(2)}
                </p>
              </div>

              {proposals && proposals.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Proposals ({proposals.length})</h3>
                  <div className="space-y-2">
                    {proposals.map((proposal) => (
                      <div key={proposal.id} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{proposal.proposer?.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>
                        {proposal.message && (
                          <p className="text-sm text-gray-600 mb-2">{proposal.message}</p>
                        )}
                        {proposal.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptProposal(proposal.id)}
                              className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectProposal(proposal.id)}
                              className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowDetailsModal(false)}
              className="mt-6 w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
