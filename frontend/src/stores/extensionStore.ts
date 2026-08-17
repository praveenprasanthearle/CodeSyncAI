import { create } from 'zustand';
import { IExtension, ExtensionCategory } from '../types';

const STORAGE_KEY = 'codesync_installed_extensions_v1';

// Default built-in compilers: C and C++ are always installed and cannot be uninstalled
export const DEFAULT_BUILTIN_EXTENSIONS: string[] = ['c', 'cpp'];

export const AVAILABLE_EXTENSIONS: IExtension[] = [
  {
    id: 'c',
    name: 'C Language Toolchain (GCC)',
    language: 'c',
    version: 'GCC 13.2 / C17 Standard',
    category: 'Core Compilers',
    description: 'Default built-in compiler for C applications. Supports ISO C17, C11, stdio, POSIX standards, and custom Makefile compilation.',
    isBuiltIn: true,
    author: 'CodeSync Core System',
    downloads: '10M+',
    rating: 5.0,
    fileExtensions: ['.c', '.h'],
    iconType: 'c',
    badge: 'Default Built-in',
    features: [
      'ISO C17 / C11 Native Compilation',
      'GNU GCC & Clang Toolchain Support',
      'Zero-Latency Execution Sandbox',
      'Standard POSIX / LibC Included',
    ],
  },
  {
    id: 'cpp',
    name: 'C++ Modern Systems Compiler (G++)',
    language: 'cpp',
    version: 'G++ 13.2 / C++20 Standard',
    category: 'Core Compilers',
    description: 'Default built-in compiler for C++20 and modern systems programming. Supports STL algorithms, templates, and high-performance execution.',
    isBuiltIn: true,
    author: 'CodeSync Core System',
    downloads: '10M+',
    rating: 5.0,
    fileExtensions: ['.cpp', '.hpp', '.cc', '.cxx'],
    iconType: 'cpp',
    badge: 'Default Built-in',
    features: [
      'C++20 / C++17 Standard Support',
      'Full STL Containers & Algorithms',
      'Optimized Assembly Output',
      'Direct Stdin/Stdout Stream Piping',
    ],
  },
  {
    id: 'python',
    name: 'Python Language Pack & Runtime',
    language: 'python',
    version: 'v3.11+ CPython',
    category: 'Languages',
    description: 'Full Python interpreter and runtime environment with pip package support, unbuffered execution, and algorithmic sandbox.',
    isBuiltIn: false,
    author: 'Python Software Foundation / CodeSync',
    downloads: '8.2M',
    rating: 4.9,
    fileExtensions: ['.py', '.pyw'],
    iconType: 'python',
    badge: 'Popular Extension',
    features: [
      'Python 3.11+ REPL & Scripting',
      'Virtualenv & Pip Package Management',
      'Interactive Stdin I/O Sandbox',
      'NumPy & SciPy Compatible Engine',
    ],
  },
  {
    id: 'javascript',
    name: 'Node.js & JavaScript Runtime',
    language: 'javascript',
    version: 'v20.x LTS V8',
    category: 'Runtimes',
    description: 'High-performance JavaScript V8 runtime environment for server-side logic, Express microservices, and rapid scripting.',
    isBuiltIn: false,
    author: 'OpenJS Foundation / CodeSync',
    downloads: '9.5M',
    rating: 4.9,
    fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
    iconType: 'javascript',
    badge: 'Official Runtime',
    features: [
      'V8 Engine Execution Sandbox',
      'Modern ES2024 / CommonJS Syntax',
      'Asynchronous Event Loop Engine',
      'Full Node.js Standard Library',
    ],
  },
  {
    id: 'typescript',
    name: 'TypeScript Toolchain & Checker',
    language: 'typescript',
    version: 'v5.x TSC',
    category: 'Toolchains',
    description: 'Type-safe JavaScript superset compiler with instant static type checking, transpilation, and type definitions.',
    isBuiltIn: false,
    author: 'Microsoft / CodeSync',
    downloads: '7.1M',
    rating: 4.9,
    fileExtensions: ['.ts', '.tsx', '.d.ts'],
    iconType: 'typescript',
    badge: 'Essential',
    features: [
      'Strict Static Type Checking',
      'Zero-Config TSC Transpiler',
      'JSX / TSX React App Support',
      'Type Definition Resolution',
    ],
  },
  {
    id: 'go',
    name: 'Go Toolchain & Concurrent Engine',
    language: 'go',
    version: 'v1.22+ GC',
    category: 'Languages',
    description: 'Blazing-fast compiled language engine featuring lightweight goroutines, channels, and modular package management.',
    isBuiltIn: false,
    author: 'Google / CodeSync',
    downloads: '3.8M',
    rating: 4.8,
    fileExtensions: ['.go'],
    iconType: 'go',
    badge: 'Concurrent',
    features: [
      'Native Goroutine Concurrency',
      'Go Modules & Package Resolution',
      'Ultra-fast Compilation Speed',
      'Microservices Optimization',
    ],
  },
  {
    id: 'rust',
    name: 'Rust Systems Toolchain (Cargo)',
    language: 'rust',
    version: 'v1.75+ Rustc',
    category: 'Languages',
    description: 'Memory-safe systems programming language without garbage collection. Includes borrow checker, Cargo builds, and crates.',
    isBuiltIn: false,
    author: 'Rust Foundation / CodeSync',
    downloads: '2.9M',
    rating: 4.9,
    fileExtensions: ['.rs'],
    iconType: 'rust',
    badge: 'High Perf',
    features: [
      'Zero-Cost Abstractions & RAII',
      'Memory Safety Without Garbage Collection',
      'Cargo Build Toolchain',
      'Advanced Pattern Matching & Generics',
    ],
  },
  {
    id: 'java',
    name: 'Java Development Kit (OpenJDK 21)',
    language: 'java',
    version: 'OpenJDK 21 LTS',
    category: 'Runtimes',
    description: 'Robust enterprise object-oriented runtime with JIT compiler, HotSpot JVM, and standard libraries.',
    isBuiltIn: false,
    author: 'Oracle / Eclipse / CodeSync',
    downloads: '4.1M',
    rating: 4.7,
    fileExtensions: ['.java', '.class', '.jar'],
    iconType: 'java',
    badge: 'Enterprise',
    features: [
      'Modern Java 21 Virtual Threads',
      'HotSpot JVM Sandboxed Execution',
      'Object-Oriented Architecture',
      'Cross-Platform Bytecode',
    ],
  },
];

