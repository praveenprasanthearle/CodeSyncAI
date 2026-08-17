import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Code2,
  Sparkles,
  Users,
  Terminal,
  Cpu,
  LogIn,
  LayoutDashboard,
  Github,
  LogOut,
  Shield,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-surface-50/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-200 border border-gold-400/30 shadow-gold-sm transition-all duration-300 group-hover:scale-105 group-hover:border-gold-400">
            <Code2 className="h-5 w-5 text-gold-300 transition-transform duration-300 group-hover:rotate-6" />
            <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-background animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              CodeSync <span className="gold-gradient-text">AI</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 -mt-1">
              Cloud IDE
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="/#features" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" /> Features
          </a>
          <a href="/#collaboration" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-sky-400" /> Collaboration
          </a>
          <a href="/#execution" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-emerald-400" /> Sandboxed Runtime
          </a>
          <a href="/#ai" className="hover:text-gold-300 transition-colors flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-purple-400" /> AI Assistant
          </a>
        </nav>

        {/* Action Controls & Auth State */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center justify-center h-9 w-9 rounded-lg border border-surface-50 bg-surface-300/60 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            title="GitHub Repository"
          >
            <Github className="h-4 w-4" />
          </a>

          {isAuthenticated && user ? (
            <div className="relative flex items-center gap-3" ref={dropdownRef}>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center gap-2 rounded-lg bg-surface-100 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:text-white border border-surface-50 hover:border-gold-400/40 transition-all shadow-sm"
              >
                <LayoutDashboard className="h-3.5 w-3.5 text-gold-400" />
                <span>Dashboard</span>
              </Link>

              {/* User Avatar & Dropdown trigger */}
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border border-surface-50 bg-surface-200/80 p-1.5 pr-2.5 hover:border-gold-400/40 transition-all focus:outline-none focus:ring-1 focus:ring-gold-400"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-7 w-7 rounded-lg bg-surface-300 object-cover border border-surface-50"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-gold-600 to-gold-400 font-bold text-xs text-background">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-white leading-tight truncate max-w-[100px]">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 leading-none">
                    @{user.username}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 top-12 w-60 rounded-xl border border-surface-50 bg-surface-200/95 backdrop-blur-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-surface-50/60">
                    <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                    <p className="text-xs font-mono text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-gold-400/10 px-1.5 py-0.5 text-[10px] font-mono font-medium text-gold-300 border border-gold-400/20">
                      <Shield className="h-2.5 w-2.5" />
                      <span>{user.role.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-surface-100 hover:text-white transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4 text-gold-400" />
                      <span>Projects Dashboard</span>
                    </Link>
                  </div>

                  <div className="border-t border-surface-50/60 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition-colors px-2.5 py-2"
              >
                <LogIn className="h-4 w-4 text-gold-400" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/register"
                className="relative inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-background transition-all duration-200 hover:shadow-gold-glow hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started Free
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
