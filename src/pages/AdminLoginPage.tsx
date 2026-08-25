import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, Lock, Mail, AlertCircle } from 'lucide-react';
import { isFirebaseConfigured, loginWithFirebase, loginWithGoogle } from '../lib/firebase';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { isAuthorizedAdminEmail, STORAGE_KEYS } from '../lib/config';
import { SEO } from '../components/common/SEO';

export const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      let msg = 'Google authentication failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign-in cancelled.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Popup request cancelled.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

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

        {/* Google Sign In Option */}
        {isFirebaseConfigured && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-slate-600 text-slate-200 font-semibold text-xs transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>{googleLoading ? 'Signing in with Google...' : 'Continue with Google'}</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                or sign in with password
              </span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>
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
            disabled={loading || googleLoading}
            className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-brand-500/20"
          >
            {loading ? 'Authenticating...' : 'Sign In with Password'}
          </button>
        </form>

        {/* Return to Public Portal */}
        <div className="pt-4 border-t border-slate-850 text-center space-y-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Portal</span>
          </Link>
          <div className="text-[11px] text-slate-500 font-mono">
            Developed by{' '}
            <a
              href="https://www.linkedin.com/in/anirudh8760/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-brand-400 underline underline-offset-2 transition-colors font-medium"
            >
              Anirudh
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

