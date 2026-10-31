import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
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
  );
}

export default App;
