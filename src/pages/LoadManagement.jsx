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
import { getLoadDetail } from '../api/loadsClient';
import { mockLocations } from '../mock/mockLocations';
import LaneIntelligencePanel from '../components/LaneIntelligencePanel';
import CarrierSection from '../components/CarrierSection';
import FinancialSection from '../components/FinancialSection';

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

function LoadManagement({ pageTitle = 'Load Management', activeTab = 'load-basics' }) {
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
  const [locations, setLocations] = useState(() => mockLocations.map((location) => ({
    ...location,
    label: `${location.city}, ${location.state} ${location.zip}`,
  })));
  const [stopLocationQuery, setStopLocationQuery] = useState('');
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({ city: '', state: '', zip: '' });
  const [locationMessage, setLocationMessage] = useState('');
  // Load lifecycle checkpoints data structure
  const [loadSnapshot, setLoadSnapshot] = useState(null);
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

  // Defensive checks for key props
  const safeLoadSnapshot = loadSnapshot || {};
  const safeStopsData = Array.isArray(stopsData) ? stopsData : [];

  return (
    <ErrorBoundary>
      <div style={{ display: 'grid', gap: 16, padding: 16, background: `linear-gradient(180deg, rgba(var(--glow), 0.08), transparent 30%)`, borderRadius: 14 }}>
        {/* Sticky Load Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
          {/* StickyLoadHeader with live color logic */}
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
            />
          ) : (
            <div style={{ color: 'red' }}>StickyLoadHeader component missing</div>
          )}
          {/* Thin Progress Bar UI */}
          <div
            style={{
              width: '100%',
              height: 6,
              borderRadius: 3,
              background: '#ecf0f1',
              marginTop: 6,
              position: 'relative',
              overflow: 'hidden',
            }}
            title={`Progress: ${progress.percent}%`}
          >
            <div
              style={{
                width: `${progress.percent}%`,
                height: '100%',
                background: progressBarColor,
                transition: 'width 0.3s',
              }}
            />
            {/* Progress percent and status */}
            <span
              style={{
                position: 'absolute',
                right: 8,
                top: -18,
                fontSize: 12,
                fontWeight: 600,
                color: progressBarColor,
                background: '#fff',
                padding: '2px 6px',
                borderRadius: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              {progress.percent}%
            </span>
          </div>
        </div>
        {/* Expandable Checklist Drawer */}
        {typeof ChecklistDrawer === 'function' ? (
          <ChecklistDrawer checkpoints={loadCheckpoints || {}} />
        ) : (
          <div style={{ color: 'red' }}>ChecklistDrawer component missing</div>
        )}

        <CollapsibleSection title="Customer" complete={customerSectionComplete} defaultOpen={true}>
          {typeof CustomerSection === 'function' ? (
            <CustomerSection onComplete={() => setCustomerSectionComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>CustomerSection component missing</div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Stops" complete={stopsSectionComplete} defaultOpen={true}>
          {typeof StopsSection === 'function' ? (
            <StopsSection onComplete={() => setStopsSectionComplete(true)} setStopsData={setStopsData} />
          ) : (
            <div style={{ color: 'red' }}>StopsSection component missing</div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Lane Intelligence" complete={laneIntelligenceComplete} defaultOpen={true}>
          {typeof LaneIntelligencePanel === 'function' ? (
            <LaneIntelligencePanel stops={safeStopsData} carrierAssigned={false} onComplete={() => setLaneIntelligenceComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>LaneIntelligencePanel component missing</div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Carrier" complete={carrierSectionComplete} defaultOpen={true}>
          {typeof CarrierSection === 'function' ? (
            <CarrierSection enabled={laneIntelligenceComplete} onComplete={() => setCarrierSectionComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>CarrierSection component missing</div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Financials" complete={financialSectionComplete} defaultOpen={true}>
          {typeof FinancialSection === 'function' ? (
            <FinancialSection enabled={stopsSectionComplete && carrierSectionComplete} laneData={laneIntelligenceData || {}} onComplete={() => setFinancialSectionComplete(true)} />
          ) : (
            <div style={{ color: 'red' }}>FinancialSection component missing</div>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Documents & Dispatch" complete={false} defaultOpen={true}>
          <div>Documents Section Placeholder</div>
        </CollapsibleSection>

        <CollapsibleSection title="Activity Log" complete={false} defaultOpen={true}>
          <div>Activity Log Panel Placeholder</div>
        </CollapsibleSection>
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
