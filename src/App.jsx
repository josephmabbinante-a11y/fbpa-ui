import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DemoProvider } from './demo/DemoContext';
import DemoGuide from './demo/DemoGuide';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import LoginTest from './components/LoginTest';

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
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const RateLogicTool = lazy(() => import('./pages/RateLogicTool'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const MyAuditIQProfile = lazy(() => import('./pages/MyAuditIQProfile'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const Login = lazy(() => import('./pages/Login'));
const LoadBoard = lazy(() => import('./pages/LoadBoard'));
const Shipments = lazy(() => import('./pages/Shipments'));
const AR = lazy(() => import('./pages/AR'));
const AP = lazy(() => import('./pages/AP'));
const Aging = lazy(() => import('./pages/Aging'));
const LaneIntelligence = lazy(() => import('./pages/LaneIntelligence'));
const Carriers = lazy(() => import('./pages/Carriers'));
const Account = lazy(() => import('./pages/Account'));

function LoadingFallback() {
  return (
    <div style={{ padding: 24, color: "var(--text-secondary)", fontFamily: "'Exo 2', sans-serif", letterSpacing: 1 }}>
      Loading module...
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  let isAuthed = false;
  try {
    isAuthed = Boolean(localStorage.getItem('accessToken'));
  } catch {
    isAuthed = false;
  }

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
<<<<<<< HEAD
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/load-board" element={<LoadBoard />} />
            <Route path="/shipments" element={<Shipments />} />
            <Route path="/fleet" element={<FleetDashboard />} />
          <Route path="/fleet-dashboard" element={<FleetDashboard />} />
          
          {/* Operations */}
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/uploads" element={<Uploads />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/exceptions/:id" element={<ExceptionDrilldown />} />
          
          {/* Finance */}
            <Route path="/finance/ar" element={<AR />} />
            <Route path="/finance/ap" element={<AP />} />
            <Route path="/finance/aging" element={<Aging />} />
          
