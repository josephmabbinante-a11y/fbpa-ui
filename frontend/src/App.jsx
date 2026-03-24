import React, {lazy, Suspense} from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import {BrowserRouter, Navigate, Route, Routes, useLocation} from 'react-router-dom';
import {ThemeProvider } from './contexts/ThemeContext';
import {DemoProvider, useDemo} from './demo/DemoContext';
import { MultitenantProvider } from './contexts/MultitenantContext';
import DemoGuide from './demo/DemoGuide';
import Sidebar from './components/Sidebar';
import Layout from './components/Layout';
import GlobalCommandSearch from './components/GlobalCommandSearch';
import LoginTest from './components/LoginTest';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LoadStatusDemo from './components/LoadStatusDemo';
import NotFound from './pages/NotFound';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const CombinedPage = lazy(() => import('./pages/CombinedPage'));
const InvoiceDetail = lazy(() => import('./pages/InvoiceDetail'));
const ExceptionsUploads = lazy(() => import('./pages/ExceptionsUploads'));
const ExceptionDrilldown = lazy(() => import('./pages/ExceptionDrilldown'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const CarriersPerformance = lazy(() => import('./pages/CarriersPerformance'));
const CarrierScorecard = lazy(() => import('./pages/CarrierScorecard'));
const CarrierProfile = lazy(() => import('./pages/CarrierProfile'));
const Loads = lazy(() => import('./pages/Loads'));
const LoadCenter = lazy(() => import('./pages/LoadCenter'));
const DispatchScreen = lazy(() => import('./pages/DispatchScreen'));
const LoadCommandCenterPage = lazy(() => import('./pages/Loads/LoadCommandCenterPage'));
const Customers = lazy(() => import('./pages/Customers'));
const CustomerProfile = lazy(() => import('./pages/CustomerProfile'));
const Locations = lazy(() => import('./pages/Locations'));
const AddLocation = lazy(() => import('./pages/AddLocation'));
const LocationProfile = lazy(() => import('./pages/LocationProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const RateLogicTool = lazy(() => import('./pages/RateLogicTool'));
const FleetDashboard = lazy(() => import('./pages/FleetDashboard'));
const DriverSnapshotProfile = lazy(() => import('./pages/DriverSnapshotProfile'));
const MaintenanceQueueProfile = lazy(() => import('./pages/MaintenanceQueueProfile'));
const AssetManagement = lazy(() => import('./pages/AssetManagement'));
const SystemStatus = lazy(() => import('./pages/SystemStatus'));
const Login = lazy(() => import('./pages/Login'));
const UnifiedLoadAuctionBoard = lazy(() => import('./pages/UnifiedLoadAuctionBoard'));
const LoadManagement = lazy(() => import('./pages/LoadManagement'));
const NewShipment = lazy(() => import('./pages/NewShipment'));
const AR = lazy(() => import('./pages/AR'));
const AP = lazy(() => import('./pages/AP'));
const Aging = lazy(() => import('./pages/Aging'));
const LaneIntelligence = lazy(() => import('./pages/LaneIntelligence'));
const Carriers = lazy(() => import('./pages/Carriers'));
const AddCarrier = lazy(() => import('./pages/AddCarrier'));
const AddCustomer = lazy(() => import('./pages/AddCustomer'));
const CarrierBulkImport = lazy(() => import('./pages/CarrierBulkImport'));
const DriverTracker = lazy(() => import('./pages/DriverTracker'));
const BuildLoad = lazy(() => import('./pages/BuildLoad'));
const SearchLoads = lazy(() => import('./pages/SearchLoads'));
const TruckloadRateCalculator = lazy(() => import('./pages/TruckloadRateCalculator'));
const AuditIQ = lazy(() => import('./pages/AuditIQ'));
const FraudPrevention = lazy(() => import('./pages/FraudPrevention'));
const RiskScoring = lazy(() => import('./pages/RiskScoring'));
const RouteOptimization = lazy(() => import('./pages/RouteOptimization'));
const TenantAdmin = lazy(() => import('./pages/TenantAdmin'));
const LeadManagement = lazy(() => import('./pages/LeadManagement'));
const QuotingRFP = lazy(() => import('./pages/QuotingRFP'));
const CapacityBoard = lazy(() => import('./pages/CapacityBoard'));
const CarrierCompliance = lazy(() => import('./pages/CarrierCompliance'));
const BudgetPL = lazy(() => import('./pages/BudgetPL'));
const OperationalKPIs = lazy(() => import('./pages/OperationalKPIs'));

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
  const { token } = useAuth();

  if (isLogin || location.pathname.startsWith('/verify-email')) {
    const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
    return (
      <Suspense fallback={<LoadingFallback />}> 
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
        </Routes>
      </Suspense>
    );
  }

  if (!token) {
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
            <Route path="/build-load" element={<Navigate to="/load-board/new-shipment" replace />} />
            <Route path="/search-loads" element={<SearchLoads />} />
            <Route path="/loadcenter/load-builder" element={<Navigate to="/load-board/new-shipment" replace />} />
            <Route path="/loadcenter/search-loads" element={<SearchLoads />} />
            <Route path="/loads/load-basics" element={<LoadManagement pageTitle="New Shipment" activeTab="load-basics" />} />
            <Route path="/loads/customer-info" element={<LoadManagement pageTitle="New Shipment" activeTab="customer-info" />} />
            <Route path="/loads/carrier-asset-info" element={<LoadManagement pageTitle="New Shipment" activeTab="carrier-asset-info" />} />
            <Route path="/loads/edit-stops" element={<LoadManagement pageTitle="New Shipment" activeTab="edit-stops" />} />
            <Route path="/loads/financials" element={<LoadManagement pageTitle="New Shipment" activeTab="financials" />} />
            {/* Template mode routes */}
            <Route path="/loads/template/load-basics" element={<LoadManagement pageTitle="Create Load Template" activeTab="load-basics" mode="template" />} />
            <Route path="/loads/template/customer-info" element={<LoadManagement pageTitle="Create Load Template" activeTab="customer-info" mode="template" />} />
            <Route path="/loads/template/carrier-asset-info" element={<LoadManagement pageTitle="Create Load Template" activeTab="carrier-asset-info" mode="template" />} />
            <Route path="/loads/template/edit-stops" element={<LoadManagement pageTitle="Create Load Template" activeTab="edit-stops" mode="template" />} />
            <Route path="/loads/template/financials" element={<LoadManagement pageTitle="Create Load Template" activeTab="financials" mode="template" />} />
            <Route path="/loads/:loadId/load-basics" element={<LoadManagement pageTitle="New Shipment" activeTab="load-basics" />} />
            <Route path="/loads/:loadId/customer-info" element={<LoadManagement pageTitle="New Shipment" activeTab="customer-info" />} />
            <Route path="/loads/:loadId/carrier-asset-info" element={<LoadManagement pageTitle="New Shipment" activeTab="carrier-asset-info" />} />
            <Route path="/loads/:loadId/edit-stops" element={<LoadManagement pageTitle="New Shipment" activeTab="edit-stops" />} />
            <Route path="/loads/:loadId/financials" element={<LoadManagement pageTitle="New Shipment" activeTab="financials" />} />
            <Route path="/loadcenter" element={<LoadCenter />} />
            <Route path="/loadcenter/dispatch-screen" element={<DispatchScreen />} />
            <Route path="/loadcenter/command-center/:loadId" element={<LoadCommandCenterPage />} />
            <Route path="/loadcenter/command-center" element={<LoadCommandCenterPage />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/new" element={<AddCustomer />} />
            <Route path="/customers/:customerId" element={<CustomerProfile />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/locations/new" element={<AddLocation />} />
            <Route path="/locations/:locationId" element={<LocationProfile />} />
            <Route path="/invoices" element={<CombinedPage />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/exceptions" element={<ExceptionsUploads />} />
            <Route path="/exceptions/:id" element={<ExceptionDrilldown />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/:reportId" element={<ReportDetail />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/rate-logic" element={<RateLogicTool />} />
            <Route path="/system-status" element={<SystemStatus />} />
            <Route path="/smoke-test" element={<LoginTest />} />
            <Route path="/load-board" element={<UnifiedLoadAuctionBoard />} />
            <Route path="/load-board/new-shipment" element={<NewShipment />} />
            <Route path="/load-board/my-activity" element={<UnifiedLoadAuctionBoard />} />
            <Route path="/load-board/connections" element={<UnifiedLoadAuctionBoard />} />
            <Route path="/fleet" element={<FleetDashboard />} />
            <Route path="/fleet-dashboard" element={<FleetDashboard />} />
            <Route path="/finance/ar" element={<AR />} />
            <Route path="/finance/ap" element={<AP />} />
            <Route path="/finance/aging" element={<Aging />} />
            <Route path="/lane-intelligence" element={<LaneIntelligence />} />
            <Route path="/carriers" element={<Carriers />} />
            <Route path="/carriers/import" element={<CarrierBulkImport />} />
            <Route path="/carriers/new" element={<AddCarrier />} />
            <Route path="/carriers/profile/:carrier" element={<CarrierProfile />} />
            <Route path="/carriers/:carrier" element={<CarrierScorecard />} />
            <Route path="/carrier-performance" element={<CarriersPerformance />} />
            <Route path="/account" element={<Navigate to="/settings" replace />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/truckload-rate-calculator" element={<TruckloadRateCalculator />} />
            <Route path="/audit-iq" element={<AuditIQ />} />
            <Route path="/fraud-prevention" element={<FraudPrevention />} />
            <Route path="/risk-scoring" element={<RiskScoring />} />
            <Route path="/route-optimization" element={<RouteOptimization />} />
            <Route path="/fsm-demo" element={<LoadStatusDemo />} />
            <Route path="/rate-logic-tool" element={<RateLogicTool />} />
            <Route path="/auction-board" element={<Navigate to="/load-board" replace />} />
            <Route path="/exceptions-uploads" element={<ExceptionsUploads />} />
            <Route path="/tenant-admin" element={<TenantAdmin />} />
            <Route path="/leads" element={<LeadManagement />} />
            <Route path="/quoting" element={<QuotingRFP />} />
            <Route path="/capacity-board" element={<CapacityBoard />} />
            <Route path="/carrier-compliance" element={<CarrierCompliance />} />
            <Route path="/budget-pl" element={<BudgetPL />} />
            <Route path="/operational-kpis" element={<OperationalKPIs />} />
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
    <ErrorBoundary>
      <ThemeProvider>
        <DemoProvider>
          <MultitenantProvider>
            <AuthProvider>
              <BrowserRouter>
                <AppRoutes />
                <GlobalCommandSearch />
                <MockModeBadge />
              </BrowserRouter>
            </AuthProvider>
          </MultitenantProvider>
        </DemoProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;