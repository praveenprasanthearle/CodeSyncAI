export interface IUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export type ProjectTemplate = 'c' | 'cpp' | 'blank' | 'react' | 'nodejs' | 'python' | 'go';
export type ProjectVisibility = 'public' | 'private';
export type ProjectRole = 'owner' | 'editor' | 'viewer';

export type ExtensionCategory = 'Core Compilers' | 'Languages' | 'Runtimes' | 'Toolchains' | 'Linters & Tools';

export interface IExtension {
  id: string;
  name: string;
  language: string;
  version: string;
  category: ExtensionCategory;
  description: string;
  isBuiltIn: boolean; // true for C and C++ default compilers
  author: string;
  downloads: string;
  rating: number;
  fileExtensions: string[];
  iconType: 'c' | 'cpp' | 'python' | 'javascript' | 'typescript' | 'go' | 'rust' | 'java' | 'web';
  badge?: string;
  features: string[];
}

export interface IProjectMember {
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  role: ProjectRole;
  joinedAt: string;
}

export interface IProject {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    name: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
  visibility: ProjectVisibility;
  template: ProjectTemplate;
  tags: string[];
  memberCount: number;
  members?: IProjectMember[];
  userRole?: ProjectRole;
  isArchived?: boolean;
  fileCount?: number;
  lastActivityAt?: string;
  updatedAt: string;
  createdAt: string;
}

export interface IFileNode {
  id: string;
  projectId: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentId?: string | null;
  content?: string;
  language?: string;
  children?: IFileNode[];
  updatedAt: string;
}

export interface ICollaboratorCursor {
  userId: string;
  username: string;
  color: string;
  fileId?: string;
  line: number;
  column: number;
}

export interface IChatMessage {
  id: string;
  projectId: string;
  sender: {
    id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  content: string;
  type: 'text' | 'code' | 'system';
  createdAt: string;
}

export interface IExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedMb?: number;
  status: 'success' | 'error' | 'timeout';
}
