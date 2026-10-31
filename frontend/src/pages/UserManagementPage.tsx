import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  RefreshCw,
  Search,
  Lock,
  Mail,
  BadgeAlert,
  Activity
} from 'lucide-react';
import { ApiService } from '../services/api';
import { User, AuditLog } from '../types';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>('users');
  const [loading, setLoading] = useState(true);

  // New user form state
  const [isCreating, setIsCreating] = useState(false);
  const [newUserData, setNewUserData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    role: 'inspector' as const,
    department: 'Legal Metrology Department',
    badge_number: ''
  });
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, l] = await Promise.all([
        ApiService.getUsers(),
        ApiService.getAuditLogs()
      ]);
      setUsers(u);
      setLogs(l);
    } catch (err) {
      console.error('Failed to load user management data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiService.createUser(newUserData);
      setFeedback(`Enforcement user ${newUserData.username} created successfully.`);
      setIsCreating(false);
      setNewUserData({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'inspector',
        department: 'Legal Metrology Department',
        badge_number: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Failed to create user');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-govNavy-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-deepBlue dark:text-cyanAccent" />
            Enforcement Officers & Regulatory Access Control
          </h2>
          <p className="text-xs text-slate-500">
            Role-based authorization (Administrator, Field Inspector, Statutory Reviewer) and complete audit logging.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-deepBlue dark:text-cyanAccent shadow-sm' : 'text-slate-500'
              }`}
            >
              Enforcement Officers ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTab === 'audit' ? 'bg-white dark:bg-slate-900 text-deepBlue dark:text-cyanAccent shadow-sm' : 'text-slate-500'
              }`}
            >
              Audit Trail ({logs.length})
            </button>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-deepBlue hover:bg-deepBlue-hover text-white text-xs font-bold shadow-sm transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Enforcement Officer</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
          <RefreshCw className="w-7 h-7 text-deepBlue animate-spin" />
          <p className="text-xs text-slate-500">Loading authorized officers & audit trail...</p>
        </div>
      ) : activeTab === 'users' ? (
        <div className="rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Officer Name</th>
                <th className="py-3.5 px-4">Username & Email</th>
                <th className="py-3.5 px-4">Role Designation</th>
                <th className="py-3.5 px-4">Department / Cell</th>
                <th className="py-3.5 px-4">Badge Number</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-govNavy-900 dark:text-white">
                    {u.full_name}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-deepBlue dark:text-cyanAccent">{u.username}</div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : u.role === 'inspector'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                    {u.department}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300 font-semibold">
                    {u.badge_number || 'N/A'}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 text-xs text-successGreen font-medium">
                      <span className="w-2 h-2 rounded-full bg-successGreen" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Audit Trail Table */
        <div className="rounded-2xl bg-white dark:bg-cardBgDark border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-govNavy-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-deepBlue" />
              Statutory System Audit Logs
            </h3>
            <span className="text-xs text-slate-400">Immutable Record of Actions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Officer / User</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity Ref</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {l.created_at}
                    </td>
                    <td className="py-3 px-4 font-semibold text-govNavy-900 dark:text-white">
                      {l.user_name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-deepBlue dark:text-cyanAccent">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {l.entity_type} {l.entity_id ? `[${l.entity_id}]` : ''}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={l.details}>
                      {l.details}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {l.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-cardBgDark rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-govNavy-900 dark:text-white">
                Add New Enforcement Officer
              </h3>
              <button
                onClick={() => setIsCreating(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. inspector_ramesh"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ramesh@legalmetrix.gov.in"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Designation
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                  >
                    <option value="inspector">Field Inspector</option>
                    <option value="reviewer">Statutory Reviewer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enforcement Badge Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. LM-DL-S-55"
                  value={newUserData.badge_number}
                  onChange={(e) => setNewUserData({ ...newUserData, badge_number: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-govNavy-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-deepBlue text-white font-bold shadow-sm"
                >
                  Save Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

