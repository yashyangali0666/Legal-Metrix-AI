import axios from 'axios';
import {
  DashboardSummary,
  DashboardAnalytics,
  InspectionDetail,
  ComplianceRule,
  VerificationItem,
  Product,
  AuditLog,
  User
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

// Add auth header if token exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('legalmetrix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const ApiService = {
  // Auth
  register: async (userData: any) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.access_token) {
      localStorage.setItem('legalmetrix_token', res.data.access_token);
      localStorage.setItem('legalmetrix_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.data.access_token) {
      localStorage.setItem('legalmetrix_token', res.data.access_token);
      localStorage.setItem('legalmetrix_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('legalmetrix_token');
      localStorage.removeItem('legalmetrix_user');
    }
  },

  // Health
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  // Dashboard
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/dashboard/summary');
    return res.data;
  },

  getDashboardAnalytics: async (): Promise<DashboardAnalytics> => {
    const res = await api.get('/dashboard/analytics');
    return res.data;
  },

  // Inspections
  uploadInspection: async (formData: FormData) => {
    const res = await api.post('/inspections/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  processInspection: async (inspectionId: string) => {
    const res = await api.post(`/inspections/${inspectionId}/process`);
    return res.data;
  },

  getInspectionDetail: async (inspectionId: string): Promise<InspectionDetail> => {
    const res = await api.get(`/inspections/${inspectionId}`);
    return res.data;
  },

  getInspectionHistory: async (params?: { search?: string; status?: string; category?: string; page?: number; limit?: number }) => {
    const res = await api.get('/inspections/history', { params });
    return res.data;
  },

  deleteInspection: async (inspectionId: string) => {
    const res = await api.delete(`/inspections/${inspectionId}`);
    return res.data;
  },

  // OCR
  getOCRResults: async (inspectionId: string) => {
    const res = await api.get(`/ocr/${inspectionId}/results`);
    return res.data;
  },

  correctOCRDeclaration: async (inspectionId: string, declarationKey: string, correctedValue: string, comments?: string) => {
    const res = await api.put(`/ocr/${inspectionId}/correct`, {
      declaration_key: declarationKey,
      corrected_value: correctedValue,
      comments,
    });
    return res.data;
  },

  // Compliance
  getRules: async (): Promise<ComplianceRule[]> => {
    const res = await api.get('/compliance/rules');
    return res.data;
  },

  getComplianceResults: async (inspectionId: string) => {
    const res = await api.get(`/compliance/${inspectionId}/results`);
    return res.data;
  },

  rerunComplianceCheck: async (inspectionId: string) => {
    const res = await api.post(`/compliance/check/${inspectionId}`);
    return res.data;
  },

  // Human Verification
  getPendingVerifications: async (): Promise<VerificationItem[]> => {
    const res = await api.get('/verification/pending');
    return res.data;
  },

  approveVerification: async (declarationId: number, correctedValue?: string, comments?: string) => {
    const res = await api.post(`/verification/${declarationId}/approve`, {
      action: 'approved',
      corrected_value: correctedValue,
      comments,
    });
    return res.data;
  },

  rejectVerification: async (declarationId: number, comments?: string) => {
    const res = await api.post(`/verification/${declarationId}/reject`, {
      action: 'rejected',
      comments,
    });
    return res.data;
  },

  // Reports
  generateReport: async (inspectionId: string) => {
    const res = await api.post(`/reports/generate/${inspectionId}`);
    return res.data;
  },

  downloadReportUrl: (inspectionId: string) => `/api/reports/${inspectionId}/download`,
  exportCSVUrl: '/api/reports/export/csv',

  // Products
  getProducts: async (params?: { search?: string; category?: string; page?: number; limit?: number }): Promise<{ total: number; items: Product[] }> => {
    const res = await api.get('/products', { params });
    return res.data;
  },

  // Rule Management (Admin)
  createRule: async (ruleData: Partial<ComplianceRule>) => {
    const res = await api.post('/rules', ruleData);
    return res.data;
  },

  updateRule: async (ruleId: string, updateData: Partial<ComplianceRule> & { modification_reason?: string }) => {
    const res = await api.put(`/rules/${ruleId}`, updateData);
    return res.data;
  },

  getRuleHistory: async (ruleId: string) => {
    const res = await api.get(`/rules/${ruleId}/history`);
    return res.data;
  },

  // User Management & Audit Logs
  getUsers: async (): Promise<User[]> => {
    const res = await api.get('/users');
    return res.data;
  },

  createUser: async (userData: any) => {
    const res = await api.post('/users', userData);
    return res.data;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get('/users/audit-logs');
    return res.data;
  },
};

