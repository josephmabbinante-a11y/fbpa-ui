import CarrierScorecard from "./pages/CarrierScorecard";
import RateLogicTool from "./pages/RateLogicTool";
import FleetDashboard from "./pages/FleetDashboard";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DemoProvider } from "./demo/DemoContext";
import DemoGuide from "./demo/DemoGuide";
import AIBot from "./components/AIBot";
import Sidebar from "./components/Sidebar";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Uploads from "./pages/Uploads";
import Reports from "./pages/Reports";
import ReportDetail from "./pages/ReportDetail";
import CarriersPerformance from "./pages/CarriersPerformance";
import Invoices from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import Exceptions from "./pages/Exceptions";
import ExceptionDrilldown from "./pages/ExceptionDrilldown";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Customers from "./pages/Customers";
import MyAuditIQProfile from "./pages/MyAuditIQProfile";

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
      <Routes>
        <Route path="/login" element={isAuthed ? <Navigate to="/dashboard" replace /> : <Login />} />
      </Routes>
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
