import React, { lazy, Suspense, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DemoProvider, useDemo } from './demo/DemoContext';
import DemoGuide from './demo/DemoGuide';
import AIBot from './components/AIBot';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import LoginTest from './components/LoginTest';
import { getAccessToken } from './utils/authToken';
import LoadStatusDemo from './components/LoadStatusDemo';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CombinedPage = lazy(() => import('./pages/CombinedPage'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const ExceptionsUploads = lazy(() => import('./pages/ExceptionsUploads'));
const Uploads = lazy(() => import('./pages/Uploads'));
const ExceptionDrilldown = lazy(() => import('./pages/ExceptionDrilldown'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const CarriersPerformance = lazy(() => import('./pages/CarriersPerformance'));
const CarrierScorecard = lazy(() => import('./pages/CarrierScorecard'));
const CarrierProfile = lazy(() => import('./pages/CarrierProfile'));
const Loads = lazy(() => import('./pages/Loads'));
const LoadCenter = lazy(() => import('./pages/LoadCenter'));
const DispatchScreen = lazy(() => import('./pages/DispatchScreen'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const Locations = lazy(() => import('./pages/Locations'));
const AddLocation = lazy(() => import('./pages/AddLocation'));
const Settings = lazy(() => import('./pages/Settings'));
const RateLogicTool = lazy(() => import('./pages/RateLogicTool'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const DriverSnapshotProfile = lazy(() => import('./pages/DriverSnapshotProfile'));
const MaintenanceQueueProfile = lazy(() => import('./pages/MaintenanceQueueProfile'));
const AssetManagement = lazy(() => import('./pages/AssetManagement'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const Login = lazy(() => import('./pages/Login'));
const LoadBoard = lazy(() => import('./pages/LoadBoard'));
const LoadManagement = lazy(() => import('./pages/LoadManagement'));
const Shipments = lazy(() => import('./pages/Shipments'));
const AR = lazy(() => import('./pages/AR'));
const AP = lazy(() => import('./pages/AP'));
const Aging = lazy(() => import('./pages/Aging'));
const LaneIntelligence = lazy(() => import('./pages/LaneIntelligence'));
const Carriers = lazy(() => import('./pages/Carriers'));
const AddCarrier = lazy(() => import('./pages/AddCarrier'));
const CarrierBulkImport = lazy(() => import('./pages/CarrierBulkImport'));
const DriverTracker = lazy(() => import('./pages/DriverTracker'));
const BuildLoad = lazy(() => import('./pages/BuildLoad'));
const SearchLoads = lazy(() => import('./pages/SearchLoads'));
const TruckloadRateCalculator = lazy(() => import('./pages/TruckloadRateCalculator'));

function LoadingFallback() {
  return (
    <div
      style={{
        padding: 24,
        color: 'var(--text-secondary)',
        fontFamily: "'Exo 2', sans-serif",
        letterSpacing: 1,
      }}
    >
      Loading module...
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isLogin = location.pathname === '/login' || location.pathname === '/login/';
  const isAuthed = Boolean(getAccessToken());

  if (isLogin) {
    return (
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login />} />
        </Routes>
      </Suspense>
    );
  }

  if (!isAuthed) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <>
      <Sidebar />
      <Layout>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/loads" element={<Loads />} />
            <Route path="/build-load" element={<BuildLoad />} />
            <Route path="/search-loads" element={<SearchLoads />} />
            <Route path="/loadcenter/load-builder" element={<BuildLoad />} />
            <Route path="/loadcenter/search-loads" element={<SearchLoads />} />
            <Route path="/loads/load-basics" element={<LoadManagement pageTitle="Load Management" activeTab="load-basics" />} />
            <Route path="/loads/customer-info" element={<LoadManagement pageTitle="Load Management" activeTab="customer-info" />} />
            <Route path="/loads/carrier-asset-info" element={<LoadManagement pageTitle="Load Management" activeTab="carrier-asset-info" />} />
            <Route path="/loads/edit-stops" element={<LoadManagement pageTitle="Load Management" activeTab="edit-stops" />} />
            <Route path="/loads/financials" element={<LoadManagement pageTitle="Load Management" activeTab="financials" />} />
            <Route path="/loads/:loadId/load-basics" element={<LoadManagement pageTitle="Load Management" activeTab="load-basics" />} />
            <Route path="/loads/:loadId/customer-info" element={<LoadManagement pageTitle="Load Management" activeTab="customer-info" />} />
            <Route path="/loads/:loadId/carrier-asset-info" element={<LoadManagement pageTitle="Load Management" activeTab="carrier-asset-info" />} />
            <Route path="/loads/:loadId/edit-stops" element={<LoadManagement pageTitle="Load Management" activeTab="edit-stops" />} />
            <Route path="/loads/:loadId/financials" element={<LoadManagement pageTitle="Load Management" activeTab="financials" />} />
            <Route path="/loadcenter" element={<LoadCenter />} />
            <Route path="/loadcenter/dispatch-screen" element={<DispatchScreen />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:customerId" element={<CustomerProfile />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/new" element={<AddLocation />} />
            <Route path="/invoices" element={<CombinedPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/exceptions" element={<ExceptionsUploads />} />
            <Route path="/uploads" element={<Uploads />} />
            <Route path="/exceptions/:id" element={<ExceptionDrilldown />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:reportId" element={<ReportDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rate-logic" element={<RateLogicTool />} />
            <Route path="/system-status" element={<SystemStatus />} />
            <Route path="/smoke-test" element={<LoginTest />} />
            <Route path="/load-board" element={<LoadBoard />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/fleet" element={<FleetDashboard />} />
            <Route path="/fleet/driver-snapshot" element={<DriverSnapshotProfile />} />
            <Route path="/fleet/maintenance-queue" element={<MaintenanceQueueProfile />} />
            <Route path="/fleet/assets" element={<AssetManagement />} />
            <Route path="/tracker" element={<DriverTracker />} />
            <Route path="/finance/ar" element={<AR />} />
            <Route path="/finance/ap" element={<AP />} />
            <Route path="/finance/aging" element={<Aging />} />
            <Route path="/lane-intelligence" element={<LaneIntelligence />} />
            <Route path="/carriers" element={<Carriers />} />
            <Route path="/carriers/import" element={<CarrierBulkImport />} />
            <Route path="/carriers/new" element={<AddCarrier />} />
            <Route path="/carriers/profile/:carrier" element={<CarrierProfile />} />
            <Route path="/carriers/:carrier" element={<CarrierScorecard />} />
            <Route path="/carriers-list" element={<Carriers />} />
            <Route path="/account" element={<Navigate to="/settings" replace />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/truckload-rate-calculator" element={<TruckloadRateCalculator />} />
            <Route path="/fsm-demo" element={<LoadStatusDemo />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

function MockModeBadge() {
  const { demoMode } = useDemo();
  const isMockActive = import.meta.env.VITE_MOCK_MODE === 'true' || demoMode;

  if (!isMockActive) return null;

  return (
    <div
      aria-label="Mock mode active"
      style={{
        position: 'fixed',
        top: 12,
        right: 12,
        zIndex: 2000,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        color: '#fff',
        background: 'linear-gradient(135deg, var(--warning), var(--accent-2))',
        border: '1px solid rgba(255,255,255,0.25)',
        borderRadius: 999,
        padding: '6px 10px',
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
      }}
    >
      Mock Mode Active
    </div>
  );
}
 
function App() {
  return (
    <ThemeProvider>
      <DemoProvider>
        <ErrorBoundary>
          <BrowserRouter>
            <AppRoutes />
            <MockModeBadge />
            <DemoGuide />
            <AIBot />
          </BrowserRouter>
        </ErrorBoundary>
      </DemoProvider>

      </ThemeProvider>
    );
  }

  export default App;
