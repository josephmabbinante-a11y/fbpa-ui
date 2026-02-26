import CarrierScorecard from "./pages/CarrierScorecard";
import RateLogicTool from "./pages/RateLogicTool";
import FleetDashboard from "./pages/FleetDashboard";
import LoadBoard from "./pages/LoadBoard";
import Shipments from "./pages/Shipments";
import AR from "./pages/AR";
import AP from "./pages/AP";
import Aging from "./pages/Aging";
import LaneIntelligence from "./pages/LaneIntelligence";
import Carriers from "./pages/Carriers";
import Account from "./pages/Account";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoProvider } from "./demo/DemoContext";
import DemoGuide from "./demo/DemoGuide";
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

import ExceptionsUploads from "./pages/ExceptionsUploads";

const appRouteDefs = [
  { path: "/", element: <Dashboard /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/invoices", element: <CombinedPage /> },
  { path: "/invoices/:id", element: <InvoiceDetail /> },
  { path: "/exceptions", element: <ExceptionsUploads /> },
  { path: "/uploads", element: <ExceptionsUploads /> },
  { path: "/exceptions/:id", element: <ExceptionDrilldown /> },
  { path: "/reports", element: <Reports /> },
  { path: "/reports/:reportId", element: <ReportDetail /> },
  { path: "/carriers", element: <CarriersPerformance /> },
  { path: "/carriers/:carrier", element: <CarrierScorecard /> },
  { path: "/loads", element: <Loads /> },
  { path: "/customers", element: <Customers /> },
  { path: "/settings", element: <Settings /> },
  { path: "/rate-logic", element: <RateLogicTool /> },
  { path: "/fleet-dashboard", element: <FleetDashboard /> },
  { path: "/profile", element: <MyAuditIQProfile /> },
  { path: "/system-status", element: <SystemStatus /> },
  { path: "/smoke-test", element: <LoginTest /> },
];

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
          
