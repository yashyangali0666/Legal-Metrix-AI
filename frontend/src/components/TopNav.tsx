import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { User, UserRole } from '../types';
import { ApiService } from '../services/api';

interface TopNavProps {
  currentUser: User | null;
  onSwitchRole: (role: UserRole) => void;
  pendingCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({ currentUser, onSwitchRole, pendingCount = 0 }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark');
  });
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => {
    ApiService.getHealth()
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline', ocr_engines: { active_engine: 'standby' } }));
  }, []);

  const getPageTitle = (path: string) => {
    if (path === '/') return 'Inspection Monitoring Dashboard';
    if (path.startsWith('/scan')) return 'AI Product Packaging Scanner';
    if (path.startsWith('/ocr')) return 'OCR Text Extraction & Visual Bounding Boxes';
    if (path.startsWith('/compliance')) return 'Legal Metrology Compliance Analysis';
    if (path.startsWith('/verification')) return 'Human Verification & Adjudication Queue';
    if (path.startsWith('/reports')) return 'Statutory Compliance Inspection Reports';
    if (path.startsWith('/repository')) return 'Product Inspection Repository';
    if (path.startsWith('/analytics')) return 'Statutory Violation & Trend Analytics';
    if (path.startsWith('/rules')) return 'Statutory Legal Rules Management';
    if (path.startsWith('/users')) return 'Enforcement Officers & Access Control';
    if (path.startsWith('/settings')) return 'System Diagnostics & Configuration';
    return 'LegalMetrix AI';
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-cardBgDark/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Breadcrumbs / Page Title */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-wider">
          Enforcement Portal
        </span>
        <span className="text-slate-300 dark:text-slate-700">/</span>
        <h1 className="text-base font-bold text-govNavy-900 dark:text-white">
          {getPageTitle(location.pathname)}
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* System & OCR Engine Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-800 dark:text-emerald-300 font-medium">
            OCR: <strong>{healthStatus?.ocr_engines?.active_engine || 'Active'}</strong>
          </span>
        </div>

        {/* Verification Queue Pill */}
        {pendingCount > 0 && (
          <button
            onClick={() => navigate('/verification')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 animate-bounce" />
            <span>{pendingCount} Need Verification</span>
          </button>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Light / Dark Mode"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="w-8 h-8 rounded-lg bg-deepBlue text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {currentUser?.role?.charAt(0) || 'I'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-govNavy-900 dark:text-white leading-tight">
                {currentUser?.full_name || 'Rajesh Kumar'}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                Role: <span className="font-semibold text-deepBlue dark:text-cyanAccent">{currentUser?.role || 'Inspector'}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Switch Officer Persona</p>
                <p className="text-[11px] text-slate-400">Simulate role-based authorization</p>
              </div>

              <button
                onClick={() => { onSwitchRole('admin'); setShowRoleMenu(false); }}
                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  currentUser?.role === 'admin' ? 'font-bold text-deepBlue dark:text-cyanAccent bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Administrator</div>
                  <div className="text-[10px] text-slate-400">Manage rules, users & settings</div>
                </div>
                {currentUser?.role === 'admin' && <CheckCircle2 className="w-4 h-4 text-deepBlue dark:text-cyanAccent" />}
              </button>

              <button
                onClick={() => { onSwitchRole('inspector'); setShowRoleMenu(false); }}
                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  currentUser?.role === 'inspector' ? 'font-bold text-deepBlue dark:text-cyanAccent bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Field Inspector</div>
                  <div className="text-[10px] text-slate-400">Scan products & verify labels</div>
                </div>
                {currentUser?.role === 'inspector' && <CheckCircle2 className="w-4 h-4 text-deepBlue dark:text-cyanAccent" />}
              </button>

              <button
                onClick={() => { onSwitchRole('reviewer'); setShowRoleMenu(false); }}
                className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  currentUser?.role === 'reviewer' ? 'font-bold text-deepBlue dark:text-cyanAccent bg-blue-50/50 dark:bg-blue-950/30' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Statutory Reviewer</div>
                  <div className="text-[10px] text-slate-400">Adjudicate flagged violations</div>
                </div>
                {currentUser?.role === 'reviewer' && <CheckCircle2 className="w-4 h-4 text-deepBlue dark:text-cyanAccent" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

