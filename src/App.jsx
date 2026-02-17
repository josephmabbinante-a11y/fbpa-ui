import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoProvider } from "./demo/DemoContext";
import DemoGuide from "./demo/DemoGuide";
import AIBot from "./components/AIBot";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";

const CarrierScorecard = lazy(() => import("./pages/CarrierScorecard"));
const RateLogicTool = lazy(() => import("./pages/RateLogicTool"));
const FleetDashboard = lazy(() => import("./pages/FleetDashboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Uploads = lazy(() => import("./pages/Uploads"));
const Reports = lazy(() => import("./pages/Reports"));
const ReportDetail = lazy(() => import("./pages/ReportDetail"));
const CarriersPerformance = lazy(() => import("./pages/CarriersPerformance"));
const Invoices = lazy(() => import("./pages/Invoices"));
const InvoiceDetail = lazy(() => import("./pages/InvoiceDetail"));
const Exceptions = lazy(() => import("./pages/Exceptions"));
const ExceptionDrilldown = lazy(() => import("./pages/ExceptionDrilldown"));
const Settings = lazy(() => import("./pages/Settings"));
const Login = lazy(() => import("./pages/Login"));
const Customers = lazy(() => import("./pages/Customers"));
const MyAuditIQProfile = lazy(() => import("./pages/MyAuditIQProfile"));
const SystemStatus = lazy(() => import("./pages/SystemStatus"));
// Register page is now merged into Login

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
      <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
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
        <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
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
            {/* Register route removed, handled in Login */}
            <Route path="/system-status" element={<SystemStatus />} />
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
