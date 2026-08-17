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
  Sparkles,
  Layers,
  Activity,
  FolderGit2,
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
        name: 'C Standard (GCC)',
        icon: Cpu,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/30',
        badge: 'C17 (GCC)',
      };
    case 'cpp':
      return {
        name: 'C++ Systems (G++)',
        icon: Cpu,
        color: 'text-indigo-400',
        bg: 'bg-indigo-500/10 border-indigo-500/30',
        badge: 'C++20',
      };
    case 'react':
      return {
        name: 'React + Vite',
        icon: Atom,
        color: 'text-sky-400',
        bg: 'bg-sky-500/10 border-sky-500/30',
        badge: 'React',
      };
    case 'nodejs':
      return {
        name: 'Node.js',
        icon: Server,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        badge: 'Node.js',
      };
    case 'python':
      return {
        name: 'Python 3',
        icon: Terminal,
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/30',
        badge: 'Python',
      };
    case 'go':
      return {
        name: 'Go',
        icon: Zap,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/30',
        badge: 'Go',
      };
    default:
      return {
        name: 'Blank Canvas',
        icon: FileCode,
        color: 'text-slate-300',
        bg: 'bg-slate-500/10 border-slate-500/30',
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

  // Metrics calculations
  const ownedCount = projects.filter((p) => p.owner?.id === user?.id || p.userRole === 'owner').length;
  const sharedCount = projects.filter((p) => p.owner?.id !== user?.id && p.userRole !== 'owner').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Greetings */}
      <div className="relative rounded-2xl border border-surface-50 bg-gradient-to-r from-surface-200/90 via-surface-200/50 to-surface-300/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 radial-gold-glow pointer-events-none -z-10" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-xs font-mono font-medium text-gold-300 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Cloud IDE Development Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Welcome back, <span className="gold-gradient-text">{user?.name || 'Developer'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Access your collaborative workspaces, manage shared team repositories, and launch realtime paired IDE sessions.
            </p>
          </div>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-400 px-5 py-3 text-sm font-semibold text-background shadow-lg hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Workspace</span>
          </button>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-surface-50/60 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-100 border border-surface-50 text-gold-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-slate-400">Total Workspaces</div>
              <div className="text-base font-bold text-white">{total}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-100 border border-surface-50 text-sky-400">
              <FolderGit2 className="h-4 w-4" />
            </div>
            <div>
              <div className="text-slate-400">Owned by You</div>
              <div className="text-base font-bold text-white">{ownedCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-100 border border-surface-50 text-emerald-400">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-slate-400">Collaborations</div>
              <div className="text-base font-bold text-white">{sharedCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface-100 border border-surface-50 text-purple-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="text-slate-400">CRDT Engine</div>
              <div className="text-base font-bold text-emerald-400">Online</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Filter & Controls Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl border border-surface-50 bg-surface-200/80 backdrop-blur-md">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-surface-50 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Workspaces
          </button>
          <button
            onClick={() => setFilter('owned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'owned'
                ? 'bg-surface-50 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Created by Me
          </button>
          <button
            onClick={() => setFilter('shared')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'shared'
                ? 'bg-surface-50 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Shared with Me
          </button>
        </div>

        {/* Search, Sort & View Mode */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Input */}
          <div className="relative min-w-[240px] flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search workspaces or tags..."
              className="w-full rounded-xl border border-surface-50 bg-surface-200/80 pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-xl border border-surface-50 bg-surface-200/80 px-3 py-1.5 text-xs text-white focus:border-gold-400 focus:outline-none cursor-pointer"
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Recently Created</option>
            <option value="name">Alphabetical</option>
          </select>

          {/* Grid / List Toggle */}
          <div className="flex items-center rounded-xl border border-surface-50 bg-surface-200/80 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-surface-50 text-gold-300' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-surface-50 text-gold-300' : 'text-slate-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid / List View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-6 border border-surface-50/60 animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-xl bg-surface-100" />
                <div className="h-5 w-16 rounded bg-surface-100" />
              </div>
              <div className="space-y-2">
                <div className="h-5 w-3/4 rounded bg-surface-100" />
                <div className="h-3.5 w-full rounded bg-surface-100" />
              </div>
              <div className="h-8 w-full rounded-lg bg-surface-100 pt-4" />
            </div>
          ))}
        </div>
      ) : projects.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-surface-50 bg-surface-200/40 p-12 text-center backdrop-blur-xl">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-100 border border-gold-400/30 text-gold-300 shadow-gold-sm mb-4">
            <Code2 className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-white">No Workspaces Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No workspaces matching "${searchQuery}". Try clearing your search query.`
              : 'Create your first collaborative cloud workspace to start coding in real time with AI.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="rounded-lg bg-surface-100 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Clear Search
              </button>
            )}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2 text-xs font-semibold text-background shadow-md hover:shadow-gold-glow transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Workspace</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const meta = getTemplateMeta(project.template);
            const Icon = meta.icon;
            const isOwner = project.owner?.id === user?.id || project.userRole === 'owner';
            const isMenuOpen = activeMenuId === project.id;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/workspace/${project.id}`)}
                className="group relative glass-card rounded-2xl p-5 border border-surface-50/80 hover:border-gold-400/50 transition-all duration-300 hover:shadow-gold-glow hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${meta.bg} ${meta.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-gold-200 transition-colors truncate max-w-[160px]">
                            {project.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 mt-0.5">
                          {project.visibility === 'public' ? (
                            <span className="flex items-center gap-1 text-sky-400">
                              <Globe className="h-3 w-3" /> Public
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Lock className="h-3 w-3" /> Private
                            </span>
                          )}
                          <span>•</span>
                          <span className="text-gold-300/90">{meta.badge}</span>
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
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-surface-100 hover:text-white transition-colors"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {isMenuOpen && (
                        <div className="absolute right-0 top-8 w-44 rounded-xl border border-surface-50 bg-surface-200/95 backdrop-blur-xl shadow-2xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              setSelectedProjectForMembers(project);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:bg-surface-100 hover:text-white"
                          >
                            <Users className="h-3.5 w-3.5 text-sky-400" />
                            <span>Manage Members</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                              setSelectedProjectForSettings(project);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:bg-surface-100 hover:text-white"
                          >
                            <Settings className="h-3.5 w-3.5 text-gold-400" />
                            <span>Settings</span>
                          </button>
                          <button
                            onClick={(e) => handleClone(project, e)}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:bg-surface-100 hover:text-white"
                          >
                            <Copy className="h-3.5 w-3.5 text-purple-400" />
                            <span>Duplicate Copy</span>
                          </button>
                          {isOwner && (
                            <div className="border-t border-surface-50/60 mt-1 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  setSelectedProjectForDelete(project);
                                }}
                                className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-400 hover:bg-rose-950/30"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Delete Workspace</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                    {project.description || 'No description provided for this cloud workspace.'}
                  </p>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-surface-100 px-2 py-0.5 text-[10px] font-mono text-slate-300 border border-surface-50"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-surface-50/60 flex items-center justify-between text-xs">
                  {/* Collaborators Stacks */}
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      {(project.members || []).slice(0, 3).map((m, idx) => (
                        <img
                          key={idx}
                          src={
                            m.user?.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${m.user?.username || idx}`
                          }
                          alt="avatar"
                          className="inline-block h-6 w-6 rounded-full ring-2 ring-background bg-surface-200 object-cover"
                          title={m.user?.name}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {project.memberCount || (project.members || []).length} {project.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List Layout */
        <div className="divide-y divide-surface-50/60 rounded-2xl border border-surface-50 bg-surface-200/40 backdrop-blur-xl overflow-hidden">
          {projects.map((project) => {
            const meta = getTemplateMeta(project.template);
            const Icon = meta.icon;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/workspace/${project.id}`)}
                className="flex items-center justify-between p-4 sm:p-5 hover:bg-surface-200/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`p-2.5 rounded-xl border ${meta.bg} ${meta.color} shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{project.name}</span>
                      <span className="text-[10px] font-mono rounded bg-gold-400/10 px-1.5 py-0.5 text-gold-300 border border-gold-400/20">
                        {meta.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProjectForMembers(project);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:bg-surface-100 hover:text-white transition-colors"
                      title="Collaborators"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/workspace/${project.id}`);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    >
                      <span>Open</span>
                      <ExternalLink className="h-3 w-3" />
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
