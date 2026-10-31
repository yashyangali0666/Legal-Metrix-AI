import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error', err);
      setError(err?.response?.data?.detail || 'Invalid username or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    setError(null);
    try {
      await login(u, p);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-pageBg dark:bg-pageBgDark selection:bg-deepBlue selection:text-white">
      {/* Top Government Emblem Bar */}
      <div className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-cardBgDark/80 backdrop-blur-md px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-deepBlue text-white flex items-center justify-center shadow-sm">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-govNavy-900 dark:text-white tracking-tight">
              LegalMetrix <span className="text-deepBlue dark:text-cyanAccent text-xs px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">AI</span>
            </span>
            <span className="hidden sm:inline text-slate-400 text-xs ml-2">
              &bull; Directorate of Legal Metrology &bull; PCR 2011 Compliance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <ShieldCheck className="w-4 h-4 text-cyanAccent" />
          <span className="hidden sm:inline">Official Enforcement Portal</span>
        </div>
      </div>

      {/* Main Login Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-md w-full space-y-5">
          {/* Header Card */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-deepBlue dark:text-cyanAccent mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Ministry of Consumer Affairs, India</span>
            </div>
            <h2 className="text-2xl font-extrabold text-govNavy-900 dark:text-white tracking-tight">
              Officer Authentication
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Sign in with your legal metrology credentials to access scanning, compliance verification, and statutory reports.
            </p>
          </div>

          {/* Form Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-card space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-errorRed flex items-center gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Officer Username or Official Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. inspector or admin (or official email)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Case-sensitive
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Enforcement Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Login Test Personas */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <span>Quick-Fill Test Accounts:</span>
                <Sparkles className="w-3.5 h-3.5 text-cyanAccent" />
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('inspector', 'Inspector@123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-left transition-colors group cursor-pointer"
                >
                  <div className="font-bold text-govNavy-900 dark:text-white group-hover:text-deepBlue dark:group-hover:text-cyanAccent truncate">
                    Inspector
                  </div>
                  <div className="text-[10px] text-slate-400">inspector</div>
                  <div className="text-[9px] text-slate-400">Inspector@123</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'Admin@123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-left transition-colors group cursor-pointer"
                >
                  <div className="font-bold text-govNavy-900 dark:text-white group-hover:text-deepBlue dark:group-hover:text-cyanAccent truncate">
                    Admin
                  </div>
                  <div className="text-[10px] text-slate-400">admin</div>
                  <div className="text-[9px] text-slate-400">Admin@123</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('reviewer', 'Reviewer@123')}
                  className="p-2 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-800 text-left transition-colors group cursor-pointer"
                >
                  <div className="font-bold text-govNavy-900 dark:text-white group-hover:text-deepBlue dark:group-hover:text-cyanAccent truncate">
                    Reviewer
                  </div>
                  <div className="text-[10px] text-slate-400">reviewer</div>
                  <div className="text-[9px] text-slate-400">Reviewer@123</div>
                </button>
              </div>
            </div>

            {/* Registration link */}
            <div className="text-center pt-2 text-xs text-slate-500">
              New legal metrology officer?{' '}
              <Link to="/register" className="font-bold text-deepBlue dark:text-cyanAccent hover:underline">
                Register for Credential
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
        LegalMetrix AI &bull; Authorized under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011.
      </div>
    </div>
  );
};

