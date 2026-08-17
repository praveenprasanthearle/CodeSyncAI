import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Lock, Mail, User, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../stores/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time password validation indicators
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please ensure your password satisfies all strength requirements.');
      return;
    }

    setLoading(true);

    try {
      const response: any = await apiClient.post('/auth/register', {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (response?.data?.user && response?.data?.accessToken) {
        setAuth(response.data.user, response.data.accessToken);
        navigate('/dashboard');
      } else {
        throw new Error('Registration response was incomplete.');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="text-2xl font-bold tracking-tight text-white">Create Developer Account</h2>
          <p className="text-sm text-slate-400 mt-1">Start collaborating on code in real time</p>
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-medium">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sarah Connor"
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-medium">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-500">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="sarah_dev"
                maxLength={30}
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-medium">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full rounded-lg border border-surface-50 bg-surface-300/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-gold-400 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5 font-medium">
              Password
            </label>
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

            {/* Password Requirements Checklist */}
            {password.length > 0 && (
              <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasMinLength ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  <span>8+ characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasLetter && hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {hasLetter && hasNumber ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  <span>Letters & numbers</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold-500 to-gold-400 px-4 py-2.5 text-sm font-semibold text-background shadow-md hover:shadow-gold-glow hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Free Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-400 border-t border-surface-50/60 pt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-gold-300 hover:text-gold-200 underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
