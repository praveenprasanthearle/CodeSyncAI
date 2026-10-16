import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Code2,
  LogIn,
  LayoutDashboard,
  Github,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
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

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Code2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900">
              CodeSync <span className="text-blue-600">AI</span>
            </span>
          </Link>

          {/* Navigation Links */}
          {isAuthenticated ? (
            <nav className="hidden sm:flex items-center gap-1 text-xs font-medium">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  isDashboard
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Projects
              </Link>
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600">
              <a href="/#features" className="hover:text-slate-900 transition-colors">
                Features
              </a>
              <a href="/#collaboration" className="hover:text-slate-900 transition-colors">
                Collaboration
              </a>
              <a href="/#execution" className="hover:text-slate-900 transition-colors">
                Runtime
              </a>
              <a href="/#ai" className="hover:text-slate-900 transition-colors">
                AI Assistant
              </a>
            </nav>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
            title="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>

          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white/80 py-1 px-2 hover:bg-slate-50 transition-all focus:outline-none"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-6 w-6 rounded-md bg-slate-100 object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-[11px] font-semibold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline text-xs font-medium text-slate-800 max-w-[120px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-11 w-56 rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-glass-dropdown py-1 z-50 animate-in fade-in duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">@{user.username}</p>
                  </div>

                  <div className="py-1">
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-slate-500" />
                      <span>Projects</span>
                    </Link>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 rounded-lg transition-colors"
              >
                <LogIn className="h-3.5 w-3.5 text-slate-500" />
                <span>Sign in</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800 transition-colors"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
