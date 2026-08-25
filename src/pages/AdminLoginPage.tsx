import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';
import { isFirebaseConfigured, loginWithFirebase } from '../lib/firebase';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isAuthorizedAdminEmail, STORAGE_KEYS } from '../lib/config';
import { SEO } from '../components/common/SEO';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    // 1. Verify email against authorized whitelist
    if (!isAuthorizedAdminEmail(cleanEmail)) {
      setError('Access Denied: You are not authorized to access the admin portal.');
      setLoading(false);
      return;
    }

    // 2. If Firebase is configured, authenticate via Firebase Auth
    if (isFirebaseConfigured) {
      try {
        await loginWithFirebase(cleanEmail, password);
        localStorage.setItem('flipbook_admin_authenticated', 'true');
        navigate('/admin');
        return;
      } catch (err: any) {
        let msg = 'Authentication failed. Please verify your credentials.';
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password'
        ) {
          msg = 'Invalid email or password.';
        } else if (err.code === 'auth/too-many-requests') {
          msg = 'Access temporarily disabled due to multiple failed attempts. Please try again later.';
        } else if (err.message) {
          msg = err.message;
        }
        setError(msg);
        setLoading(false);
        return;
      }
    }

    // 3. If Supabase is configured, use Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (authError) throw authError;

        if (data.session) {
          localStorage.setItem('flipbook_admin_authenticated', 'true');
          localStorage.setItem(STORAGE_KEYS.ADMIN_USER_EMAIL, cleanEmail);
          navigate('/admin');
          return;
        }
      } catch (err: any) {
        setError(err.message || 'Invalid admin credentials');
        setLoading(false);
        return;
      }
    }

    // 4. Default password check for local environments
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    localStorage.setItem('flipbook_admin_authenticated', 'true');
    localStorage.setItem(STORAGE_KEYS.ADMIN_USER_EMAIL, cleanEmail);
    navigate('/admin');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <SEO title="Admin Login | Flipbook Pro" />

      <div className="max-w-md w-full glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Administrator Login</h2>
          <p className="text-xs text-slate-400">
            Sign in to manage publications and settings
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 focus:border-brand-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-brand-500/20"
          >
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>

        {/* Return to Public Portal */}
        <div className="pt-4 border-t border-slate-850 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Portal</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
