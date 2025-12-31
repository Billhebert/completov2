// web/src/store/jobsStore.ts
import { create } from 'zustand';
import type {
  Job,
  JobApplication,
  JobInterest,
  JobZettelSuggestion,
  CreateJob,
} from '../types/jobs';
import api from '../services/api';

interface JobsState {
  // State
  jobs: Job[];
  selectedJob: Job | null;
  applications: JobApplication[];
  suggestions: JobZettelSuggestion | null;
  isLoading: boolean;
  error: string | null;

  // Actions - Jobs
  fetchJobs: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    isSpecialized?: boolean;
    search?: string;
  }) => Promise<void>;
  getJob: (id: string) => Promise<Job>;
  createJob: (data: CreateJob) => Promise<Job>;
  updateJob: (id: string, data: Partial<CreateJob>) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  selectJob: (job: Job | null) => void;

  // Actions - Applications
  applyToJob: (jobId: string, data: {
    coverLetter?: string;
    resume?: any;
    documents?: any;
  }) => Promise<JobApplication>;
  fetchApplications: (jobId: string) => Promise<void>;
  updateApplication: (applicationId: string, data: {
    status?: string;
    internalNotes?: string;
    feedback?: string;
    rating?: number;
  }) => Promise<JobApplication>;

  // Actions - Interest & Suggestions
  markInterest: (jobId: string, data: {
    reason?: string;
    notifyOnChanges?: boolean;
  }) => Promise<JobInterest>;
  fetchSuggestions: (jobId: string) => Promise<void>;

  clearError: () => void;
}

export const useJobsStore = create<JobsState>((set) => ({
  // Initial state
  jobs: [],
  selectedJob: null,
  applications: [],
  suggestions: null,
  isLoading: false,
  error: null,

  // Jobs actions
  fetchJobs: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getJobs(params);
      set({ jobs: response.data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  getJob: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const job = await api.getJob(id);
      set({ isLoading: false });
      return job;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createJob: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const job = await api.createJob(data);
      set((state) => ({
        jobs: [...state.jobs, job],
        isLoading: false,
      }));
      return job;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateJob: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const job = await api.updateJob(id, data);
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? job : j)),
        isLoading: false,
      }));
      return job;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteJob: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteJob(id);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        selectedJob: state.selectedJob?.id === id ? null : state.selectedJob,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectJob: (job) => {
    set({ selectedJob: job });
  },

  // Applications actions
  applyToJob: async (jobId, data) => {
    set({ isLoading: true, error: null });
    try {
      const application = await api.applyToJob(jobId, data);
      set({ isLoading: false });
      return application;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchApplications: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      const applications = await api.getJobApplications(jobId);
      set({ applications, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateApplication: async (applicationId, data) => {
    set({ isLoading: true, error: null });
    try {
      const application = await api.updateJobApplication(applicationId, data);
      set((state) => ({
        applications: state.applications.map((a) => (a.id === applicationId ? application : a)),
        isLoading: false,
      }));
      return application;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Interest & Suggestions actions
  markInterest: async (jobId, data) => {
    set({ isLoading: true, error: null });
    try {
      const interest = await api.markJobInterest(jobId, data);
      set({ isLoading: false });
      return interest;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  fetchSuggestions: async (jobId) => {
    set({ isLoading: true, error: null });
    try {
      const suggestions = await api.getJobSuggestions(jobId);
      set({ suggestions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
