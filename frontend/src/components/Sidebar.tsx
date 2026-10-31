import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  FileSearch,
  ShieldCheck,
  FileText,
  Boxes,
  BarChart3,
  Scale,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, pendingCount = 0 }) => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Scan Product', path: '/scan', icon: ScanLine, highlight: true },
    { name: 'OCR Extraction', path: '/ocr', icon: FileSearch },
    { name: 'Compliance Analysis', path: '/compliance', icon: ShieldCheck },
    { name: 'Human Verification', path: '/verification', icon: CheckSquare, badge: pendingCount },
    { name: 'Inspection Reports', path: '/reports', icon: FileText },
    { name: 'Product Repository', path: '/repository', icon: Boxes },
    { name: 'Violation Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Rule Management', path: '/rules', icon: Scale },
    { name: 'User Management', path: '/users', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-cardBgDark transition-all duration-300 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-deepBlue to-cyanAccent flex items-center justify-center text-white shadow-md shadow-deepBlue/20 shrink-0">
            <Scale className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-govNavy-900 dark:text-white flex items-center gap-1.5">
                LegalMetrix <span className="text-deepBlue dark:text-cyanAccent text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">
                Legal Metrology India
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-deepBlue text-white shadow-sm shadow-deepBlue/25'
                    : item.highlight
                    ? 'text-deepBlue dark:text-cyanAccent bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between">
                  <span>{item.name}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-warningAmber text-slate-950 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && !item.badge && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-200/50 dark:bg-blue-800/50 text-deepBlue dark:text-cyan-200">
                      Scan
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Regulatory Badge Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 m-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-2 mb-1 text-slate-700 dark:text-slate-300 font-semibold text-xs">
            <ShieldAlert className="w-4 h-4 text-cyanAccent" />
            <span>PCR 2011 Compliance</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Packaged Commodities Rules (Rule 6, 9, 18, 26) Standard Enforcement Platform.
          </p>
        </div>
      )}
    </aside>
  );
};

