// web/src/pages/JobsPage.tsx
import React, { useEffect, useState } from 'react';
import { useJobsStore } from '../store/jobsStore';
import type { CreateJob } from '../types/jobs';

export const JobsPage: React.FC = () => {
  const {
    jobs,
    selectedJob,
    applications,
    suggestions,
    isLoading,
    error,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    applyToJob,
    markInterest,
    fetchApplications,
    fetchSuggestions,
    selectJob,
    clearError,
  } = useJobsStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    isSpecialized: undefined as boolean | undefined,
    search: '',
  });

  // Form states
  const [jobForm, setJobForm] = useState<CreateJob>({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    types: [],
    isSpecialized: false,
    status: 'draft',
    vacancies: 1,
  });

  const [applicationForm, setApplicationForm] = useState({
    coverLetter: '',
    resume: null as any,
    documents: null as any,
  });

  useEffect(() => {
    fetchJobs(filters);
  }, [filters]);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createJob(jobForm);
      setShowCreateModal(false);
      resetJobForm();
      fetchJobs(filters);
    } catch (err) {
      console.error('Failed to create job:', err);
    }
  };

  const handleUpdateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await updateJob(selectedJob.id, jobForm);
      setShowCreateModal(false);
      resetJobForm();
      fetchJobs(filters);
    } catch (err) {
      console.error('Failed to update job:', err);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await deleteJob(id);
      fetchJobs(filters);
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleApplyToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    try {
      await applyToJob(selectedJob.id, applicationForm);
      setShowApplyModal(false);
      resetApplicationForm();
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Failed to apply to job:', err);
    }
  };

  const handleMarkInterest = async (jobId: string) => {
    try {
      await markInterest(jobId, { notifyOnChanges: true });
      alert('Interest marked successfully!');
    } catch (err) {
      console.error('Failed to mark interest:', err);
    }
  };

  const handleViewDetails = async (job: any) => {
    selectJob(job);
    setShowDetailsModal(true);
    if (job.id) {
      fetchApplications(job.id);
      fetchSuggestions(job.id);
    }
  };

  const handleEditJob = (job: any) => {
    selectJob(job);
    setJobForm({
      title: job.title,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      types: job.types || [],
      isSpecialized: job.isSpecialized,
      status: job.status,
      vacancies: job.vacancies,
    });
    setShowCreateModal(true);
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      types: [],
      isSpecialized: false,
      status: 'draft',
      vacancies: 1,
    });
    selectJob(null);
  };

  const resetApplicationForm = () => {
    setApplicationForm({
      coverLetter: '',
      resume: null,
      documents: null,
    });
  };

  const toggleJobType = (type: string) => {
    setJobForm((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  return (
    <div className="jobs-page p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Jobs & Opportunities</h1>
        <button
          onClick={() => {
            resetJobForm();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Create Job
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
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
            <option value="closed">Closed</option>
            <option value="filled">Filled</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Types</option>
            <option value="public">Public</option>
            <option value="internal">Internal</option>
            <option value="partners">Partners</option>
          </select>
          <select
            value={filters.isSpecialized === undefined ? '' : String(filters.isSpecialized)}
            onChange={(e) => setFilters({
              ...filters,
              isSpecialized: e.target.value === '' ? undefined : e.target.value === 'true',
            })}
            className="border rounded px-3 py-2"
          >
            <option value="">All Models</option>
            <option value="true">Specialized</option>
            <option value="false">Non-Specialized</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold">{job.title}</h3>
                <span className={`px-2 py-1 text-xs rounded ${
                  job.status === 'open' ? 'bg-green-100 text-green-800' :
                  job.status === 'filled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {job.types.map((type) => (
                  <span key={type} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                    {type}
                  </span>
                ))}
                {job.isSpecialized && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                    Specialized
                  </span>
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{job.description}</p>

              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>{job.vacancies} vacancies</span>
                <span>{job._count?.applications || 0} applications</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(job)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                >
                  View Details
                </button>
                <button
                  onClick={() => {
                    selectJob(job);
                    setShowApplyModal(true);
                  }}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700"
                >
                  Apply
                </button>
                <button
                  onClick={() => handleMarkInterest(job.id)}
                  className="bg-yellow-600 text-white px-3 py-2 rounded text-sm hover:bg-yellow-700"
                >
                  ★
                </button>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEditJob(job)}
                  className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteJob(job.id)}
                  className="flex-1 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {selectedJob ? 'Edit Job' : 'Create New Job'}
            </h2>
            <form onSubmit={selectedJob ? handleUpdateJob : handleCreateJob}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={4}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Requirements</label>
                  <textarea
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Job Types</label>
                  <div className="flex gap-4">
                    {['public', 'internal', 'partners'].map((type) => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={jobForm.types.includes(type)}
                          onChange={() => toggleJobType(type)}
                          className="mr-2"
                        />
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={jobForm.isSpecialized}
                      onChange={(e) => setJobForm({ ...jobForm, isSpecialized: e.target.checked })}
                      className="mr-2"
                    />
                    Specialized (requires technical proof)
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Vacancies</label>
                  <input
                    type="number"
                    value={jobForm.vacancies}
                    onChange={(e) => setJobForm({ ...jobForm, vacancies: Number(e.target.value) })}
                    className="w-full border rounded px-3 py-2"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={jobForm.status}
                    onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {selectedJob ? 'Update Job' : 'Create Job'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetJobForm();
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

      {/* Apply Modal */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-4">Apply to {selectedJob.title}</h2>
            <form onSubmit={handleApplyToJob}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cover Letter</label>
                  <textarea
                    value={applicationForm.coverLetter}
                    onChange={(e) => setApplicationForm({ ...applicationForm, coverLetter: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                    rows={6}
                    placeholder="Tell us why you're interested in this position..."
                  />
                </div>

                {selectedJob.isSpecialized && (
                  <div>
                    <label className="block text-sm font-medium mb-1 text-yellow-700">
                      Required Documents (for specialized positions)
                    </label>
                    <p className="text-sm text-gray-600 mb-2">
                      Please upload your diplomas, certificates, or other required documentation
                    </p>
                    <input
                      type="file"
                      multiple
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Submit Application
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowApplyModal(false);
                    resetApplicationForm();
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
      {showDetailsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{selectedJob.title}</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedJob.description}</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <p className="text-gray-700">{selectedJob.requirements}</p>
              </div>

              {suggestions && suggestions.skillGaps && (
                <div className="bg-blue-50 p-4 rounded">
                  <h3 className="font-semibold mb-2">Learning Suggestions</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    Based on your profile, here are suggested Zettels to help you prepare for this position
                  </p>
                  {/* Display suggestions here */}
                </div>
              )}

              {applications && applications.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Applications ({applications.length})</h3>
                  <div className="space-y-2">
                    {applications.map((app) => (
                      <div key={app.id} className="border rounded p-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{app.user?.name}</span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            app.status === 'approved' ? 'bg-green-100 text-green-800' :
                            app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status}
                          </span>
                        </div>
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

export default JobsPage;
