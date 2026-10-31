import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Lock,
  User,
  Mail,
  Building2,
  BadgeAlert,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('inspector');
  const [department, setDepartment] = useState('Legal Metrology Department');
  const [badgeNumber, setBadgeNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register({
        full_name: fullName,
        username,
        email,
        password,
        role,
        department,
        badge_number: badgeNumber || undefined,
      });

      // Redirect immediately to dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Registration error', err);
      setError(err?.response?.data?.detail || 'Registration failed. Username or email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-pageBg dark:bg-pageBgDark selection:bg-deepBlue selection:text-white">
      {/* Top Banner */}
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
              &bull; Officer Onboarding & Credential Issuance
            </span>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs font-semibold text-deepBlue dark:text-cyanAccent hover:underline"
        >
          Already have an account? Sign In &rarr;
        </Link>
      </div>

      {/* Main Form Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="max-w-xl w-full space-y-5">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-xs font-semibold text-deepBlue dark:text-cyanAccent mb-1">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Directorate of Legal Metrology</span>
            </div>
            <h2 className="text-2xl font-extrabold text-govNavy-900 dark:text-white tracking-tight">
              Register Enforcement Officer
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create an authorized officer profile to conduct packaged commodity inspections, execute OCR triage, and generate statutory compliance reports.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-card space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-errorRed flex items-center gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Officer Full Name <span className="text-errorRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Chandra"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Username <span className="text-errorRed">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. inspector_ramesh"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email <span className="text-errorRed">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="ramesh@legalmetrix.gov.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password <span className="text-errorRed">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Designation <span className="text-errorRed">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  >
                    <option value="inspector">Field Inspector</option>
                    <option value="reviewer">Statutory Reviewer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department / Squad
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi Inspection Unit"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Badge Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LM-DL-S-44"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white focus:ring-2 focus:ring-deepBlue outline-none text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white font-bold text-xs shadow-md hover:shadow-lg disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Issuing Credential & Enrolling...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration & Enter Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 text-xs text-slate-500">
              Already have an official account?{' '}
              <Link to="/login" className="font-bold text-deepBlue dark:text-cyanAccent hover:underline">
                Sign In here
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
        LegalMetrix AI &bull; Authorized under Legal Metrology Act, 2009 & Packaged Commodities Rules, 2011.
      </div>
    </div>
  );
};
