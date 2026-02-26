import { Suspense, lazy } from "react";
import LoginTest from "./components/LoginTest";
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

const appRouteDefs = [
  { path: "/", element: <Dashboard /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/invoices", element: <Invoices /> },
  { path: "/invoices/:id", element: <InvoiceDetail /> },
  { path: "/exceptions", element: <Exceptions /> },
  { path: "/exceptions/:id", element: <ExceptionDrilldown /> },
  { path: "/reports", element: <Reports /> },
  { path: "/reports/:reportId", element: <ReportDetail /> },
  { path: "/carriers", element: <CarriersPerformance /> },
  { path: "/carriers/:carrier", element: <CarrierScorecard /> },
  { path: "/uploads", element: <Uploads /> },
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
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            {appRouteDefs.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
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
        </BrowserRouter>
      </ThemeProvider>
    </DemoProvider>
  );
}

export default App;
