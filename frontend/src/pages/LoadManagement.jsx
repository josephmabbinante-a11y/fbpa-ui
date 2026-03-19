import CustomerSection from '../components/CustomerSection';
import LoadDetailsSection from '../components/LoadDetailsSection';
import '../components/CustomerSection.compact.css';
import StopsSection from '../components/StopsSection';
import { useEffect, useMemo, useState } from 'react';
import React from 'react';
// Top-level error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    // Log error if needed
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{ color: 'red', padding: 24 }}><b>Something went wrong:</b> {this.state.error?.message || 'Unknown error.'}</div>;
    }
    return this.props.children;
  }
}
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import {
  createCarrier,
  generateLoadDocument,
  getCarriers,
} from '../api/client';
import { getLoadDetail, updateLoad, createLoad, createLoadsBatch, createLoadTemplate, listLoadTemplates, sendToBidNetwork, createAuctionLoad, createAuctionLoadsBatch, createAuctionLoadTemplate } from '../api/loadsClient';
import { postToBoards } from '../api/boardIntegrationClient';
import { LOAD_STATUSES, formatLoadStatusLabel, canTransitionStatus } from '../utils/loadLifecycle';



import LaneIntelligencePanel from '../components/LaneIntelligencePanel';
import CarrierSection from '../components/CarrierSection';
import FinancialSection from '../components/FinancialSection';
import CollapsibleSection from '../components/CollapsibleSection';
import BookLoadButton from '../components/BookLoadButton';
import StickyLoadHeader from '../components/StickyLoadHeader';

const COMPANY_BRANDING_STORAGE_KEY = 'fbpa_company_branding';
const DOCUMENT_WHITELABEL_STORAGE_KEY = 'fbpa_document_whitelabel';

