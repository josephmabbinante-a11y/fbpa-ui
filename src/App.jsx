import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DemoProvider } from './demo/DemoContext';
import DemoGuide from './demo/DemoGuide';
import AIBot from './components/AIBot';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import LoginTest from './components/LoginTest';
import { getAccessToken } from './utils/authToken';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CombinedPage = lazy(() => import('./pages/CombinedPage'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const ExceptionsUploads = lazy(() => import('./pages/ExceptionsUploads'));
const ExceptionDrilldown = lazy(() => import('./pages/ExceptionDrilldown'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const CarriersPerformance = lazy(() => import('./pages/CarriersPerformance'));
const CarrierScorecard = lazy(() => import('./pages/CarrierScorecard'));
const Loads = lazy(() => import('./pages/Loads'));
const LoadCenter = lazy(() => import('./pages/LoadCenter'));
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const RateLogicTool = lazy(() => import('./pages/RateLogicTool'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const Login = lazy(() => import('./pages/Login'));
const LoadBoard = lazy(() => import('./pages/LoadBoard'));
const Shipments = lazy(() => import('./pages/Shipments'));
const AR = lazy(() => import('./pages/AR'));
const AP = lazy(() => import('./pages/AP'));
const Aging = lazy(() => import('./pages/Aging'));
const LaneIntelligence = lazy(() => import('./pages/LaneIntelligence'));
const Carriers = lazy(() => import('./pages/Carriers'));

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
            <Route path="/loadcenter" element={<LoadCenter />} />
            <Route path="/invoices" element={<CombinedPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/exceptions" element={<ExceptionsUploads />} />
            <Route path="/uploads" element={<ExceptionsUploads />} />
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
            <Route path="/finance/ar" element={<AR />} />
            <Route path="/finance/ap" element={<AP />} />
            <Route path="/finance/aging" element={<Aging />} />
            <Route path="/lane-intelligence" element={<LaneIntelligence />} />
            <Route path="/carriers-list" element={<Carriers />} />
            <Route path="/account" element={<Navigate to="/settings" replace />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
              {/* Removed Fleet dashboard, orders, customers, and carriers pages */}
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <DemoProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </DemoProvider>
    </ThemeProvider>
  );
}