interface ExtensionState {
  installedExtensionIds: string[];
  searchQuery: string;
  selectedCategory: ExtensionCategory | 'All';
  notification: { message: string; type: 'success' | 'info' | 'warn' } | null;

  // Actions
  installExtension: (id: string) => { success: boolean; message: string };
  uninstallExtension: (id: string) => { success: boolean; message: string };
  isExtensionInstalled: (id: string) => boolean;
  isLanguageSupported: (language: string) => boolean;
  getExtensionForLanguage: (language: string) => IExtension | undefined;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: ExtensionCategory | 'All') => void;
  clearNotification: () => void;
}

const loadInstalledFromStorage = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_BUILTIN_EXTENSIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure default built-in compilers (C & C++) are always included
      const merged = Array.from(new Set([...DEFAULT_BUILTIN_EXTENSIONS, ...parsed]));
      return merged;
    }
  } catch (_e) {
    // ignore storage error
  }
  return DEFAULT_BUILTIN_EXTENSIONS;
};

const saveInstalledToStorage = (ids: string[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch (_e) {
    // ignore
  }
};

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  installedExtensionIds: loadInstalledFromStorage(),
  searchQuery: '',
  selectedCategory: 'All',
  notification: null,

  installExtension: (id: string) => {
    const extension = AVAILABLE_EXTENSIONS.find((e) => e.id === id);
    if (!extension) {
      return { success: false, message: 'Extension not found in catalog' };
    }

    const { installedExtensionIds } = get();
    if (installedExtensionIds.includes(id)) {
      return { success: true, message: `${extension.name} is already installed.` };
    }

    const nextIds = [...installedExtensionIds, id];
    saveInstalledToStorage(nextIds);

    set({
      installedExtensionIds: nextIds,
      notification: {
        message: `Successfully installed ${extension.name}! Compiler is now active.`,
        type: 'success',
      },
    });

    return {
      success: true,
      message: `Successfully installed ${extension.name}`,
    };
  },

  uninstallExtension: (id: string) => {
    const extension = AVAILABLE_EXTENSIONS.find((e) => e.id === id);
    if (!extension) {
      return { success: false, message: 'Extension not found' };
    }

    if (extension.isBuiltIn || DEFAULT_BUILTIN_EXTENSIONS.includes(id)) {
      return {
        success: false,
        message: `${extension.name} is a default core compiler and cannot be uninstalled.`,
      };
    }

    const { installedExtensionIds } = get();
    const nextIds = installedExtensionIds.filter((extId) => extId !== id);
    saveInstalledToStorage(nextIds);

    set({
      installedExtensionIds: nextIds,
      notification: {
        message: `Uninstalled ${extension.name}.`,
        type: 'info',
      },
    });

    return { success: true, message: `Uninstalled ${extension.name}` };
  },

  isExtensionInstalled: (id: string) => {
    // C and C++ are always installed by default
    if (id === 'c' || id === 'cpp') return true;
    return get().installedExtensionIds.includes(id);
  },

  isLanguageSupported: (language: string) => {
    const normalized = language.toLowerCase().trim();
    // C and C++ are default built-in
    if (normalized === 'c' || normalized === 'cpp') return true;

    // Check if matching extension is installed
    const ext = get().getExtensionForLanguage(normalized);
    if (!ext) return false;
    return get().isExtensionInstalled(ext.id);
  },

  getExtensionForLanguage: (language: string) => {
    const normalized = language.toLowerCase().trim();
    if (normalized === 'c') return AVAILABLE_EXTENSIONS.find((e) => e.id === 'c');
    if (normalized === 'cpp') return AVAILABLE_EXTENSIONS.find((e) => e.id === 'cpp');
    if (normalized === 'python' || normalized === 'py') return AVAILABLE_EXTENSIONS.find((e) => e.id === 'python');
    if (normalized === 'javascript' || normalized === 'js' || normalized === 'jsx' || normalized === 'nodejs') {
      return AVAILABLE_EXTENSIONS.find((e) => e.id === 'javascript');
    }
    if (normalized === 'typescript' || normalized === 'ts' || normalized === 'tsx') {
      return AVAILABLE_EXTENSIONS.find((e) => e.id === 'typescript');
    }
    if (normalized === 'go') return AVAILABLE_EXTENSIONS.find((e) => e.id === 'go');
    if (normalized === 'rust' || normalized === 'rs') return AVAILABLE_EXTENSIONS.find((e) => e.id === 'rust');
    if (normalized === 'java') return AVAILABLE_EXTENSIONS.find((e) => e.id === 'java');
    return undefined;
  },

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setSelectedCategory: (category: ExtensionCategory | 'All') => set({ selectedCategory: category }),
  clearNotification: () => set({ notification: null }),
}));
