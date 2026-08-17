import { create } from 'zustand';
import { IProject } from '../types';
import { apiClient } from '../api/client';

interface ProjectState {
  projects: IProject[];
  currentProject: IProject | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  total: number;
  page: number;
  searchQuery: string;
  filter: 'all' | 'owned' | 'shared';
  sort: 'updatedAt' | 'createdAt' | 'name';

  // Actions
  fetchProjects: () => Promise<void>;
  getProject: (id: string) => Promise<IProject | null>;
  createProject: (data: {
    name: string;
    description?: string;
    template: string;
    visibility: string;
    tags?: string[];
  }) => Promise<IProject>;
  updateProject: (
    id: string,
    data: {
      name?: string;
      description?: string;
      visibility?: string;
      tags?: string[];
    }
  ) => Promise<IProject>;
  deleteProject: (id: string) => Promise<void>;
  addMember: (projectId: string, emailOrUsername: string, role: string) => Promise<IProject>;
  removeMember: (projectId: string, userId: string) => Promise<IProject>;
  updateMemberRole: (projectId: string, userId: string, role: string) => Promise<IProject>;
  cloneProject: (projectId: string) => Promise<IProject>;

  // Filters & State setters
  setFilter: (filter: 'all' | 'owned' | 'shared') => void;
  setSearchQuery: (query: string) => void;
  setSort: (sort: 'updatedAt' | 'createdAt' | 'name') => void;
  setCurrentProject: (project: IProject | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  total: 0,
  page: 1,
  searchQuery: '',
  filter: 'all',
  sort: 'updatedAt',

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { filter, searchQuery, sort } = get();
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sort) params.append('sort', sort);

      const response: any = await apiClient.get(`/projects?${params.toString()}`);
      if (response?.data?.projects) {
        set({
          projects: response.data.projects,
          total: response.data.total || response.data.projects.length,
          page: response.data.page || 1,
        });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to load projects' });
    } finally {
      set({ isLoading: false });
    }
  },

  getProject: async (id: string) => {
    try {
      const response: any = await apiClient.get(`/projects/${id}`);
      if (response?.data?.project) {
        set({ currentProject: response.data.project });
        return response.data.project;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message || 'Failed to load project details' });
      return null;
    }
  },

  createProject: async (data) => {
    set({ isActionLoading: true, error: null });
    try {
      const response: any = await apiClient.post('/projects', data);
      const newProject = response.data.project;
      set((state) => ({
        projects: [newProject, ...state.projects],
        total: state.total + 1,
      }));
      return newProject;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create project' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  updateProject: async (id, data) => {
    set({ isActionLoading: true, error: null });
    try {
      const response: any = await apiClient.put(`/projects/${id}`, data);
      const updated = response.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? updated : p)),
        currentProject: state.currentProject?.id === id ? updated : state.currentProject,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update project' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteProject: async (id) => {
    set({ isActionLoading: true, error: null });
    try {
      await apiClient.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        total: Math.max(0, state.total - 1),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete project' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  addMember: async (projectId, emailOrUsername, role) => {
    set({ isActionLoading: true, error: null });
    try {
      const response: any = await apiClient.post(`/projects/${projectId}/members`, {
        emailOrUsername,
        role,
      });
      const updated = response.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        currentProject: state.currentProject?.id === projectId ? updated : state.currentProject,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to invite collaborator' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  removeMember: async (projectId, userId) => {
    set({ isActionLoading: true, error: null });
    try {
      const response: any = await apiClient.delete(`/projects/${projectId}/members/${userId}`);
      const updated = response.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        currentProject: state.currentProject?.id === projectId ? updated : state.currentProject,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to remove collaborator' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  updateMemberRole: async (projectId, userId, role) => {
    set({ isActionLoading: true, error: null });
    try {
      const response: any = await apiClient.patch(`/projects/${projectId}/members/${userId}`, {
        role,
      });
      const updated = response.data.project;
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updated : p)),
        currentProject: state.currentProject?.id === projectId ? updated : state.currentProject,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message || 'Failed to update member role' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  cloneProject: async (projectId) => {
    set({ isActionLoading: true, error: null });
    try {
      const response: any = await apiClient.post(`/projects/${projectId}/clone`);
      const cloned = response.data.project;
      set((state) => ({
        projects: [cloned, ...state.projects],
        total: state.total + 1,
      }));
      return cloned;
    } catch (err: any) {
      set({ error: err.message || 'Failed to clone project' });
      throw err;
    } finally {
      set({ isActionLoading: false });
    }
  },

  setFilter: (filter) => {
    set({ filter });
    get().fetchProjects();
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    get().fetchProjects();
  },

  setSort: (sort) => {
    set({ sort });
    get().fetchProjects();
  },

  setCurrentProject: (currentProject) => set({ currentProject }),
  clearError: () => set({ error: null }),
}));
