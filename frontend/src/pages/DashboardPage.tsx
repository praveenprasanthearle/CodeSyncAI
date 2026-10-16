import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Users,
  Code2,
  Lock,
  Globe,
  Clock,
  MoreVertical,
  Trash2,
  Settings,
  Copy,
  ExternalLink,
  Atom,
  Server,
  Terminal,
  Cpu,
  Zap,
  FileCode,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { IProject, ProjectTemplate } from '../types';
import { CreateProjectModal } from '../components/dashboard/CreateProjectModal';
import { ProjectMembersModal } from '../components/dashboard/ProjectMembersModal';
import { ProjectSettingsModal } from '../components/dashboard/ProjectSettingsModal';
import { DeleteConfirmModal } from '../components/dashboard/DeleteConfirmModal';

const getTemplateMeta = (template: ProjectTemplate) => {
  switch (template) {
    case 'c':
      return {
        name: 'C (GCC)',
        icon: Cpu,
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-100',
        badge: 'C17',
      };
    case 'cpp':
      return {
        name: 'C++ (G++)',
        icon: Cpu,
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 border-indigo-100',
        badge: 'C++20',
      };
    case 'react':
      return {
        name: 'React',
        icon: Atom,
        color: 'text-sky-600',
        bg: 'bg-sky-50 border-sky-100',
        badge: 'React',
      };
    case 'nodejs':
      return {
        name: 'Node.js',
        icon: Server,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 border-emerald-100',
        badge: 'Node.js',
      };
    case 'python':
      return {
        name: 'Python',
        icon: Terminal,
        color: 'text-amber-600',
        bg: 'bg-amber-50 border-amber-100',
        badge: 'Python',
      };
    case 'go':
      return {
        name: 'Go',
        icon: Zap,
        color: 'text-cyan-600',
        bg: 'bg-cyan-50 border-cyan-100',
        badge: 'Go',
      };
    default:
      return {
        name: 'Blank',
        icon: FileCode,
        color: 'text-slate-600',
        bg: 'bg-slate-50 border-slate-200',
        badge: 'Blank',
      };
  }
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    projects,
    total,
    isLoading,
    searchQuery,
    filter,
    sort,
    fetchProjects,
    setFilter,
    setSearchQuery,
    setSort,
    cloneProject,
  } = useProjectStore();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProjectForMembers, setSelectedProjectForMembers] = useState<IProject | null>(null);
  const [selectedProjectForSettings, setSelectedProjectForSettings] = useState<IProject | null>(null);
  const [selectedProjectForDelete, setSelectedProjectForDelete] = useState<IProject | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Close context menu on window click
  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  const handleCreateSuccess = (projectId: string) => {
    setIsCreateOpen(false);
    navigate(`/workspace/${projectId}`);
  };

  const handleClone = async (project: IProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(null);
    try {
      const cloned = await cloneProject(project.id);
      navigate(`/workspace/${cloned.id}`);
    } catch (_err) {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Projects</h1>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
              {total}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New project</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Sorting & View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-1 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-md">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === 'all'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('owned')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === 'owned'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Created by me
          </button>
          <button
            onClick={() => setFilter('shared')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filter === 'shared'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Shared
          </button>
        </div>

        {/* Search, Sort & View Mode */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects or tags..."
              className="w-full rounded-lg border border-slate-200 bg-white/90 pl-8 pr-3.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 transition-colors"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1.5 text-xs text-slate-700 focus:border-blue-600 focus:outline-none cursor-pointer"
          >
            <option value="updatedAt">Updated</option>
            <option value="createdAt">Created</option>
            <option value="name">Name</option>
          </select>

          <div className="flex items-center rounded-lg border border-slate-200 bg-white/90 p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-card rounded-xl p-5 border border-slate-200/80 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-slate-200" />
                <div className="h-4 w-14 rounded bg-slate-200" />
              </div>
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white/70 p-10 text-center backdrop-blur-md">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 mb-2.5">
            <Code2 className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            {searchQuery ? 'No matching projects' : 'No projects yet'}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xs mx-auto">
            {searchQuery
              ? `No projects found for "${searchQuery}".`
              : 'Create a project to start coding.'}
          </p>
          <div className="mt-3.5 flex items-center justify-center gap-2">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Clear search
              </button>
            )}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New project</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {projects.map((project) => {
            const meta = getTemplateMeta(project.template);
            const Icon = meta.icon;
            const isOwner = project.owner?.id === user?.id || project.userRole === 'owner';
            const isMenuOpen = activeMenuId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/workspace/${project.id}`)}
                className="group relative glass-card rounded-xl p-4 border border-slate-200/90 hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2.5 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${meta.bg} ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate max-w-[170px]">
                          {project.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                          {project.visibility === 'public' ? (
                            <span className="flex items-center gap-1 text-sky-600">
                              <Globe className="h-3 w-3" /> Public
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Lock className="h-3 w-3" /> Private
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-slate-600">{meta.badge}</span>
                        </div>
                      </div>
                    </div>

                    {/* Context Menu Button */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : project.id);
                        }}
                        className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-7 w-40 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-glass-dropdown py-1 z-30 animate-in fade-in duration-100 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              setSelectedProjectForMembers(project);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            <Users className="h-3.5 w-3.5 text-slate-500" />
                            <span>Members</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              setSelectedProjectForSettings(project);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            <Settings className="h-3.5 w-3.5 text-slate-500" />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={(e) => handleClone(project, e)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            <span>Duplicate</span>
                          </button>
                          {isOwner && (
                            <div className="border-t border-slate-100 mt-1 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  setSelectedProjectForDelete(project);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 hover:bg-rose-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-mono text-slate-600 border border-slate-200/60"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {(project.members || []).slice(0, 3).map((m, idx) => (
                        <img
                          key={idx}
                          src={
                            m.user?.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${m.user?.username || idx}`
                          }
                          alt="avatar"
                          className="inline-block h-5 w-5 rounded-full ring-2 ring-white bg-slate-100 object-cover"
                          title={m.user?.name}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {project.memberCount || (project.members || []).length}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/90 bg-white/80 backdrop-blur-md overflow-hidden shadow-xs">
          {projects.map((project) => {
            const meta = getTemplateMeta(project.template);
            const Icon = meta.icon;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/workspace/${project.id}`)}
                className="flex items-center justify-between p-3.5 sm:p-4 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg border ${meta.bg} ${meta.color} shrink-0`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">{project.name}</span>
                      <span className="text-[10px] font-mono rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 border border-slate-200">
                        {meta.badge}
                      </span>
                    </div>
                    {project.description && (
                      <p className="text-[11px] text-slate-500 truncate max-w-md mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="hidden md:flex items-center gap-1 text-xs font-mono text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectForMembers(project);
                      }}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      title="Members"
                    >
                      <Users className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/${project.id}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-800 transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3 w-3 text-slate-500" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ProjectMembersModal
        isOpen={!!selectedProjectForMembers}
        project={selectedProjectForMembers}
        onClose={() => setSelectedProjectForMembers(null)}
      />

      <ProjectSettingsModal
        isOpen={!!selectedProjectForSettings}
        project={selectedProjectForSettings}
        onClose={() => setSelectedProjectForSettings(null)}
      />

      <DeleteConfirmModal
        isOpen={!!selectedProjectForDelete}
        project={selectedProjectForDelete}
        onClose={() => setSelectedProjectForDelete(null)}
      />
    </div>
  );
};