function SectionCard({ title, children, t }) {
  return (
    <section
      style={{
        border: `1px solid ${t.accent}`,
        borderRadius: 12,
        background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
        boxShadow: `0 0 0 1px rgba(var(--glow), 0.08), 0 14px 28px rgba(0,0,0,0.16)`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${t.accent}`,
          background: `linear-gradient(90deg, ${t.surfaceStrong}, ${t.bgAlt})`,
          fontSize: 13,
          fontWeight: 700,
          color: t.text,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </div>
      <div style={{ padding: 14 }}>{children}</div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      {children}
    </label>
  );
}

const tabs = [
  { key: 'load-basics', label: 'Load Basics' },
  { key: 'customer-info', label: 'Customer Info' },
  { key: 'carrier-asset-info', label: 'Carrier / Asset Info' },
  { key: 'edit-stops', label: 'Edit Stops' },
  { key: 'financials', label: 'Financials' },
];

const mockFmcsaCarriers = [
  { companyName: 'A1 TRANSPORTATION SERVICES LLC', mcNumber: 'MC374094', usdotNumber: '842022', phone: '(720) 524-8069', email: 'ops@a1transport.com', address: 'Sandy, UT' },
  { companyName: 'GLT TRUCKS INC', mcNumber: 'MC940155', usdotNumber: '2854172', phone: '(915) 800-1120', email: 'dispatch@glttrucks.com', address: 'El Paso, TX' },
  { companyName: 'FASTLANE FREIGHT CO', mcNumber: 'MC112450', usdotNumber: '401204', phone: '(312) 555-0173', email: 'team@fastlanefreight.com', address: 'Chicago, IL' },
];

function safeString(val) {
  if (val == null) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function LoadManagement({ pageTitle = 'New Shipment', activeTab = 'load-basics', mode = 'load' }) {
        // mode: 'load' = create real load, 'template' = create/save template only
        const isTemplateMode = mode === 'template';
        // Detect auction context — loads created from Post & Auction use AL- prefix
        const isAuctionContext = pageTitle === 'Post & Auction';
        // Status update state
        const [statusUpdating, setStatusUpdating] = useState(false);
        const [statusError, setStatusError] = useState('');

      // Load lifecycle checkpoints data structure
      const [loadSnapshot, setLoadSnapshot] = useState(null);
    // Defensive checks for key props
    const safeLoadSnapshot = loadSnapshot || {};
  const navigate = useNavigate();
  const { loadId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme || {};
  const [loadSize, setLoadSize] = useState('full');
  const [goodsCondition, setGoodsCondition] = useState('new');
  const [carrierSearchSource, setCarrierSearchSource] = useState('internal');
  const [carrierQuery, setCarrierQuery] = useState('');
  const [carrierResults, setCarrierResults] = useState([]);
  const [carrierLoading, setCarrierLoading] = useState(false);
  const [carrierError, setCarrierError] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState(null);
  const [bookedLoad, setBookedLoad] = useState(null);
  const [bookingMessage, setBookingMessage] = useState('');
  // Dummy carriers list for booking dialog (replace with real data as needed)
  const carriersList = selectedCarrier ? [{ id: selectedCarrier.id || selectedCarrier.name, name: selectedCarrier.name || selectedCarrier.companyName || 'Carrier' }] : [];
  // Dummy load object for booking dialog (replace with real data as needed)
  const loadObj = { id: loadId || 'new', ...safeLoadSnapshot };
  // Booking handler
  const handleBookLoad = async ({ carrierId, rate, notes }) => {
    // Here you would call your backend API to book the load
    setBookingMessage('');
    try {
      // Simulate API call
      setBookedLoad({ carrierId, rate, notes });
      setBookingMessage('Load successfully booked!');
    } catch (err) {
      setBookingMessage('Booking failed. Please try again.');
    }
  };
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [carrierActionMessage, setCarrierActionMessage] = useState('');
  const [carrierSort, setCarrierSort] = useState({ key: 'companyName', dir: 'asc' });
  const [selectedCarrierRowKeys, setSelectedCarrierRowKeys] = useState([]);
  const [routeView, setRouteView] = useState('carrier');
  const [stopActionType, setStopActionType] = useState('Pickup');
  const [showOnCustomerDocs, setShowOnCustomerDocs] = useState(true);
  const [freightChargeTerms, setFreightChargeTerms] = useState('prepaid');
  const [stops, setStops] = useState([]);
  const [stopForm, setStopForm] = useState({
    cargoDescription: '',
    referenceNumbers: '',
    scheduleStart: '',
    scheduleEnd: '',
    driverInstructions: '',
    actualArrival: '',
    actualDeparture: '',
    unloadingMinutes: '',
  });
  const [incomeItems, setIncomeItems] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [incomeSort, setIncomeSort] = useState({ key: 'company', dir: 'asc' });
  const [expenseSort, setExpenseSort] = useState({ key: 'company', dir: 'asc' });
  const [selectedIncomeIds, setSelectedIncomeIds] = useState([]);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState([]);
  const [targetRates, setTargetRates] = useState({
    high: '',
    target: '',
    low: '',
  });
  const [arApHistory, setArApHistory] = useState([]);
  const [financialNotice, setFinancialNotice] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [locations, setLocations] = useState([]);
  const [stopLocationQuery, setStopLocationQuery] = useState('');
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({ city: '', state: '', zip: '' });
  const [locationMessage, setLocationMessage] = useState('');
  // Load lifecycle checkpoints data structure
  // ...existing code...
  // Example structure for operational checkpoints
  const [loadCheckpoints, setLoadCheckpoints] = useState({
    intake: {
      customer_added: false,
      credit_verified: false,
      load_type_selected: false,
    },
    pickup: {
      origin_confirmed: false,
      pickup_method: null, // 'APPT' or 'FCFS'
      appt_scheduled: false,
      fcfs_confirmed: false,
      bol_received: false,
    },
    carrier: {
      carrier_selected: false,
      rate_confirmed: false,
      rate_con_sent: false,
      rate_con_signed: false,
    },
    transit: {
      picked_up: false,
      gps_tracking_active: false,
      en_route: false,
    },
    delivery: {
      destination_confirmed: false,
      delivery_method: null, // 'APPT' or 'FCFS'
      appt_scheduled: false,
      fcfs_confirmed: false,
      delivered: false,
      pod_received: false,
    },
    issues: [], // For flags, e.g. [{ phase: 'pickup', step: 'origin_confirmed', type: 'delay' }]
  });

  // Utility: Calculate progress and readiness scoring
  const getLoadProgress = (checkpoints) => {
    let completed = 0;
    let total = 0;
    let missing = [];
    // Intake
    const intakeSteps = [
      { key: 'customer_added', label: 'Customer Added' },
      { key: 'credit_verified', label: 'Credit Verified' },
      { key: 'load_type_selected', label: 'Load Type Selected' },
    ];
    intakeSteps.forEach((step) => {
      total++;
      if (checkpoints.intake[step.key]) completed++;
      else missing.push(step.label);
    });
    // Pickup
    total++;
    if (checkpoints.pickup.origin_confirmed) completed++;
    else missing.push('Origin Confirmed');
    // Pickup method
    if (checkpoints.pickup.pickup_method === 'APPT') {
      total++;
      if (checkpoints.pickup.appt_scheduled) completed++;
      else missing.push('Appointment Scheduled');
    } else if (checkpoints.pickup.pickup_method === 'FCFS') {
      total++;
      if (checkpoints.pickup.fcfs_confirmed) completed++;
      else missing.push('FCFS Confirmed');
    }
    // BOL
    total++;
    if (checkpoints.pickup.bol_received) completed++;
    else missing.push('BOL Received');
    // Carrier
    const carrierSteps = [
      { key: 'carrier_selected', label: 'Carrier Selected' },
      { key: 'rate_confirmed', label: 'Rate Confirmed' },
      { key: 'rate_con_sent', label: 'Rate Con Sent' },
      { key: 'rate_con_signed', label: 'Rate Con Signed' },
    ];
    carrierSteps.forEach((step) => {
      total++;
      if (checkpoints.carrier[step.key]) completed++;
      else missing.push(step.label);
    });
    // Transit
    const transitSteps = [
      { key: 'picked_up', label: 'Picked Up' },
      { key: 'gps_tracking_active', label: 'GPS Tracking Active' },
      { key: 'en_route', label: 'En Route' },
    ];
    transitSteps.forEach((step) => {
      total++;
      if (checkpoints.transit[step.key]) completed++;
      else missing.push(step.label);
    });
    // Delivery
    total++;
    if (checkpoints.delivery.destination_confirmed) completed++;
    else missing.push('Destination Confirmed');
    if (checkpoints.delivery.delivery_method === 'APPT') {
      total++;
      if (checkpoints.delivery.appt_scheduled) completed++;
      else missing.push('Delivery Appointment Scheduled');
    } else if (checkpoints.delivery.delivery_method === 'FCFS') {
      total++;
      if (checkpoints.delivery.fcfs_confirmed) completed++;
      else missing.push('Delivery FCFS Confirmed');
    }
    total++;
    if (checkpoints.delivery.delivered) completed++;
    else missing.push('Delivered');
    total++;
    if (checkpoints.delivery.pod_received) completed++;
    else missing.push('POD Received');
    return {
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
      missing,
      readiness: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  };
  const [documentBusyType, setDocumentBusyType] = useState('');
  const [companyBranding] = useState(() => {
    try {
      const saved = localStorage.getItem(COMPANY_BRANDING_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            companyName: parsed.companyName || 'Opscale Supply Chain',
            logoUrl: parsed.logoUrl || '',
            address: parsed.address || '',
            phone: parsed.phone || '',
            email: parsed.email || '',
            accentColor: parsed.accentColor || '#2f80ed',
          };
        }
      }
    } catch {
      // noop
    }
    return {
      companyName: 'Opscale Supply Chain',
      logoUrl: '',
      address: '',
      phone: '',
      email: '',
      accentColor: '#2f80ed',
    };
  });
  // Section completion hooks (moved to top-level)
  const [loadDetailsSectionComplete, setLoadDetailsSectionComplete] = useState(false);
  const [customerSectionComplete, setCustomerSectionComplete] = useState(false);
  const [stopsSectionComplete, setStopsSectionComplete] = useState(false);
  const [stopsData, setStopsData] = useState([]);
  const [laneIntelligenceComplete, setLaneIntelligenceComplete] = useState(false);
  const [laneIntelligenceData, setLaneIntelligenceData] = useState(null);
  const [carrierSectionComplete, setCarrierSectionComplete] = useState(false);
  const [financialSectionComplete, setFinancialSectionComplete] = useState(false);

  // Progress bar color logic
  const getProgressBarColor = (progress, checkpoints) => {
    if (checkpoints.issues && checkpoints.issues.length > 0) return '#e74c3c'; // Red for issues
    if (progress.percent === 100) return '#27ae60'; // Green for complete
    if (progress.percent === 0) return '#bdc3c7'; // Gray for not started
    if (progress.percent > 0 && progress.percent < 100) return '#2980b9'; // Blue for in progress
    // Optionally, yellow for needs action (custom logic)
    return '#f1c40f';
  };

  // Render thin progress bar for the load row
  const progress = getLoadProgress(loadCheckpoints);
  const progressBarColor = getProgressBarColor(progress, loadCheckpoints);

  const safeStopsData = Array.isArray(stopsData) ? stopsData : [];

  // Dynamic section state for animation and expansion
  const [expandedSection, setExpandedSection] = useState('Load Details');

  // ── Template & Mass Operations state ──
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [massStatus, setMassStatus] = useState('');
  const [opBusy, setOpBusy] = useState('');
  const [opMessage, setOpMessage] = useState('');
  const [createdLoads, setCreatedLoads] = useState([]);
  const [massEditField, setMassEditField] = useState('status');
  const [massEditValue, setMassEditValue] = useState('');
  const [selectedLoadIds, setSelectedLoadIds] = useState([]);

  // ── Submission flow state (Loadboard / Auction / Book) ──
  const [showSubmitPanel, setShowSubmitPanel] = useState(false);
  const [submitBusy, setSubmitBusy] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  // Auction carrier list
  const [showAuctionPanel, setShowAuctionPanel] = useState(false);
  const [auctionCarrierList, setAuctionCarrierList] = useState([]);
  const [auctionCarrierSearch, setAuctionCarrierSearch] = useState('');
  const [auctionCarriersLoading, setAuctionCarriersLoading] = useState(false);
  const [auctionCarriers, setAuctionCarriers] = useState([]);
  const [auctionNotes, setAuctionNotes] = useState('');

  // Load templates on mount
  useEffect(() => {
    listLoadTemplates().then((res) => {
      if (Array.isArray(res?.items)) setTemplates(res.items);
    });
  }, []);

  const collectFormSnapshot = () => ({
    customerName: selectedCustomer?.name || selectedCustomer?.companyName || safeLoadSnapshot?.customer || '',
    equipment: safeLoadSnapshot?.equipment || 'van',
    miles: Number(safeLoadSnapshot?.totalMiles || 0),
    revenue: Number(safeLoadSnapshot?.sellRate || 0),
    carrierCost: Number(safeLoadSnapshot?.buyRate || 0),
    stops: safeStopsData,
  });

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name) { setOpMessage('Template name is required.'); return; }
    setOpBusy('save-template');
    setOpMessage('');
    const snapshot = collectFormSnapshot();
    const createTemplateFn = isAuctionContext ? createAuctionLoadTemplate : createLoadTemplate;
    const res = await createTemplateFn({ name, defaults: snapshot });
    if (res?.error) { setOpMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)); }
    else {
      setOpMessage(`Template "${name}" saved.`);
      setTemplateName('');
      const refreshed = await listLoadTemplates();
      if (Array.isArray(refreshed?.items)) setTemplates(refreshed.items);
    }
    setOpBusy('');
  };

  const handleCreateFromTemplate = async () => {
    const tpl = templates.find((t2) => t2.id === selectedTemplateId);
    if (!tpl) { setOpMessage('Select a template first.'); return; }
    const count = Math.max(1, Math.min(50, batchCount));
    setOpBusy('batch-create');
    setOpMessage('');
    const payload = { ...(tpl.defaults || {}), count, templateId: tpl.id };
    const createFn = isAuctionContext ? createAuctionLoad : createLoad;
    const batchFn = isAuctionContext ? createAuctionLoadsBatch : createLoadsBatch;
    const res = count > 1
      ? await batchFn(payload)
      : await createFn(payload);
    if (res?.error) { setOpMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)); }
    else {
      const loads = res?.loads || (res?.load ? [res.load] : []);
      setCreatedLoads((prev) => [...loads, ...prev].slice(0, 100));
      setOpMessage(`${loads.length} load(s) created from "${tpl.name}".`);
    }
    setOpBusy('');
  };

  const handleMassStatusUpdate = async () => {
    if (!massStatus || selectedLoadIds.length === 0) { setOpMessage('Select loads and a status.'); return; }
    setOpBusy('mass-status');
    setOpMessage('');
    let successCount = 0;
    for (const lid of selectedLoadIds) {
      const res = await updateLoad(lid, { status: massStatus, userId: 'mass_editor', transitionReason: 'Mass status update' });
      if (!res?.error) successCount++;
    }
    setOpMessage(`Updated ${successCount}/${selectedLoadIds.length} loads to ${formatLoadStatusLabel(massStatus)}.`);
    setOpBusy('');
  };

  const handleMassEdit = async () => {
    if (!massEditField || !massEditValue || selectedLoadIds.length === 0) { setOpMessage('Select loads, field, and value.'); return; }
    setOpBusy('mass-edit');
    setOpMessage('');
    let successCount = 0;
    for (const lid of selectedLoadIds) {
      const payload = { [massEditField]: massEditValue, userId: 'mass_editor' };
      const res = await updateLoad(lid, payload);
      if (!res?.error) successCount++;
    }
    setOpMessage(`Updated "${massEditField}" on ${successCount}/${selectedLoadIds.length} loads.`);
    setOpBusy('');
  };

  const toggleLoadSelection = (lid) => {
    setSelectedLoadIds((prev) => prev.includes(lid) ? prev.filter((id) => id !== lid) : [...prev, lid]);
  };

  // ── Submission handlers ──
  const allSectionsComplete = customerSectionComplete && stopsSectionComplete && laneIntelligenceComplete && carrierSectionComplete && financialSectionComplete;

  const handleSaveAsTemplateOnly = async () => {
    const snapshot = collectFormSnapshot();
    const name = templateName.trim() || `Template ${new Date().toLocaleDateString()}`;
    setSubmitBusy('save-template');
    setSubmitMessage('');
    const createTemplateFn = isAuctionContext ? createAuctionLoadTemplate : createLoadTemplate;
    const res = await createTemplateFn({ name, defaults: snapshot });
    if (res?.error) { setSubmitMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error)); }
    else { setSubmitMessage(`Template "${name}" saved successfully.`); }
    setSubmitBusy('');
  };

  const handleSendToLoadboard = async () => {
    if (!loadId) { setSubmitMessage('Save the load first.'); return; }
    setSubmitBusy('loadboard');
    setSubmitMessage('');
    const res = await postToBoards(loadId, { boards: ['internal'], auctionConfig: null });
    if (res?.error) { setSubmitMessage(res.error); }
    else { setSubmitMessage(`Load posted to loadboard. ${res.message || ''}`); }
    setSubmitBusy('');
  };

  const handleOpenAuctionPanel = async () => {
    setShowAuctionPanel(true);
    setAuctionCarriersLoading(true);
    try {
      const res = await getCarriers({ limit: 200 });
      const list = Array.isArray(res?.carriers) ? res.carriers : (Array.isArray(res) ? res : []);
      setAuctionCarriers(list);
    } catch { setAuctionCarriers([]); }
    setAuctionCarriersLoading(false);
  };

  const handleSendToAuction = async () => {
    if (!loadId) { setSubmitMessage('Save the load first.'); return; }
    if (auctionCarrierList.length === 0) { setSubmitMessage('Add at least one carrier to the bid list.'); return; }
    setSubmitBusy('auction');
    setSubmitMessage('');
    const carrierIds = auctionCarrierList.map(c => c.id || c._id);
    const res = await sendToBidNetwork(loadId, { carrierIds, notes: auctionNotes });
    if (res?.error) { setSubmitMessage(res.error); }
    else { setSubmitMessage(`Load sent to auction. ${auctionCarrierList.length} carrier(s) notified.`); setShowAuctionPanel(false); }
    setSubmitBusy('');
  };

  // OpScale carrier compliance checks
  const getCarrierComplianceWarnings = (carrier) => {
    const warnings = [];
    if (!carrier.insuranceExpiry && !carrier.insuranceStatus) {
      warnings.push({ level: 'critical', text: 'Insurance status unknown' });
    } else if (carrier.insuranceStatus === 'expired' || (carrier.insuranceExpiry && new Date(carrier.insuranceExpiry) < new Date())) {
      warnings.push({ level: 'critical', text: 'Insurance expired' });
    } else if (carrier.insuranceExpiry && (new Date(carrier.insuranceExpiry) - new Date()) < 30 * 24 * 60 * 60 * 1000) {
      warnings.push({ level: 'warning', text: 'Insurance expiring within 30 days' });
    }
    if (carrier.safetyRating === 'Unsatisfactory' || carrier.safetyRating === 'Conditional') {
      warnings.push({ level: 'critical', text: `Safety rating: ${carrier.safetyRating}` });
    }
    if (!carrier.mcNumber && !carrier.usdotNumber) {
      warnings.push({ level: 'critical', text: 'Missing MC# and USDOT#' });
    }
    if (carrier.complianceStatus === 'non-compliant' || carrier.complianceStatus === 'suspended') {
      warnings.push({ level: 'critical', text: `Compliance: ${carrier.complianceStatus}` });
    }
    if (carrier.authorityStatus === 'inactive' || carrier.authorityStatus === 'revoked') {
      warnings.push({ level: 'critical', text: `Authority: ${carrier.authorityStatus}` });
    }
    if (!carrier.email && !carrier.phone) {
      warnings.push({ level: 'warning', text: 'No contact info on file' });
    }
    if (carrier.claimsCount > 3) {
      warnings.push({ level: 'warning', text: `${carrier.claimsCount} claims on record` });
    }
    return warnings;
  };

  const toggleAuctionCarrier = (carrier) => {
    setAuctionCarrierList(prev => {
      const id = carrier.id || carrier._id;
      if (prev.some(c => (c.id || c._id) === id)) return prev.filter(c => (c.id || c._id) !== id);
      return [...prev, carrier];
    });
  };

  const filteredAuctionCarriers = auctionCarriers.filter(c => {
    if (!auctionCarrierSearch.trim()) return true;
    const q = auctionCarrierSearch.toLowerCase();
    return [c.name, c.companyName, c.mcNumber, c.usdotNumber, c.city, c.state]
      .filter(Boolean).some(v => String(v).toLowerCase().includes(q));
  });

  // Helper for section card
  function DynamicSection({ title, complete, children }) {
    const isOpen = expandedSection === title;
    return (
      <div
        style={{
          marginBottom: 12,
          borderRadius: 10,
          boxShadow: isOpen ? '0 4px 24px rgba(0,0,0,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
          background: isOpen ? 'linear-gradient(180deg, #f8fbff 80%, #eaf6ff 100%)' : '#f8fbff',
          border: `2px solid ${complete ? '#27ae60' : '#2980b9'}`,
          transition: 'all 0.3s',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            padding: '14px 20px',
            background: isOpen ? '#eaf6ff' : '#f8fbff',
            borderBottom: isOpen ? '1px solid #d0e6fa' : 'none',
            fontWeight: 700,
            fontSize: 16,
            color: complete ? '#27ae60' : '#2980b9',
            letterSpacing: 0.2,
            userSelect: 'none',
          }}
          onClick={() => setExpandedSection(isOpen ? '' : title)}
        >
          <span>{title}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: complete ? '#27ae60' : '#bbb' }}>
            {complete ? 'Complete' : 'In Progress'}
            <span style={{ marginLeft: 8, fontSize: 18 }}>{isOpen ? '▼' : '▶'}</span>
          </span>
        </div>
        <div
          style={{
            maxHeight: isOpen ? 1000 : 0,
            overflow: 'hidden',
            transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
            background: isOpen ? '#f8fbff' : '#f8fbff',
            padding: isOpen ? '14px 16px' : '0 16px',
            opacity: isOpen ? 1 : 0,
          }}
        >
          {isOpen && children}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        width: '100%',
        padding: 0,
        background: 'transparent',
        borderRadius: 0,
        minHeight: '100vh',
        maxWidth: '100%',
        margin: 0,
      }}>
        {/* Sticky Load Header with Status Dropdown */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          {typeof StickyLoadHeader === 'function' ? (
            <StickyLoadHeader
              loadNumber={safeString(safeLoadSnapshot.number || '123456')}
              status={safeString(safeLoadSnapshot.status || 'Open')}
              customer={safeString(safeLoadSnapshot.customer || 'Acme Corp')}
              totalMiles={safeString(safeLoadSnapshot.totalMiles || 1200)}
              sellRate={safeString(safeLoadSnapshot.sellRate || 5000)}
              buyRate={safeString(safeLoadSnapshot.buyRate || 4300)}
              grossMargin={safeString((safeLoadSnapshot.sellRate || 5000) - (safeLoadSnapshot.buyRate || 4300))}
              marginPct={safeString(((safeLoadSnapshot.sellRate || 5000) - (safeLoadSnapshot.buyRate || 4300)) / (safeLoadSnapshot.sellRate || 5000) * 100)}
              riskIndicator={safeString(safeLoadSnapshot.riskIndicator || 'Medium')}
              statusDropdown={
                <>
                  <select
                    value={safeLoadSnapshot.status || 'DRAFT'}
                    disabled={statusUpdating || !loadId}
                    style={{ fontSize: 15, padding: '4px 8px', borderRadius: 6, border: '1px solid #bfc9d9', minWidth: 120 }}
                    onChange={async (e) => {
                      const nextStatus = e.target.value;
                      setStatusUpdating(true);
                      setStatusError('');
                      try {
                        if (!canTransitionStatus(safeLoadSnapshot.status, nextStatus)) {
                          setStatusError('Invalid status transition.');
                          setStatusUpdating(false);
                          return;
                        }
                        const result = await updateLoad(loadId, { status: nextStatus });
                        if (result?.error) {
                          setStatusError(result.error);
                        } else if (result?.load) {
                          setLoadSnapshot(result.load);
                          setStatusError('');
                        }
                      } catch (err) {
                        setStatusError(err?.message || 'Status update failed.');
                      } finally {
                        setStatusUpdating(false);
                      }
                    }}
                  >
                    {LOAD_STATUSES.map((status) => (
                      <option key={status} value={status} disabled={!canTransitionStatus(safeLoadSnapshot.status, status) && status !== safeLoadSnapshot.status}>
                        {formatLoadStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                  {statusUpdating && <span style={{ marginLeft: 8, color: '#2980b9', fontSize: 13 }}>Updating...</span>}
                  {statusError && <div style={{ color: 'red', marginTop: 2, fontSize: 12 }}>{statusError}</div>}
                </>
              }
            />
          ) : (
            <div style={{ color: 'red' }}>StickyLoadHeader component missing</div>
          )}
        </div>

        {/* ── New Shipment Action Bar ── */}
        <div style={{ border: '2px solid #2980b9', borderRadius: 12, background: 'linear-gradient(135deg, #eaf6ff 0%, #f8fbff 100%)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a3a5c', letterSpacing: 0.3 }}>
                {isTemplateMode ? '📋 Create Load Template' : '🚚 New Shipment'}
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5a7a9a' }}>
                {isTemplateMode
                  ? 'Fill in the details below and save as a reusable template. No live load will be created.'
                  : 'Complete each section below to build your load. At the end you can send it to the Loadboard, Auction, or Book directly.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/loads/template/load-basics')}
                style={{
                  minHeight: 40, borderRadius: 8, border: '2px solid #8e44ad', background: isTemplateMode ? '#8e44ad' : '#fff',
                  color: isTemplateMode ? '#fff' : '#8e44ad', fontSize: 13, fontWeight: 700, padding: '0 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                📋 Create Load Template
              </button>
              <button
                type="button"
                onClick={() => navigate('/loads/load-basics')}
                style={{
                  minHeight: 40, borderRadius: 8, border: '2px solid #27ae60', background: isTemplateMode ? '#fff' : '#27ae60',
                  color: isTemplateMode ? '#27ae60' : '#fff', fontSize: 13, fontWeight: 700, padding: '0 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                ⚡ Create Load
              </button>
            </div>
          </div>

          {/* Template save row — always visible */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #d0e6fa', paddingTop: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#5a7a9a', minWidth: 110 }}>Save as Template</span>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name..."
              style={{ flex: 1, minWidth: 140, minHeight: 34, borderRadius: 6, border: '1px solid #ccc', padding: '0 10px', fontSize: 12 }}
            />
            <button
              type="button"
              disabled={Boolean(opBusy)}
              onClick={handleSaveTemplate}
              style={{ minHeight: 34, borderRadius: 6, border: '1px solid #2980b9', background: '#2980b9', color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}
            >
              {opBusy === 'save-template' ? 'Saving...' : '💾 Save Template'}
            </button>
          </div>

          {/* From Template row — load mode only */}
          {!isTemplateMode && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#5a7a9a', minWidth: 110 }}>From Template</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                style={{ flex: 1, minWidth: 140, minHeight: 34, borderRadius: 6, border: '1px solid #ccc', padding: '0 8px', fontSize: 12 }}
              >
                <option value="">— Select template —</option>
                {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5a7a9a' }}>
                Count
                <input
                  type="number" min={1} max={50} value={batchCount}
                  onChange={(e) => setBatchCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
                  style={{ width: 54, minHeight: 34, borderRadius: 6, border: '1px solid #ccc', padding: '0 6px', fontSize: 12, textAlign: 'center' }}
                />
              </label>
              <button
                type="button"
                disabled={Boolean(opBusy) || !selectedTemplateId}
                onClick={handleCreateFromTemplate}
                style={{ minHeight: 34, borderRadius: 6, border: '1px solid #27ae60', background: '#27ae60', color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}
              >
                {opBusy === 'batch-create' ? 'Creating...' : `⚡ Create ${batchCount > 1 ? batchCount + ' Loads' : 'Load'}`}
              </button>
            </div>
          )}

          {opMessage && <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 6, background: opMessage.includes('fail') || opMessage.includes('required') ? '#ffeaea' : '#eaffec', color: opMessage.includes('fail') || opMessage.includes('required') ? '#c0392b' : '#27ae60' }}>{opMessage}</div>}
        </div>


        <DynamicSection title="Load Details" complete={loadDetailsSectionComplete}>
          {typeof LoadDetailsSection === 'function' ? (
            <LoadDetailsSection onComplete={() => setLoadDetailsSectionComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>LoadDetailsSection component missing</div>
          )}
        </DynamicSection>


        {/* Customer Section - Compact, 3-column grid */}
        <DynamicSection title="Customer" complete={customerSectionComplete}>
          {typeof CustomerSection === 'function' ? (
            <CustomerSection onComplete={customer => { setSelectedCustomer(customer); setCustomerSectionComplete(true); }} />
          ) : (
            <div style={{ color: 'red' }}>CustomerSection component missing</div>
          )}
          {/* Customer summary card, compact */}
          {selectedCustomer && (
            <div style={{
              marginTop: 10,
              background: '#f8fbff',
              border: '1px solid #e0e6ed',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}>
              <div>
                <b>{selectedCustomer.name || selectedCustomer.companyName}</b><br />
                {selectedCustomer.address && <>{selectedCustomer.address}<br /></>}
                {selectedCustomer.city && <>{selectedCustomer.city}, {selectedCustomer.state} {selectedCustomer.zip}<br /></>}
                {selectedCustomer.creditLimit && <>Credit Limit: <b>${selectedCustomer.creditLimit}</b><br /></>}
                {selectedCustomer.availableCredit && <>Available: <b>${selectedCustomer.availableCredit}</b><br /></>}
              </div>
              <div>
                {selectedCustomer.primaryPhone && <>Primary Phone: {selectedCustomer.primaryPhone}<br /></>}
                {selectedCustomer.email && <>Email: {selectedCustomer.email}<br /></>}
                {selectedCustomer.usdot && <>USDOT: {selectedCustomer.usdot}<br /></>}
                {selectedCustomer.docket && <>Docket: {selectedCustomer.docket}<br /></>}
              </div>
              <div>
                {selectedCustomer.publicNotes && <><b>Public Notes:</b> {selectedCustomer.publicNotes}<br /></>}
                {selectedCustomer.privateNotes && <><b>Private Notes:</b> {selectedCustomer.privateNotes}<br /></>}
                {selectedCustomer.ediStatus && <>EDI: {selectedCustomer.ediStatus}<br /></>}
              </div>
            </div>
          )}
        </DynamicSection>


        {/* Stops Section - Compact table, expandable rows */}
        <DynamicSection title="Stops" complete={stopsSectionComplete}>
          {typeof StopsSection === 'function' ? (
            <StopsSection onComplete={() => setStopsSectionComplete(true)} setStopsData={setStopsData} />
          ) : (
            <div style={{ color: 'red' }}>StopsSection component missing</div>
          )}
          {/* Stops summary table placeholder */}
          {Array.isArray(stopsData) && stopsData.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f4f8fb' }}>
                  <tr>
                    <th>Type</th>
                    <th>Address</th>
                    <th>Date/Time</th>
                    <th>Contact</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {stopsData.map((stop, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e0e6ed' }}>
                      <td>{stop.type}</td>
                      <td>{stop.address}</td>
                      <td>{stop.datetime}</td>
                      <td>{stop.contact}</td>
                      <td>{stop.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DynamicSection>


        {/* Lane Intelligence Section - Compact summary */}
        <DynamicSection title="Lane Intelligence" complete={laneIntelligenceComplete}>
          {typeof LaneIntelligencePanel === 'function' ? (
            <LaneIntelligencePanel stops={safeStopsData} carrierAssigned={false} onComplete={() => setLaneIntelligenceComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>LaneIntelligencePanel component missing</div>
          )}
        </DynamicSection>


        {/* Carrier Section - Compact, 3-column grid and summary */}
        <DynamicSection title="Carrier" complete={carrierSectionComplete}>
          {typeof CarrierSection === 'function' ? (
            <CarrierSection enabled={laneIntelligenceComplete} onComplete={carrier => { setSelectedCarrier(carrier); setCarrierSectionComplete(true); }} />
          ) : (
            <div style={{ color: 'red' }}>CarrierSection component missing</div>
          )}
          {/* Carrier summary card, compact */}
          {selectedCarrier && (
            <div style={{
              marginTop: 10,
              background: '#f8fbff',
              border: '1px solid #e0e6ed',
              borderRadius: 8,
              padding: 12,
              fontSize: 14,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
            }}>
              <div>
                <b>{selectedCarrier.name || selectedCarrier.companyName}</b><br />
                {selectedCarrier.address && <>{selectedCarrier.address}<br /></>}
                {selectedCarrier.city && <>{selectedCarrier.city}, {selectedCarrier.state} {selectedCarrier.zip}<br /></>}
                {selectedCarrier.docket && <>Docket: {selectedCarrier.docket}<br /></>}
              </div>
              <div>
                {selectedCarrier.primaryContact && <>Contact: {selectedCarrier.primaryContact}<br /></>}
                {selectedCarrier.phone && <>Phone: {selectedCarrier.phone}<br /></>}
                {selectedCarrier.email && <>Email: {selectedCarrier.email}<br /></>}
                {selectedCarrier.usdot && <>USDOT: {selectedCarrier.usdot}<br /></>}
              </div>
              <div>
                {selectedCarrier.publicNotes && <><b>Public Notes:</b> {selectedCarrier.publicNotes}<br /></>}
                {selectedCarrier.privateNotes && <><b>Private Notes:</b> {selectedCarrier.privateNotes}<br /></>}
                {selectedCarrier.insuranceStatus && <>Insurance: {selectedCarrier.insuranceStatus}<br /></>}
              </div>
            </div>
          )}
        </DynamicSection>


        {/* Financials Section - Compact table and summary */}
        <DynamicSection title="Financials" complete={financialSectionComplete}>
          {typeof FinancialSection === 'function' ? (
            <FinancialSection enabled={stopsSectionComplete && carrierSectionComplete} laneData={laneIntelligenceData || {}} onComplete={() => setFinancialSectionComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>FinancialSection component missing</div>
          )}
          {/* Financials summary table placeholder */}
          <div style={{ marginTop: 10 }}>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f4f8fb' }}>
                <tr>
                  <th>Type</th>
                  <th>Company</th>
                  <th>Description</th>
                  <th>Rate</th>
                  <th>Quantity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {/* Example rows, replace with real data */}
                <tr>
                  <td>Income</td>
                  <td>Pro Clear Aquatic Systems</td>
                  <td>Flat Rate</td>
                  <td>$680.00</td>
                  <td>1</td>
                  <td>$680.00</td>
                </tr>
                <tr>
                  <td>Expense</td>
                  <td>US 1 LOGISTICS</td>
                  <td>Flat Rate</td>
                  <td>$300.00</td>
                  <td>1</td>
                  <td>$300.00</td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* ── Load Submission Panel — appears when all sections complete ── */}
          {allSectionsComplete && !isTemplateMode && (
            <div style={{ marginTop: 24, border: '2px solid #2980b9', borderRadius: 12, background: 'linear-gradient(135deg, #eaf6ff 0%, #f0f6ff 100%)', padding: 20 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#1a3a5c' }}>Load Ready — Choose Next Step</h3>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5a7a9a' }}>
                All sections are complete. Send this load to the Loadboard for capacity operations, start a Carrier Auction, or Book directly with the assigned carrier.
              </p>

              {submitMessage && (
                <div style={{ fontSize: 12, padding: '8px 12px', borderRadius: 6, marginBottom: 12, background: submitMessage.includes('fail') || submitMessage.includes('first') ? '#ffeaea' : '#eaffec', color: submitMessage.includes('fail') || submitMessage.includes('first') ? '#c0392b' : '#27ae60' }}>
                  {submitMessage}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
                {/* Send to Loadboard */}
                <button
                  type="button"
                  disabled={Boolean(submitBusy)}
                  onClick={handleSendToLoadboard}
                  style={{
                    flex: 1, minWidth: 180, minHeight: 56, borderRadius: 10,
                    border: '2px solid #2980b9', background: '#2980b9', color: '#fff',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  }}
                >
                  <span>{submitBusy === 'loadboard' ? 'Posting...' : '📋 Send to Loadboard'}</span>
                  <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>Post for capacity ops to work</span>
                </button>

                {/* Start Carrier Auction */}
                <button
                  type="button"
                  disabled={Boolean(submitBusy)}
                  onClick={handleOpenAuctionPanel}
                  style={{
                    flex: 1, minWidth: 180, minHeight: 56, borderRadius: 10,
                    border: '2px solid #e67e22', background: '#e67e22', color: '#fff',
                    fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  }}
                >
                  <span>🔔 Start Carrier Auction</span>
                  <span style={{ fontSize: 11, fontWeight: 400, opacity: 0.85 }}>Build carrier bid list & notify</span>
                </button>

                {/* Book Directly */}
                <div style={{ flex: 1, minWidth: 180 }}>
                  <BookLoadButton
                    carriers={carriersList}
                    load={loadObj}
                    onBook={handleBookLoad}
                  />
                </div>
              </div>
              {bookingMessage && <div style={{ color: bookingMessage.includes('success') ? '#27ae60' : '#c0392b', marginTop: 10, fontSize: 13 }}>{bookingMessage}</div>}

              {/* ── Carrier Auction Panel ── */}
              {showAuctionPanel && (
                <div style={{ marginTop: 18, border: '2px solid #e67e22', borderRadius: 10, background: '#fffaf5', padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#c0650a' }}>🔔 Carrier Auction — Build Bid List</h4>
                    <button type="button" onClick={() => setShowAuctionPanel(false)} style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer', color: '#888' }}>✕</button>
                  </div>
                  <p style={{ fontSize: 12, color: '#7a5a3a', margin: '0 0 12px' }}>
                    Select carriers to receive bid notifications. OpScale compliance checks flag potential risks automatically.
                  </p>

                  {/* Search carriers */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      value={auctionCarrierSearch}
                      onChange={(e) => setAuctionCarrierSearch(e.target.value)}
                      placeholder="Search carriers by name, MC#, USDOT#, city..."
                      style={{ flex: 1, minHeight: 34, borderRadius: 6, border: '1px solid #ddd', padding: '0 10px', fontSize: 12 }}
                    />
                    <textarea
                      value={auctionNotes}
                      onChange={(e) => setAuctionNotes(e.target.value)}
                      placeholder="Auction notes for carriers (optional)..."
                      rows={1}
                      style={{ flex: 1, minHeight: 34, borderRadius: 6, border: '1px solid #ddd', padding: '6px 10px', fontSize: 12, resize: 'vertical' }}
                    />
                  </div>

                  {/* Selected carrier count */}
                  <div style={{ fontSize: 12, marginBottom: 8, color: '#5a4a3a' }}>
                    <b>{auctionCarrierList.length}</b> carrier(s) selected for bid list
                    {auctionCarrierList.length > 0 && (
                      <button type="button" onClick={() => setAuctionCarrierList([])} style={{ marginLeft: 8, fontSize: 11, border: 'none', background: 'transparent', color: '#c0392b', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
                    )}
                  </div>

                  {/* Carrier table */}
                  {auctionCarriersLoading ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#888' }}>Loading carriers...</div>
                  ) : (
                    <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid #e0d6cc', borderRadius: 8, background: '#fff' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: '#fef6ee', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, width: 36 }}></th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>Carrier</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>MC#</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>USDOT#</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>Location</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700 }}>Contact</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: 700, minWidth: 200 }}>OpScale Compliance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAuctionCarriers.length === 0 && (
                            <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: '#999' }}>No carriers found.</td></tr>
                          )}
                          {filteredAuctionCarriers.map((carrier) => {
                            const cId = carrier.id || carrier._id;
                            const isSelected = auctionCarrierList.some(c => (c.id || c._id) === cId);
                            const warnings = getCarrierComplianceWarnings(carrier);
                            const hasCritical = warnings.some(w => w.level === 'critical');
                            return (
                              <tr key={cId} style={{
                                borderTop: '1px solid #f0e6dc',
                                background: isSelected ? (hasCritical ? '#fff5f5' : '#f0faf0') : 'transparent',
                                opacity: hasCritical && !isSelected ? 0.7 : 1,
                              }}>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <input type="checkbox" checked={isSelected} onChange={() => toggleAuctionCarrier(carrier)} />
                                </td>
                                <td style={{ padding: '8px', fontWeight: 600 }}>{carrier.name || carrier.companyName || '—'}</td>
                                <td style={{ padding: '8px' }}>{carrier.mcNumber || '—'}</td>
                                <td style={{ padding: '8px' }}>{carrier.usdotNumber || carrier.usdot || '—'}</td>
                                <td style={{ padding: '8px' }}>{[carrier.city, carrier.state].filter(Boolean).join(', ') || '—'}</td>
                                <td style={{ padding: '8px' }}>{carrier.email || carrier.phone || '—'}</td>
                                <td style={{ padding: '8px' }}>
                                  {warnings.length === 0 ? (
                                    <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 11 }}>✔ Clear</span>
                                  ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {warnings.map((w, idx) => (
                                        <span key={idx} style={{
                                          fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                          background: w.level === 'critical' ? '#fde8e8' : '#fef3cd',
                                          color: w.level === 'critical' ? '#c0392b' : '#856404',
                                          display: 'inline-block',
                                        }}>
                                          {w.level === 'critical' ? '🚨' : '⚠️'} {w.text}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Send to Auction button */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 14, alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={Boolean(submitBusy) || auctionCarrierList.length === 0}
                      onClick={handleSendToAuction}
                      style={{
                        minHeight: 40, borderRadius: 8, border: '2px solid #e67e22', background: '#e67e22', color: '#fff',
                        fontSize: 13, fontWeight: 700, padding: '0 20px', cursor: 'pointer',
                      }}
                    >
                      {submitBusy === 'auction' ? 'Sending...' : `🔔 Send Auction to ${auctionCarrierList.length} Carrier(s)`}
                    </button>
                    {auctionCarrierList.some(c => getCarrierComplianceWarnings(c).some(w => w.level === 'critical')) && (
                      <span style={{ fontSize: 12, color: '#c0392b', fontWeight: 600 }}>
                        🚨 Warning: One or more selected carriers have critical compliance issues. Review before sending.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Template mode: save template button at end */}
          {allSectionsComplete && isTemplateMode && (
            <div style={{ marginTop: 24, border: '2px solid #8e44ad', borderRadius: 12, background: '#faf5ff', padding: 20, textAlign: 'center' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#6c3483' }}>📋 Template Complete</h3>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#7d5a9a' }}>
                All sections are filled. Save this as a reusable template — no live load will be created.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                <input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Template name..."
                  style={{ minWidth: 200, minHeight: 38, borderRadius: 6, border: '1px solid #ccc', padding: '0 12px', fontSize: 13 }}
                />
                <button
                  type="button"
                  disabled={Boolean(submitBusy)}
                  onClick={handleSaveAsTemplateOnly}
                  style={{
                    minHeight: 40, borderRadius: 8, border: '2px solid #8e44ad', background: '#8e44ad', color: '#fff',
                    fontSize: 14, fontWeight: 700, padding: '0 24px', cursor: 'pointer',
                  }}
                >
                  {submitBusy === 'save-template' ? 'Saving...' : '💾 Save Template'}
                </button>
              </div>
              {submitMessage && <div style={{ marginTop: 10, fontSize: 12, color: submitMessage.includes('success') ? '#27ae60' : '#c0392b' }}>{submitMessage}</div>}
            </div>
          )}
        </DynamicSection>

        <DynamicSection title="Documents & Dispatch" complete={false}>
          <div>Documents Section Placeholder</div>
        </DynamicSection>

        <DynamicSection title="Activity Log" complete={false}>
          <div>Activity Log Panel Placeholder</div>
        </DynamicSection>
      </div>
    </ErrorBoundary>
  );
  // ...existing code...

  // ChecklistDrawer component
  function ChecklistDrawer({ checkpoints }) {
    const [expanded, setExpanded] = useState(false);
    // Icon logic with color and tooltip
    const getIcon = (done, issue, needsAction, label, risk) => {
      let color = '#bdc3c7';
      let icon = '▢';
      let tooltip = label;
      if (issue) {
        color = '#e74c3c';
        icon = '⚠️';
        tooltip += ' — Issue flagged';
        if (risk) tooltip += ` — Risk: ${risk}`;
      } else if (done) {
        color = '#27ae60';
        icon = '✔';
        tooltip += ' — Completed';
      } else if (needsAction) {
        color = '#f1c40f';
        icon = '⚡';
        tooltip += ' — Needs action';
        if (risk) tooltip += ` — Risk: ${risk}`;
      } else {
        tooltip += ' — Not started';
      }
      return <span title={tooltip} style={{ color, fontWeight: 600 }}>{icon}</span>;
    };

    // Steps per phase
    const phases = [
      {
        key: 'intake',
        label: 'Intake',
        steps: [
          { key: 'customer_added', label: 'Customer Added' },
          { key: 'credit_verified', label: 'Credit Verified' },
          { key: 'load_type_selected', label: 'Load Type Selected' },
        ],
      },
      {
        key: 'pickup',
        label: 'Pickup',
        steps: [
          { key: 'origin_confirmed', label: 'Origin Confirmed' },
          { key: 'pickup_method', label: 'Pickup Method', isConditional: true },
          { key: 'appt_scheduled', label: 'Appointment Scheduled', conditional: 'APPT' },
          { key: 'fcfs_confirmed', label: 'FCFS Confirmed', conditional: 'FCFS' },
          { key: 'bol_received', label: 'BOL Received (optional)' },
        ],
      },
      {
        key: 'carrier',
        label: 'Carrier',
        steps: [
          { key: 'carrier_selected', label: 'Carrier Selected' },
          { key: 'rate_confirmed', label: 'Rate Confirmed' },
          { key: 'rate_con_sent', label: 'Rate Con Sent' },
          { key: 'rate_con_signed', label: 'Rate Con Signed' },
        ],
      },
      {
        key: 'transit',
        label: 'Transit',
        steps: [
          { key: 'picked_up', label: 'Picked Up' },
          { key: 'gps_tracking_active', label: 'GPS Tracking Active' },
          { key: 'en_route', label: 'En Route' },
        ],
      },
      {
        key: 'delivery',
        label: 'Delivery',
        steps: [
          { key: 'destination_confirmed', label: 'Destination Confirmed' },
          { key: 'delivery_method', label: 'Delivery Method', isConditional: true },
          { key: 'appt_scheduled', label: 'Appointment Scheduled', conditional: 'APPT' },
          { key: 'fcfs_confirmed', label: 'FCFS Confirmed', conditional: 'FCFS' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'pod_received', label: 'POD Received' },
        ],
      },
    ];

    // Render checklist
    return (
      <div style={{ marginTop: 8 }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            color: '#2980b9',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: 13,
            marginBottom: 4,
          }}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? 'Hide Details ▲' : 'Show Details ▼'}
        </button>
        {expanded && (
          <div style={{ display: 'grid', gap: 10, background: '#f8f9fa', borderRadius: 8, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            {phases.map((phase) => (
              <div key={phase.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 700, minWidth: 80 }}>{phase.label}</span>
                {phase.steps.map((step) => {
                  // Conditional rendering for pickup/delivery method
                  if (step.isConditional) {
                    const method = checkpoints[phase.key][step.key];
                    if (step.key === 'pickup_method' || step.key === 'delivery_method') {
                      return method ? (
                        <span key={step.key} title={step.label} style={{ color: '#2980b9', fontWeight: 600 }}>
                          {method}
                        </span>
                      ) : null;
                    }
                    // Only show conditional steps if method matches
                    if (step.conditional && checkpoints[phase.key][step.key.replace('_scheduled', '_method')] !== step.conditional) return null;
                  }
                  // Status logic
                  const done = !!checkpoints[phase.key][step.key];
                  const issue = checkpoints.issues && checkpoints.issues.some((iss) => iss.phase === phase.key && iss.step === step.key);
                  const needsAction = !done && !issue && (step.key !== 'bol_received');
                  // Example risk logic (can be expanded)
                  let risk = null;
                  if (needsAction && step.label.toLowerCase().includes('appointment')) risk = 'HIGH';
                  if (issue && step.label.toLowerCase().includes('fcfs')) risk = 'MEDIUM';
                  return (
                    <span key={step.key} style={{ marginRight: 6 }}>
                      {getIcon(done, issue, needsAction, step.label, risk)}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
// ...existing code...

// Carrier search logic moved into a function
function searchCarriers({ includeFmcsa, mockFmcsaCarriers, query, internalResults, setCarrierResults, setCarrierActionMessage, setCarrierError, setCarrierLoading }) {
  try {
    let fmcsaResults = [];
    if (includeFmcsa) {
      fmcsaResults = mockFmcsaCarriers
        .filter((carrier) => {
          if (!query) return true;
          return [carrier.companyName, carrier.mcNumber, carrier.usdotNumber]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        })
        .map((carrier) => ({ ...carrier, source: 'fmcsa', existsInInternal: false }))
        .slice(0, 15);
    }

    const merged = [...internalResults];
    fmcsaResults.forEach((fmcsaCarrier) => {
      const alreadyExists = internalResults.some((internalCarrier) => (
        String(internalCarrier.mcNumber || '').toLowerCase() === String(fmcsaCarrier.mcNumber || '').toLowerCase()
        || String(internalCarrier.usdotNumber || '').toLowerCase() === String(fmcsaCarrier.usdotNumber || '').toLowerCase()
      ));
      merged.push({ ...fmcsaCarrier, existsInInternal: alreadyExists });
    });

    setCarrierResults(merged);
    if (!merged.length) {
      setCarrierActionMessage('No carriers found for this search.');
    }
  } catch (error) {
    setCarrierResults([]);
    setCarrierError(error?.message || 'Carrier search failed');
  } finally {
    setCarrierLoading(false);
  }
}

export default LoadManagement;
