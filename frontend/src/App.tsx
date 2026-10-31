import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScanProductPage } from './pages/ScanProductPage';
import { OCRExtractionPage } from './pages/OCRExtractionPage';
import { ComplianceAnalysisPage } from './pages/ComplianceAnalysisPage';
import { VerificationQueuePage } from './pages/VerificationQueuePage';
import { InspectionReportsPage } from './pages/InspectionReportsPage';
import { ProductRepositoryPage } from './pages/ProductRepositoryPage';
import { ViolationAnalyticsPage } from './pages/ViolationAnalyticsPage';
import { RuleManagementPage } from './pages/RuleManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Application Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="scan" element={<ScanProductPage />} />
            <Route path="ocr" element={<OCRExtractionPage />} />
            <Route path="compliance" element={<ComplianceAnalysisPage />} />
            <Route path="verification" element={<VerificationQueuePage />} />
            <Route path="reports" element={<InspectionReportsPage />} />
            <Route path="repository" element={<ProductRepositoryPage />} />
            <Route path="analytics" element={<ViolationAnalyticsPage />} />
            <Route path="rules" element={<RuleManagementPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
