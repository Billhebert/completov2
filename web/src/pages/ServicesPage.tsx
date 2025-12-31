// web/src/pages/ServicesPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useServicesStore } from '../store/servicesStore';
import { useAuthStore } from '../store/authStore';
import type { CreateService, Service, ServiceProposal } from '../types/services';

type TabType = 'all' | 'my-services' | 'my-proposals';

export const ServicesPage: React.FC = () => {
  const {
    services,
    selectedService,
    proposals,
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
    selectService,
    clearError,
  } = useServicesStore();

  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    minBudget: '',
    maxBudget: '',
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
    const params: any = {};
    if (filters.status) params.status = filters.status;
    if (filters.category) params.category = filters.category;
    if (filters.minBudget) params.minBudget = Number(filters.minBudget);
    if (filters.maxBudget) params.maxBudget = Number(filters.maxBudget);
    if (filters.search) params.search = filters.search;

    fetchServices(params);
  }, [filters]);

  // Filter services based on active tab
  const filteredServices = useMemo(() => {
    if (!user) return services;

    switch (activeTab) {
      case 'my-services':
        return services.filter(service => service.createdBy === user.id);
      case 'my-proposals':
        // Services where user has submitted a proposal
        return services.filter(service =>
          service._count && service._count.proposals > 0
        );
      default:
        return services;
    }
  }, [services, activeTab, user]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalServices = services.length;
    const openServices = services.filter(s => s.status === 'open').length;
    const completedServices = services.filter(s => s.status === 'completed').length;
    const myProposalsCount = user
      ? services.filter(s => s._count && s._count.proposals > 0).length
      : 0;

    return {
      total: totalServices,
      open: openServices,
      myProposals: myProposalsCount,
      completed: completedServices,
    };
  }, [services, user]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createService(serviceForm);
      setShowCreateModal(false);
      resetServiceForm();
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      fetchServices(params);
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
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      fetchServices(params);
    } catch (err) {
      console.error('Failed to update service:', err);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      await deleteService(id);
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      fetchServices(params);
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
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal');
      console.error('Failed to submit proposal:', err);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    if (!confirm('Accept this proposal? This will start the service.')) return;
    try {
      await acceptProposal(proposalId);
      if (selectedService) {
        fetchProposals(selectedService.id);
      }
      alert('Proposal accepted! Service is now in progress.');
    } catch (err: any) {
      alert(err.message || 'Failed to accept proposal');
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
    } catch (err: any) {
      alert(err.message || 'Failed to reject proposal');
      console.error('Failed to reject proposal:', err);
    }
  };

  const handleCompleteService = async (serviceId: string) => {
    const notes = prompt('Completion notes (optional):');
    try {
      await completeService(serviceId, { notes: notes || undefined });
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      fetchServices(params);
      alert('Service marked as completed!');
    } catch (err: any) {
      alert(err.message || 'Failed to complete service');
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
      const params: any = {};
      if (filters.status) params.status = filters.status;
      if (filters.category) params.category = filters.category;
      fetchServices(params);
    } catch (err: any) {
      alert(err.message || 'Failed to rate service');
      console.error('Failed to rate service:', err);
    }
  };

  const handleViewDetails = async (service: Service) => {
    selectService(service);
    setShowDetailsModal(true);
    if (service.id) {
      fetchProposals(service.id);
    }
  };

  const handleManageProposals = async (service: Service) => {
    selectService(service);
    setShowProposalsModal(true);
    if (service.id) {
      fetchProposals(service.id);
    }
  };

  const handleEditService = (service: Service) => {
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

  const isMyService = (service: Service) => {
    return user && service.createdBy === user.id;
  };

  return (
    <div className="services-page p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Services Marketplace</h1>
          <p className="text-gray-600 mt-1">Partnership-based service sharing</p>
        </div>
        <button
          onClick={() => {
            resetServiceForm();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Service
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-xl">&times;</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Services</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.open}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Proposals</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.myProposals}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-100">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.completed}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-100">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'all'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setActiveTab('my-services')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'my-services'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              My Services
            </button>
            <button
              onClick={() => setActiveTab('my-proposals')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'my-proposals'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              My Proposals
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="text"
              placeholder="Category..."
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Min Budget"
              value={filters.minBudget}
              onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input
              type="number"
              placeholder="Max Budget"
              value={filters.maxBudget}
              onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new service request.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                <span className={`px-2 py-1 text-xs rounded font-medium ${
                  service.status === 'open' ? 'bg-green-100 text-green-800' :
                  service.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  service.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {service.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
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
                {isMyService(service) && (
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                    My Service
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>

              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500">Budget</p>
                  <p className="text-2xl font-bold text-green-600">
                    {service.currency} {service.budget.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Proposals</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {service._count?.proposals || 0}
                  </p>
                </div>
              </div>

              {service.rating && (
                <div className="flex items-center mb-3">
                  <span className="text-yellow-500 text-lg">
                    {'★'.repeat(Math.round(service.rating))}
                  </span>
                  <span className="text-gray-400 text-lg ml-1">
                    {'★'.repeat(5 - Math.round(service.rating))}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({service.rating.toFixed(1)})
                  </span>
                </div>
              )}

              {service.acceptedById && (
                <div className="mb-3 p-2 bg-blue-50 rounded">
                  <p className="text-xs text-blue-800">
                    <span className="font-medium">Provider:</span> {service.acceptedByType}
                  </p>
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => handleViewDetails(service)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition"
                >
                  View Details
                </button>
                {service.status === 'open' && !isMyService(service) && (
                  <button
                    onClick={() => {
                      selectService(service);
                      setShowProposalModal(true);
                    }}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition"
                  >
                    Propose
                  </button>
                )}
                {service.status === 'open' && isMyService(service) && (service._count?.proposals || 0) > 0 && (
                  <button
                    onClick={() => handleManageProposals(service)}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition"
                  >
                    Proposals ({service._count?.proposals})
                  </button>
                )}
                {service.status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteService(service.id)}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition"
                  >
                    Complete
                  </button>
                )}
                {service.status === 'completed' && !service.rating && isMyService(service) && (
                  <button
                    onClick={() => {
                      selectService(service);
                      setShowRatingModal(true);
                    }}
                    className="flex-1 bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700 transition"
                  >
                    Rate
                  </button>
                )}
              </div>

              {isMyService(service) && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditService(service)}
                    className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteService(service.id)}
                    className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              )}
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
                    placeholder="e.g., IT Support, Legal, Marketing"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Budget</label>
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
                    <label className="block text-sm font-medium mb-1">Currency</label>
                    <select
                      value={serviceForm.currency}
                      onChange={(e) => setServiceForm({ ...serviceForm, currency: e.target.value })}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="BRL">BRL (R$)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Who can fulfill this service?</label>
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

      {/* Submit Proposal Modal */}
      {showProposalModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Submit Proposal for {selectedService.title}</h2>
            <div className="bg-green-50 border border-green-200 p-3 rounded mb-4">
              <p className="font-semibold text-green-900">Budget: {selectedService.currency} {selectedService.budget.toFixed(2)}</p>
              <p className="text-sm text-green-700">This is a fixed price. No negotiation.</p>
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
                    rows={6}
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
                    placeholder="How many days will it take?"
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

      {/* Manage Proposals Modal */}
      {showProposalsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Manage Proposals: {selectedService.title}</h2>

            <div className="mb-4 p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-900">
                <strong>Budget:</strong> {selectedService.currency} {selectedService.budget.toFixed(2)}
              </p>
              <p className="text-sm text-blue-900">
                <strong>Status:</strong> {selectedService.status}
              </p>
            </div>

            {proposals && proposals.length > 0 ? (
              <div className="space-y-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-lg">{proposal.proposer?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{proposal.proposer?.email || ''}</p>
                        <span className={`inline-block mt-1 px-2 py-1 text-xs rounded font-medium ${
                          proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {proposal.status}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Type</p>
                        <p className="font-medium capitalize">{proposal.proposerType}</p>
                      </div>
                    </div>

                    {proposal.message && (
                      <div className="mb-3 p-3 bg-gray-50 rounded">
                        <p className="text-sm font-medium text-gray-700 mb-1">Message:</p>
                        <p className="text-sm text-gray-800">{proposal.message}</p>
                      </div>
                    )}

                    {proposal.estimatedDuration && (
                      <p className="text-sm text-gray-600 mb-3">
                        <strong>Estimated Duration:</strong> {proposal.estimatedDuration} days
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Submitted: {new Date(proposal.createdAt).toLocaleDateString()}
                    </p>

                    {proposal.status === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleAcceptProposal(proposal.id)}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Accept Proposal
                        </button>
                        <button
                          onClick={() => handleRejectProposal(proposal.id)}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {proposal.status === 'rejected' && proposal.rejectionReason && (
                      <div className="mt-3 p-2 bg-red-50 rounded">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {proposal.rejectionReason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No proposals yet.</p>
              </div>
            )}

            <button
              onClick={() => setShowProposalsModal(false)}
              className="mt-6 w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Rate Service Modal */}
      {showRatingModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Rate Service</h2>
            <p className="text-gray-600 mb-4">{selectedService.title}</p>
            <form onSubmit={handleRateService}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingForm({ ...ratingForm, rating: star })}
                        className={`text-4xl transition ${
                          star <= ratingForm.rating ? 'text-yellow-500' : 'text-gray-300'
                        } hover:text-yellow-400`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {ratingForm.rating === 1 && 'Poor'}
                    {ratingForm.rating === 2 && 'Fair'}
                    {ratingForm.rating === 3 && 'Good'}
                    {ratingForm.rating === 4 && 'Very Good'}
                    {ratingForm.rating === 5 && 'Excellent'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Feedback (Optional)</label>
                  <textarea
                    value={ratingForm.feedback}
                    onChange={(e) => setRatingForm({ ...ratingForm, feedback: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    placeholder="Share your experience..."
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

      {/* Service Details Modal */}
      {showDetailsModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedService.title}</h2>

            <div className="space-y-4">
              <div>
                <span className={`px-3 py-1 text-sm rounded font-medium ${
                  selectedService.status === 'open' ? 'bg-green-100 text-green-800' :
                  selectedService.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  selectedService.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedService.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedService.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <p className="text-gray-700">{selectedService.category}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Budget</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedService.currency} {selectedService.budget.toFixed(2)}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Eligible Providers</h3>
                <div className="flex gap-2">
                  {selectedService.allowCompanies && (
                    <span className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded">
                      Companies
                    </span>
                  )}
                  {selectedService.allowIndividuals && (
                    <span className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded">
                      Individuals
                    </span>
                  )}
                </div>
              </div>

              {selectedService.acceptedById && (
                <div className="p-4 bg-blue-50 rounded">
                  <h3 className="font-semibold mb-2">Provider Information</h3>
                  <p className="text-sm text-blue-900">
                    <strong>Type:</strong> {selectedService.acceptedByType}
                  </p>
                </div>
              )}

              {selectedService.rating && (
                <div>
                  <h3 className="font-semibold mb-2">Rating</h3>
                  <div className="flex items-center">
                    <span className="text-yellow-500 text-2xl">
                      {'★'.repeat(Math.round(selectedService.rating))}
                    </span>
                    <span className="text-gray-400 text-2xl ml-1">
                      {'★'.repeat(5 - Math.round(selectedService.rating))}
                    </span>
                    <span className="ml-2 text-lg text-gray-700">
                      ({selectedService.rating.toFixed(1)})
                    </span>
                  </div>
                  {selectedService.clientFeedback && (
                    <p className="mt-2 text-gray-700 italic">"{selectedService.clientFeedback}"</p>
                  )}
                </div>
              )}

              {selectedService.completionNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Completion Notes</h3>
                  <p className="text-gray-700">{selectedService.completionNotes}</p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>Created: {new Date(selectedService.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedService.updatedAt).toLocaleString()}</p>
                {selectedService.completedAt && (
                  <p>Completed: {new Date(selectedService.completedAt).toLocaleString()}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              {selectedService.status === 'open' && !isMyService(selectedService) && (
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowProposalModal(true);
                  }}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Proposal
                </button>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
