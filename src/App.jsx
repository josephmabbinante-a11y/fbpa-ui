import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoProvider } from "./demo/DemoContext";
import DemoGuide from "./demo/DemoGuide";
import AIBot from "./components/AIBot";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";

// Lazy load all page components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Invoices = lazy(() => import('./pages/Invoices'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const Exceptions = lazy(() => import('./pages/Exceptions'));
const ExceptionDrilldown = lazy(() => import('./pages/ExceptionDrilldown'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const CarriersPerformance = lazy(() => import('./pages/CarriersPerformance'));
const CarrierScorecard = lazy(() => import('./pages/CarrierScorecard'));
const Uploads = lazy(() => import('./pages/Uploads'));
const Customers = lazy(() => import('./pages/Customers'));
const Settings = lazy(() => import('./pages/Settings'));
const RateLogicTool = lazy(() => import('./pages/RateLogicTool'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const MyAuditIQProfile = lazy(() => import('./pages/MyAuditIQProfile'));
const Login = lazy(() => import('./pages/Login'));

// Create loading component
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
    <div>Loading...</div>
  </div>
);

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
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/exceptions" element={<Exceptions />} />
            <Route path="/exceptions/:id" element={<ExceptionDrilldown />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:reportId" element={<ReportDetail />} />
            <Route path="/carriers" element={<CarriersPerformance />} />
            <Route path="/carriers/:carrier" element={<CarrierScorecard />} />
            <Route path="/uploads" element={<Uploads />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rate-logic" element={<RateLogicTool />} />
            <Route path="/fleet-dashboard" element={<FleetDashboard />} />
            <Route path="/profile" element={<MyAuditIQProfile />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

function App() {
  return (
    <DemoProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
          <DemoGuide />
          <AIBot />
        </BrowserRouter>
      </ThemeProvider>
    </DemoProvider>
  );
}

export default App;
