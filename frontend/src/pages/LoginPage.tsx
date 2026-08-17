import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code2, Lock, Mail, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Read redirect destination if available
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanIdentifier = emailOrUsername.trim().replace(/^@+/, '');
      const response: any = await apiClient.post('/auth/login', {
        emailOrUsername: cleanIdentifier,
        password,
      });

      if (response?.data?.user && response?.data?.accessToken) {
        setAuth(response.data.user, response.data.accessToken);
        navigate(from, { replace: true });
      } else {
        throw new Error('Authentication response was incomplete.');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please check your email/username and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmailOrUsername('demo@codesync.ai');
    setPassword('DemoPass123!');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 relative">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 radial-gold-glow pointer-events-none -z-10" />

      <div className="w-full max-w-md glass-card rounded-2xl p-8 sm:p-10 border border-surface-50 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-surface-200 border border-gold-400/40 shadow-gold-sm mb-4">
            <Code2 className="h-6 w-6 text-gold-300" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to access your collaborative cloud workspaces</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3.5 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-mono font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-medium">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="developer@codesync.ai or @username"
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-medium">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2.5 text-sm font-semibold text-background shadow-md hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Pre-fill helper */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 text-xs text-gold-400/80 hover:text-gold-300 hover:underline font-mono"
          >
            <Sparkles className="h-3 w-3" />
            <span>Fill Demo Credentials</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 border-t border-surface-50/60 pt-6">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-gold-300 hover:text-gold-200 underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
