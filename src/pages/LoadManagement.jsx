import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
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

export default function LoadManagement({ pageTitle = 'Load Management', activeTab = 'load-basics' }) {
  const navigate = useNavigate();
  const { loadId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = themes[theme];
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

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16, background: `linear-gradient(180deg, rgba(var(--glow), 0.08), transparent 30%)`, borderRadius: 14 }}>
      {/* Sticky Load Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10 }}>
        {/* StickyLoadHeader with live color logic */}
        <StickyLoadHeader
          loadNumber={loadSnapshot?.number || '123456'}
          status={loadSnapshot?.status || 'Open'}
          customer={loadSnapshot?.customer || 'Acme Corp'}
          totalMiles={loadSnapshot?.totalMiles || 1200}
          sellRate={loadSnapshot?.sellRate || 5000}
          buyRate={loadSnapshot?.buyRate || 4300}
          grossMargin={(loadSnapshot?.sellRate || 5000) - (loadSnapshot?.buyRate || 4300)}
          marginPct={((loadSnapshot?.sellRate || 5000) - (loadSnapshot?.buyRate || 4300)) / (loadSnapshot?.sellRate || 5000) * 100}
          riskIndicator={loadSnapshot?.riskIndicator || 'Medium'}
        />
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
      <ChecklistDrawer checkpoints={loadCheckpoints} />

      <CollapsibleSection title="Customer" complete={customerSectionComplete} defaultOpen={true}>
        <CustomerSection onComplete={() => setCustomerSectionComplete(true)} />
      </CollapsibleSection>

      <CollapsibleSection title="Stops" complete={stopsSectionComplete} defaultOpen={true}>
        <StopsSection onComplete={() => setStopsSectionComplete(true)} setStopsData={setStopsData} />
      </CollapsibleSection>

      <CollapsibleSection title="Lane Intelligence" complete={laneIntelligenceComplete} defaultOpen={true}>
        <LaneIntelligencePanel stops={stopsData} carrierAssigned={false} onComplete={() => setLaneIntelligenceComplete(true)} />
      </CollapsibleSection>

      <CollapsibleSection title="Carrier" complete={carrierSectionComplete} defaultOpen={true}>
        <CarrierSection enabled={laneIntelligenceComplete} onComplete={() => setCarrierSectionComplete(true)} />
      </CollapsibleSection>

      <CollapsibleSection title="Financials" complete={financialSectionComplete} defaultOpen={true}>
        <FinancialSection enabled={stopsSectionComplete && carrierSectionComplete} laneData={laneIntelligenceData} onComplete={() => setFinancialSectionComplete(true)} />
      </CollapsibleSection>

      <CollapsibleSection title="Documents & Dispatch" complete={false} defaultOpen={true}>
        {/* TODO: Implement DocumentsSection, readiness score, checklist, dispatch actions */}
        <div>Documents Section Placeholder</div>
      </CollapsibleSection>

      <CollapsibleSection title="Activity Log" complete={false} defaultOpen={true}>
        {/* TODO: Implement ActivityLogPanel, chronological feed */}
        <div>Activity Log Panel Placeholder</div>
      </CollapsibleSection>
    </div>
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

  const addCarrierFromResult = async (carrier) => {
    setCarrierError('');
    setCarrierActionMessage('');

    if (carrier.existsInInternal || carrier.source === 'internal') {
      setSelectedCarrier(carrier);
      setCarrierActionMessage('Carrier selected from internal database.');
      return;
    }

    setCarrierLoading(true);
    try {
      const created = await createCarrier({
        name: carrier.companyName,
        mcNumber: carrier.mcNumber,
        phone: carrier.phone === 'Not Set' ? '' : carrier.phone,
        email: carrier.email === 'Not Set' ? '' : carrier.email,
      });

      if (created?.error) {
        throw new Error(created.error);
      }

      const mapped = mapInternalCarrier(created);
      setSelectedCarrier(mapped);
      setCarrierResults((prev) => prev.map((row) => (
        row.mcNumber === carrier.mcNumber || row.usdotNumber === carrier.usdotNumber
          ? { ...row, existsInInternal: true }
          : row
      )));
      setCarrierActionMessage('Carrier added to internal database and assigned to this load.');
    } catch (error) {
      setCarrierError(error?.message || 'Could not add carrier');
    } finally {
      setCarrierLoading(false);
    }
  };

  const getCarrierRowKey = (carrier) => `${carrier.source || 'unknown'}-${carrier.mcNumber || 'none'}-${carrier.usdotNumber || 'none'}-${carrier.companyName || 'carrier'}`;

  const sortedCarrierResults = useMemo(() => {
    const rows = [...carrierResults];
    const factor = carrierSort.dir === 'asc' ? 1 : -1;
    rows.sort((left, right) => {
      const leftValue = String(left?.[carrierSort.key] || '');
      const rightValue = String(right?.[carrierSort.key] || '');
      return leftValue.localeCompare(rightValue) * factor;
    });
    return rows;
  }, [carrierResults, carrierSort.dir, carrierSort.key]);

  const toggleCarrierSort = (key) => {
    setCarrierSort((previous) => {
      if (previous.key === key) {
        return { key, dir: previous.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const toggleCarrierSelection = (rowKey, checked) => {
    setSelectedCarrierRowKeys((previous) => {
      if (checked) {
        if (previous.includes(rowKey)) return previous;
        return [...previous, rowKey];
      }
      return previous.filter((entry) => entry !== rowKey);
    });
  };

  const allCarriersSelected = sortedCarrierResults.length > 0
    && sortedCarrierResults.every((carrier) => selectedCarrierRowKeys.includes(getCarrierRowKey(carrier)));

  const toggleSelectAllCarriers = (checked) => {
    if (!checked) {
      setSelectedCarrierRowKeys([]);
      return;
    }
    setSelectedCarrierRowKeys(sortedCarrierResults.map((carrier) => getCarrierRowKey(carrier)));
  };

  const useSelectedCarriers = async () => {
    const selectedRows = sortedCarrierResults.filter((carrier) => selectedCarrierRowKeys.includes(getCarrierRowKey(carrier)));
    if (!selectedRows.length) return;

    for (const carrier of selectedRows) {
      await addCarrierFromResult(carrier);
    }
    setCarrierActionMessage(`Processed ${selectedRows.length} selected carrier(s).`);
  };

  const filteredLocations = locations
    .filter((location) => {
      const query = stopLocationQuery.trim().toLowerCase();
      if (!query) return true;
      return [location.city, location.state, location.zip, location.label]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    })
    .slice(0, 8);

  const createLocation = () => {
    const city = newLocationForm.city.trim();
    const state = newLocationForm.state.trim().toUpperCase();
    const zip = newLocationForm.zip.trim();

    if (!city || !state || !zip) {
      setLocationMessage('City, state, and ZIP are required to create a location.');
      return;
    }

    const locationLabel = `${city}, ${state} ${zip}`;
    const exists = locations.some((location) => location.label.toLowerCase() === locationLabel.toLowerCase());
    if (exists) {
      setLocationMessage('That location already exists in this list.');
      return;
    }

    const addedLocation = { city, state, zip, label: locationLabel };
    setLocations((prev) => [addedLocation, ...prev]);
    setStopLocationQuery(locationLabel);
    setNewLocationForm({ city: '', state: '', zip: '' });
    setShowCreateLocation(false);
    setLocationMessage('Location added and selected for this stop.');
  };

  const incomeTotal = useMemo(
    () => incomeItems.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.quantity || 0)), 0),
    [incomeItems]
  );
  const expenseTotal = useMemo(
    () => expenseItems.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.quantity || 0)), 0),
    [expenseItems]
  );
  const grossProfit = incomeTotal - expenseTotal;
  const grossProfitPct = incomeTotal > 0 ? (grossProfit / incomeTotal) * 100 : 0;

  useEffect(() => {
    const valid = new Set(carrierResults.map((carrier) => getCarrierRowKey(carrier)));
    setSelectedCarrierRowKeys((previous) => previous.filter((key) => valid.has(key)));
  }, [carrierResults]);

  useEffect(() => {
    const valid = new Set(incomeItems.map((item) => item.id));
    setSelectedIncomeIds((previous) => previous.filter((id) => valid.has(id)));
  }, [incomeItems]);

  useEffect(() => {
    const valid = new Set(expenseItems.map((item) => item.id));
    setSelectedExpenseIds((previous) => previous.filter((id) => valid.has(id)));
  }, [expenseItems]);

  const addLineItem = (setter, kind) => {
    setter((prev) => [
      ...prev,
      {
        id: `${kind}-${Date.now()}-${prev.length}`,
        company: '',
        description: '',
        notes: '',
        rate: '',
        quantity: '',
      },
    ]);
  };

  const updateLineItem = (setter, id, key, value) => {
    setter((prev) => prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)));
  };

  const removeLineItem = (setter, id) => {
    setter((prev) => prev.filter((item) => item.id !== id));
  };

  const duplicateLineItem = (setter, id, kind) => {
    setter((prev) => {
      const source = prev.find((item) => item.id === id);
      if (!source) return prev;
      return [
        ...prev,
        {
          ...source,
          id: `${kind}-${Date.now()}-${prev.length}`,
        },
      ];
    });
  };

  const sortLineItems = (rows, sortConfig) => {
    const factor = sortConfig.dir === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      if (sortConfig.key === 'total') {
        const leftTotal = Number(left.rate || 0) * Number(left.quantity || 0);
        const rightTotal = Number(right.rate || 0) * Number(right.quantity || 0);
        return (leftTotal - rightTotal) * factor;
      }
      if (sortConfig.key === 'rate' || sortConfig.key === 'quantity') {
        return (Number(left[sortConfig.key] || 0) - Number(right[sortConfig.key] || 0)) * factor;
      }
      return String(left[sortConfig.key] || '').localeCompare(String(right[sortConfig.key] || '')) * factor;
    });
  };

  const sortedIncomeItems = useMemo(() => sortLineItems(incomeItems, incomeSort), [incomeItems, incomeSort]);
  const sortedExpenseItems = useMemo(() => sortLineItems(expenseItems, expenseSort), [expenseItems, expenseSort]);

  const toggleLineItemSort = (target, key) => {
    const setter = target === 'income' ? setIncomeSort : setExpenseSort;
    setter((previous) => {
      if (previous.key === key) {
        return { key, dir: previous.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const toggleLineSelection = (target, id, checked) => {
    const setter = target === 'income' ? setSelectedIncomeIds : setSelectedExpenseIds;
    setter((previous) => {
      if (checked) {
        if (previous.includes(id)) return previous;
        return [...previous, id];
      }
      return previous.filter((entry) => entry !== id);
    });
  };

  const allIncomeSelected = sortedIncomeItems.length > 0 && sortedIncomeItems.every((item) => selectedIncomeIds.includes(item.id));
  const allExpenseSelected = sortedExpenseItems.length > 0 && sortedExpenseItems.every((item) => selectedExpenseIds.includes(item.id));

  const toggleSelectAllLineItems = (target, checked) => {
    const rows = target === 'income' ? sortedIncomeItems : sortedExpenseItems;
    const setter = target === 'income' ? setSelectedIncomeIds : setSelectedExpenseIds;
    if (!checked) {
      setter([]);
      return;
    }
    setter(rows.map((item) => item.id));
  };

  const removeSelectedLineItems = (target) => {
    if (target === 'income') {
      const selected = new Set(selectedIncomeIds);
      setIncomeItems((previous) => previous.filter((item) => !selected.has(item.id)));
      setSelectedIncomeIds([]);
      return;
    }
    const selected = new Set(selectedExpenseIds);
    setExpenseItems((previous) => previous.filter((item) => !selected.has(item.id)));
    setSelectedExpenseIds([]);
  };

  const saveCurrentStop = () => {
    const locationValue = stopLocationQuery.trim();
    if (!locationValue) {
      setLocationMessage('Select or create a stop location before saving.');
      return;
    }

    const matchedLocation = locations.find((location) => location.label.toLowerCase() === locationValue.toLowerCase());
    const newStop = {
      id: `stop-${Date.now()}`,
      order: stops.length + 1,
      action: stopActionType,
      location: locationValue,
      address: matchedLocation ? `${matchedLocation.city}, ${matchedLocation.state} ${matchedLocation.zip}` : locationValue,
      cargoDescription: stopForm.cargoDescription,
      referenceNumbers: stopForm.referenceNumbers,
      scheduleStart: stopForm.scheduleStart,
      scheduleEnd: stopForm.scheduleEnd,
      actualArrival: stopForm.actualArrival,
      actualDeparture: stopForm.actualDeparture,
      privateNotes: stopForm.driverInstructions,
      showOn: showOnCustomerDocs ? 'Customer Docs' : 'Internal Only',
    };

    setStops((prev) => [...prev, newStop]);
    setLocationMessage('Stop saved.');
    setStopLocationQuery('');
    setStopForm({
      cargoDescription: '',
      referenceNumbers: '',
      scheduleStart: '',
      scheduleEnd: '',
      driverInstructions: '',
      actualArrival: '',
      actualDeparture: '',
      unloadingMinutes: '',
    });
    setShowOnCustomerDocs(true);
  };

  const pushHistoryRow = (type) => {
    setArApHistory((prev) => [
      {
        id: `hist-${Date.now()}-${prev.length}`,
        type,
        invoiceDate: new Date().toISOString().slice(0, 10),
        company: 'Not Set',
        billingAmount: 0,
        paymentDate: '',
        actualAmount: 0,
        notes: '',
        paidInFull: false,
      },
      ...prev,
    ]);
  };

  const updateHistoryRow = (id, key, value) => {
    setArApHistory((prev) => prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  };

  const persistDraft = () => {
    const draftKey = `load-management-draft-${loadId || 'new'}`;
    const draftPayload = {
      updatedAt: new Date().toISOString(),
      loadId: loadId || null,
      selectedCarrier,
      stops,
      incomeItems,
      expenseItems,
      targetRates,
      freightChargeTerms,
      arApHistory,
    };
    localStorage.setItem(draftKey, JSON.stringify(draftPayload));
    setSaveMessage('Draft saved.');
  };

  useEffect(() => {
    let mounted = true;

    const loadDetails = async () => {
      if (!loadId) {
        setLoadSnapshot(null);
        return;
      }

      const result = await getLoadDetail(decodeURIComponent(loadId));
      if (!mounted || result?.error) return;

      const nextLoad = result?.load || null;
      setLoadSnapshot(nextLoad);
      setCustomerBilling((prev) => ({
        ...prev,
        name: prev.name || nextLoad?.customer?.name || '',
      }));
      setDocumentTerms((prev) => ({
        ...prev,
        shipperName: prev.shipperName || companyBranding.companyName || '',
        shipperAddress: prev.shipperAddress || companyBranding.address || '',
      }));
    };

    loadDetails();

    return () => {
      mounted = false;
    };
  }, [loadId]);

  const updateCustomerBilling = (field, value) => {
    setCustomerBilling((prev) => ({ ...prev, [field]: value }));
  };

  const updateDocumentTerms = (field, value) => {
    setDocumentTerms((prev) => ({ ...prev, [field]: value }));
  };

  const generateAndDownloadDocument = async (type, label) => {
    try {
      setDocumentBusyType(type);
      setFinancialNotice('');

      let resolvedLoad = loadSnapshot;
      if (!resolvedLoad && loadId) {
        const loadResponse = await getLoadDetail(decodeURIComponent(loadId));
        if (loadResponse?.error) throw new Error(loadResponse.error);
        resolvedLoad = loadResponse?.load || null;
        setLoadSnapshot(resolvedLoad);
      }

      const payload = {
        branding: companyBranding,
        load: resolvedLoad || { id: loadId ? decodeURIComponent(loadId) : 'NEW' },
        customer: {
          name: customerBilling.name || resolvedLoad?.customer?.name || '',
          address: customerBilling.address,
          email: customerBilling.email,
          phone: customerBilling.phone,
        },
        carrier: selectedCarrier || {},
        stops,
        financials: {
          incomeItems,
          expenseItems,
        },
        terms: documentTerms,
      };

      const response = await generateLoadDocument(type, payload);
      if (response?.error) throw new Error(response.error);

      const generated = response?.document;
      if (!generated?.html) throw new Error('Document generation returned no file content.');

      const blob = new Blob([generated.html], { type: generated.mimeType || 'text/html' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = generated.fileName || `${type}-${Date.now()}.html`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);

      setFinancialNotice(`${label} generated and downloaded successfully.`);
    } catch (error) {
      setFinancialNotice(error?.message || `Failed to generate ${label}.`);
    } finally {
      setDocumentBusyType('');
    }
  };

  const formatMoney = (value) => `$ ${Number(value || 0).toFixed(2)}`;

  const targetRateRows = [
    { key: 'high', label: 'Highest Margin Booking Rate' },
    { key: 'target', label: 'Target Margin Booking Rate' },
    { key: 'low', label: 'Lowest Margin Acceptable Rate' },
  ].map((row) => {
    const carrierRate = Number(targetRates[row.key] || 0);
    const marginDollar = incomeTotal - carrierRate;
    const marginPct = incomeTotal > 0 ? (marginDollar / incomeTotal) * 100 : 0;
    return {
      ...row,
      carrierRate,
      marginDollar,
      marginPct,
    };
  });

  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        padding: 8,
        background: `linear-gradient(180deg, rgba(var(--glow), 0.08), transparent 30%)`,
        borderRadius: 14,
      }}
    >
      <header style={{ display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.2 }}>{pageTitle}</h1>
          <button
            type="button"
            onClick={() => navigate('/loads')}
            style={{
              border: `1px solid ${t.border}`,
              background: t.bgAlt,
              color: t.text,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            Back to Load Command
          </button>
        </div>
        <div style={{ color: t.textSecondary, fontSize: 12 }}>
          Home / Loads / {loadId ? `Load ${decodeURIComponent(loadId)} / ` : ''}{activeTabLabel}
        </div>
        {saveMessage && <div style={{ color: t.textSecondary, fontSize: 12 }}>{saveMessage}</div>}
      </header>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPanelTab(tab.key)}
            style={{
              ...tabBaseStyle,
              background: tab.key === currentTab
                ? `linear-gradient(135deg, ${t.accent}, ${t.accent2})`
                : tabBaseStyle.background,
              color: tab.key === currentTab ? t.bg : tabBaseStyle.color,
              borderColor: tab.key === currentTab ? t.accent : t.border,
              boxShadow: tab.key === currentTab ? '0 8px 18px rgba(var(--glow), 0.28)' : tabBaseStyle.boxShadow,
            }}
          >
            {tab.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            persistDraft();
            navigate('/loadcenter');
          }}
          style={{ ...tabBaseStyle, marginLeft: 'auto' }}
        >
          Save & Exit to Load Board
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          padding: 10,
          border: `1px solid ${t.success}`,
          borderRadius: 10,
          background: `linear-gradient(120deg, ${t.surface}, ${t.surfaceStrong})`,
          boxShadow: '0 8px 18px rgba(0,0,0,0.12)',
        }}
      >
        <button type="button" style={actionButtonStyle}>Template Actions</button>
        <button type="button" style={actionButtonStyle}>Delete Template</button>
        <button type="button" style={actionButtonStyle}>View Accountability Log</button>
      </div>

      {currentTab === 'customer-info' ? (
        <SectionCard title="Customer Information" t={t}>
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
              <Field label="Customer">
                <input placeholder="Type Customer Name" style={inputStyle} />
              </Field>
              <div style={{ display: 'grid', gap: 6, fontSize: 12, color: t.textSecondary, alignSelf: 'end' }}>
                <div>Use the field above to search for an existing customer to add to this load.</div>
                <div>Click here to create a new customer to add to this load.</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Field label="Address">
                <input style={inputStyle} />
              </Field>
              <Field label="Primary Phone">
                <input style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Field label="Docket Number">
                <input style={inputStyle} />
              </Field>
              <Field label="USDOT Number">
                <input style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Field label="Credit Limit">
                <input style={inputStyle} />
              </Field>
              <Field label="Available Credit">
                <input style={inputStyle} />
              </Field>
            </div>

            <Field label="Public Notes">
              <textarea rows={3} style={{ ...inputStyle, minHeight: 84 }} />
            </Field>
            <div style={{ fontSize: 12, color: t.textSecondary }}>This note is public and appears on load documents.</div>

            <Field label="Private Notes">
              <textarea rows={3} style={{ ...inputStyle, minHeight: 84 }} />
            </Field>
            <div style={{ fontSize: 12, color: t.textSecondary }}>This note is private and does not appear on load documents.</div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Field label="Contact Name">
                <input placeholder="Type Contact Name" style={inputStyle} />
              </Field>
              <Field label="Contact Email">
                <input type="email" style={inputStyle} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
              <Field label="Contact Phone">
                <input style={inputStyle} />
              </Field>
              <Field label="Contact Ext">
                <input style={inputStyle} />
              </Field>
            </div>

            <div style={{ fontSize: 12, color: t.textSecondary }}>
              Changing these values only applies to this load and does not change values saved on the customer profile.
            </div>

            <Field label="Customer Reference #">
              <input style={inputStyle} />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary }}>EDI Status</span>
              <button type="button" style={{ ...optionButtonStyle(false), minWidth: 'unset', padding: '6px 10px' }}>EDI Enabled</button>
              <button type="button" style={{ ...optionButtonStyle(true), minWidth: 'unset', padding: '6px 10px' }}>EDI Disabled</button>
            </div>
          </div>
        </SectionCard>
      ) : currentTab === 'carrier-asset-info' ? (
        <>
          <SectionCard title="Carrier Information" t={t}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '170px minmax(0,1fr) 160px 140px', gap: 10, alignItems: 'end' }}>
                <Field label="Search Source">
                  <select value={carrierSearchSource} onChange={(event) => setCarrierSearchSource(event.target.value)} style={inputStyle}>
                    <option value="internal">Internal Database</option>
                    <option value="fmcsa">FMCSA</option>
                    <option value="both">Both</option>
                  </select>
                </Field>
                <Field label="Carrier Search">
                  <input
                    value={carrierQuery}
                    onChange={(event) => setCarrierQuery(event.target.value)}
                    placeholder="Carrier name, MC number, or USDOT"
                    style={inputStyle}
                  />
                </Field>
                <button type="button" onClick={runCarrierSearch} disabled={carrierLoading} style={{ ...actionButtonStyle, minHeight: 36 }}>
                  {carrierLoading ? 'Searching...' : 'Search'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCarrierQuery('');
                    setCarrierResults([]);
                    setCarrierError('');
                    setCarrierActionMessage('');
                  }}
                  style={{ ...actionButtonStyle, minHeight: 36 }}
                >
                  Clear
                </button>
              </div>

              <div style={{ fontSize: 12, color: t.textSecondary }}>
                Search FMCSA or your internal carrier database and add carrier directly from this tab.
              </div>

              {carrierError && <div style={{ fontSize: 12, color: t.error }}>{carrierError}</div>}
              {carrierActionMessage && <div style={{ fontSize: 12, color: t.textSecondary }}>{carrierActionMessage}</div>}

              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Carrier</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>MC #</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>USDOT</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Source</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierResults.map((carrier) => (
                      <tr key={`${carrier.source}-${carrier.mcNumber}-${carrier.usdotNumber}`}>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{carrier.companyName}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{carrier.mcNumber}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{carrier.usdotNumber}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textTransform: 'uppercase' }}>{carrier.source}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={() => addCarrierFromResult(carrier)}
                            style={{ ...optionButtonStyle(true), minWidth: 'unset', padding: '6px 10px' }}
                          >
                            {carrier.existsInInternal ? 'Use Carrier' : 'Add Carrier'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!carrierResults.length && (
                      <tr>
                        <td colSpan={5} style={{ padding: 12, color: t.textSecondary, textAlign: 'center', borderTop: `1px solid ${t.border}` }}>
                          Run a search to find carriers.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Carrier / Driver / Asset Details" t={t}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                <Field label="Carrier">
                  <input value={selectedCarrier?.companyName || 'Not Set'} readOnly style={inputStyle} />
                </Field>
                <Field label="Address">
                  <input value={selectedCarrier?.address || 'Not Set'} readOnly style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                <Field label="Docket Number">
                  <input value={selectedCarrier?.mcNumber || 'Not Set'} readOnly style={inputStyle} />
                </Field>
                <Field label="USDOT Number">
                  <input value={selectedCarrier?.usdotNumber || 'Not Set'} readOnly style={inputStyle} />
                </Field>
                <Field label="Contact Email">
                  <input value={selectedCarrier?.email || 'Not Set'} readOnly style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                <Field label="Primary Contact">
                  <input value={selectedCarrier ? selectedCarrier.companyName : 'Not Set'} readOnly style={inputStyle} />
                </Field>
                <Field label="Contact Phone">
                  <input value={selectedCarrier?.phone || 'Not Set'} readOnly style={inputStyle} />
                </Field>
                <Field label="Contact Ext">
                  <input value="Not Set" readOnly style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                <Field label="Driver">
                  <input placeholder="Select driver" style={inputStyle} />
                </Field>
                <Field label="Power Unit">
                  <input placeholder="Select power unit" style={inputStyle} />
                </Field>
                <Field label="Trailer">
                  <input placeholder="Select trailer" style={inputStyle} />
                </Field>
              </div>
            </div>
          </SectionCard>
        </>
      ) : currentTab === 'edit-stops' ? (
        <>
          <SectionCard title="Stops" t={t}>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={actionButtonStyle} onClick={() => setStopActionType('Pickup')}>+ Add Pickup</button>
                  <button type="button" style={actionButtonStyle} onClick={() => setStopActionType('Delivery')}>+ Add Delivery</button>
                  <button type="button" style={actionButtonStyle} onClick={() => setStopActionType('Other')}>+ Add Other Stop</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600 }}>Show route for</span>
                  <button
                    type="button"
                    onClick={() => setRouteView('carrier')}
                    style={{ ...optionButtonStyle(routeView === 'carrier'), minWidth: 'unset', padding: '6px 10px' }}
                  >
                    Carrier
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteView('customer')}
                    style={{ ...optionButtonStyle(routeView === 'customer'), minWidth: 'unset', padding: '6px 10px' }}
                  >
                    Customer
                  </button>
                </div>
              </div>

              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Stop Order</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Action(s)</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Scheduled Date/Time</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Actual Date/Time</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Location</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Address</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Private Notes</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Cargo</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Reference #</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Show on</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stops.map((stop) => (
                      <tr key={stop.id}>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.order}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.action}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>
                          {stop.scheduleStart || '—'} {stop.scheduleEnd ? `→ ${stop.scheduleEnd}` : ''}
                        </td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>
                          {stop.actualArrival || '—'} {stop.actualDeparture ? `→ ${stop.actualDeparture}` : ''}
                        </td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.location || '—'}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.address || '—'}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.privateNotes || '—'}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.cargoDescription || '—'}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.referenceNumbers || '—'}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{stop.showOn}</td>
                      </tr>
                    ))}
                    {stops.length === 0 && (
                      <tr>
                        <td colSpan={10} style={{ padding: 12, textAlign: 'center', color: t.textSecondary, borderTop: `1px solid ${t.border}` }}>
                          No stops added yet. Use Add Pickup / Add Delivery / Add Other Stop.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Add New Stop" t={t}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0,1fr) 160px', gap: 12, alignItems: 'end' }}>
                <Field label="Stop Location">
                  <div style={{ position: 'relative' }}>
                    <input
                      value={stopLocationQuery}
                      onChange={(event) => setStopLocationQuery(event.target.value)}
                      placeholder="Search locations"
                      style={inputStyle}
                    />
                    {filteredLocations.length > 0 && stopLocationQuery.trim().length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          zIndex: 5,
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          border: `1px solid ${t.border}`,
                          borderRadius: 8,
                          background: t.surface,
                          maxHeight: 180,
                          overflowY: 'auto',
                        }}
                      >
                        {filteredLocations.map((location) => (
                          <button
                            key={location.label}
                            type="button"
                            onClick={() => {
                              setStopLocationQuery(location.label);
                              setLocationMessage('Location selected for this stop.');
                            }}
                            style={{
                              width: '100%',
                              textAlign: 'left',
                              padding: '8px 10px',
                              border: 'none',
                              borderBottom: `1px solid ${t.border}`,
                              background: 'transparent',
                              color: t.text,
                              cursor: 'pointer',
                              fontSize: 12,
                            }}
                          >
                            {location.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </Field>
                <div style={{ fontSize: 12, color: t.textSecondary, display: 'grid', gap: 4 }}>
                  Use the field above to search for an existing location to add to this load.
                  <button
                    type="button"
                    onClick={() => setShowCreateLocation((prev) => !prev)}
                    style={{
                      ...actionButtonStyle,
                      width: 'fit-content',
                      padding: '6px 10px',
                    }}
                  >
                    {showCreateLocation ? 'Close New Location' : 'Create New Location'}
                  </button>
                </div>
                <button type="button" style={actionButtonStyle}>Edit Location Profile</button>
              </div>

              {showCreateLocation && (
                <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 10, background: t.bgAlt }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr)) auto', gap: 10, alignItems: 'end' }}>
                    <Field label="City">
                      <input
                        value={newLocationForm.city}
                        onChange={(event) => setNewLocationForm((prev) => ({ ...prev, city: event.target.value }))}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="State">
                      <input
                        maxLength={2}
                        value={newLocationForm.state}
                        onChange={(event) => setNewLocationForm((prev) => ({ ...prev, state: event.target.value }))}
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="ZIP">
                      <input
                        value={newLocationForm.zip}
                        onChange={(event) => setNewLocationForm((prev) => ({ ...prev, zip: event.target.value }))}
                        style={inputStyle}
                      />
                    </Field>
                    <button type="button" onClick={createLocation} style={{ ...optionButtonStyle(true), minWidth: 'unset', padding: '8px 12px' }}>
                      Add Location
                    </button>
                  </div>
                </div>
              )}

              {locationMessage && <div style={{ fontSize: 12, color: t.textSecondary }}>{locationMessage}</div>}

              <div
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: t.surface,
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: `1px solid ${t.border}`,
                    background: t.bgAlt,
                    fontWeight: 700,
                    fontSize: 14,
                    color: t.text,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <span>{stopActionType}</span>
                  <button
                    type="button"
                    style={{ ...actionButtonStyle, padding: '6px 10px' }}
                    onClick={() => {
                      setStopForm({
                        cargoDescription: '',
                        referenceNumbers: '',
                        scheduleStart: '',
                        scheduleEnd: '',
                        driverInstructions: '',
                        actualArrival: '',
                        actualDeparture: '',
                        unloadingMinutes: '',
                      });
                      setStopLocationQuery('');
                    }}
                  >
                    Remove stop action
                  </button>
                </div>

                <div style={{ padding: 12, display: 'grid', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 12 }}>
                    <Field label="Stop Action">
                      <select value={stopActionType} onChange={(event) => setStopActionType(event.target.value)} style={inputStyle}>
                        <option value="Pickup">Pickup</option>
                        <option value="Delivery">Delivery</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                    <div style={{ fontSize: 12, color: t.textSecondary, alignSelf: 'end' }}>
                      Select the type of action that will happen at this stop.
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: t.textSecondary }}>
                    <input
                      type="checkbox"
                      checked={showOnCustomerDocs}
                      onChange={(event) => setShowOnCustomerDocs(event.target.checked)}
                    />
                    Show on Customer Docs?
                  </label>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Freight Pickup Details</div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <Field label="Cargo Description">
                        <textarea
                          rows={2}
                          style={{ ...inputStyle, minHeight: 66 }}
                          value={stopForm.cargoDescription}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, cargoDescription: event.target.value }))}
                        />
                      </Field>
                      <Field label="Reference Numbers">
                        <textarea
                          rows={2}
                          style={{ ...inputStyle, minHeight: 66 }}
                          value={stopForm.referenceNumbers}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, referenceNumbers: event.target.value }))}
                        />
                      </Field>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Schedule Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                      <Field label="Start Date/Time">
                        <input
                          type="datetime-local"
                          style={inputStyle}
                          value={stopForm.scheduleStart}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, scheduleStart: event.target.value }))}
                        />
                      </Field>
                      <Field label="End Date/Time">
                        <input
                          type="datetime-local"
                          style={inputStyle}
                          value={stopForm.scheduleEnd}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, scheduleEnd: event.target.value }))}
                        />
                      </Field>
                      <Field label="Driver Instructions">
                        <input
                          placeholder="Optional notes"
                          style={inputStyle}
                          value={stopForm.driverInstructions}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, driverInstructions: event.target.value }))}
                        />
                      </Field>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: t.text }}>Actual Date/Time Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
                      <Field label="Actual Arrival Date/Time">
                        <input
                          type="datetime-local"
                          style={inputStyle}
                          value={stopForm.actualArrival}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, actualArrival: event.target.value }))}
                        />
                      </Field>
                      <Field label="Actual Departure Date/Time">
                        <input
                          type="datetime-local"
                          style={inputStyle}
                          value={stopForm.actualDeparture}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, actualDeparture: event.target.value }))}
                        />
                      </Field>
                      <Field label="Total Unloading Time (minutes)">
                        <input
                          type="number"
                          min="0"
                          style={inputStyle}
                          value={stopForm.unloadingMinutes}
                          onChange={(event) => setStopForm((prev) => ({ ...prev, unloadingMinutes: event.target.value }))}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  style={{ ...actionButtonStyle, borderColor: t.error, color: t.error }}
                  onClick={() => {
                    setStopLocationQuery('');
                    setStopForm({
                      cargoDescription: '',
                      referenceNumbers: '',
                      scheduleStart: '',
                      scheduleEnd: '',
                      driverInstructions: '',
                      actualArrival: '',
                      actualDeparture: '',
                      unloadingMinutes: '',
                    });
                    setLocationMessage('');
                  }}
                >
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={actionButtonStyle}
                    onClick={() => {
                      saveCurrentStop();
                      setStopActionType('Other');
                    }}
                  >
                    Add Another Action
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentStop}
                    style={{
                      border: `1px solid ${t.accent}`,
                      background: t.accent,
                      color: t.bg,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                  >
                    Save Stop
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        </>
      ) : currentTab === 'financials' ? (
        <>
          <SectionCard title="Income/Budget" t={t}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={actionButtonStyle} onClick={() => addLineItem(setIncomeItems, 'income')}>+ Add Line Item</button>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    style={actionButtonStyle}
                    disabled={Boolean(documentBusyType)}
                    onClick={() => generateAndDownloadDocument('invoice', 'Customer Invoice')}
                  >
                    {documentBusyType === 'invoice' ? 'Generating Invoice...' : 'Generate Customer Invoice'}
                  </button>
                  <button
                    type="button"
                    style={actionButtonStyle}
                    disabled={Boolean(documentBusyType)}
                    onClick={() => generateAndDownloadDocument('rate-confirmation', 'Rate Confirmation')}
                  >
                    {documentBusyType === 'rate-confirmation' ? 'Generating Confirmation...' : 'Generate Rate Confirmation'}
                  </button>
                  <button
                    type="button"
                    style={actionButtonStyle}
                    disabled={Boolean(documentBusyType)}
                    onClick={() => generateAndDownloadDocument('bol', 'Bill of Lading')}
                  >
                    {documentBusyType === 'bol' ? 'Generating BOL...' : 'Generate BOL'}
                  </button>
                </div>
              </div>
              {demoMode && (
                <div
                  style={{
                    border: `1px solid ${t.border}`,
                    borderRadius: 10,
                    padding: 10,
                    background: t.bgAlt,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: t.textSecondary }}>
                      White-label branding and document defaults are managed in Settings.
                    </div>
                    <button
                      type="button"
                      style={{
                        border: `1px solid ${t.border}`,
                        background: t.surface,
                        color: t.text,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate('/settings')}
                    >
                      Open Settings
                    </button>
                  </div>
                </div>
              )}
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Company</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Description</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Notes</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomeItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={item.company} onChange={(e) => updateLineItem(setIncomeItems, item.id, 'company', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={item.description} onChange={(e) => updateLineItem(setIncomeItems, item.id, 'description', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={item.notes} onChange={(e) => updateLineItem(setIncomeItems, item.id, 'notes', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="number" value={item.rate} onChange={(e) => updateLineItem(setIncomeItems, item.id, 'rate', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="number" value={item.quantity} onChange={(e) => updateLineItem(setIncomeItems, item.id, 'quantity', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>
                          <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                            <span>{formatMoney(Number(item.rate || 0) * Number(item.quantity || 0))}</span>
                            <button type="button" onClick={() => removeLineItem(setIncomeItems, item.id)} style={{ ...actionButtonStyle, padding: '4px 8px', fontSize: 11 }}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} style={{ padding: 12, color: t.textSecondary, textAlign: 'right', borderTop: `1px solid ${t.border}` }}>
                        Total Income
                      </td>
                      <td style={{ padding: 12, borderTop: `1px solid ${t.border}`, textAlign: 'right', fontWeight: 700 }}>{formatMoney(incomeTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {financialNotice && <div style={{ fontSize: 12, color: t.textSecondary }}>{financialNotice}</div>}
            </div>
          </SectionCard>

          <SectionCard title="Expenses" t={t}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" style={actionButtonStyle} onClick={() => addLineItem(setExpenseItems, 'expense')}>+ Add Line Item</button>
              </div>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Company</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Description</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Notes</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Rate</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Quantity</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={item.company} onChange={(e) => updateLineItem(setExpenseItems, item.id, 'company', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={item.description} onChange={(e) => updateLineItem(setExpenseItems, item.id, 'description', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={item.notes} onChange={(e) => updateLineItem(setExpenseItems, item.id, 'notes', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="number" value={item.rate} onChange={(e) => updateLineItem(setExpenseItems, item.id, 'rate', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="number" value={item.quantity} onChange={(e) => updateLineItem(setExpenseItems, item.id, 'quantity', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>
                          <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                            <span>{formatMoney(Number(item.rate || 0) * Number(item.quantity || 0))}</span>
                            <button type="button" onClick={() => removeLineItem(setExpenseItems, item.id)} style={{ ...actionButtonStyle, padding: '4px 8px', fontSize: 11 }}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={5} style={{ padding: 12, color: t.textSecondary, textAlign: 'right', borderTop: `1px solid ${t.border}` }}>
                        Total Expenses
                      </td>
                      <td style={{ padding: 12, borderTop: `1px solid ${t.border}`, textAlign: 'right', fontWeight: 700 }}>{formatMoney(expenseTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 0.7fr)', gap: 12 }}>
            <SectionCard title="Target Rates" t={t}>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Target Carrier Rate</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Target Rate</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Gross Margin %</th>
                      <th style={{ padding: 10, textAlign: 'center' }}>Gross Margin $</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targetRateRows.map((row) => (
                      <tr key={row.label}>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, color: t.text }}>{row.label}</td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>
                          <input
                            type="number"
                            value={targetRates[row.key]}
                            onChange={(event) => setTargetRates((prev) => ({ ...prev, [row.key]: event.target.value }))}
                            style={inputStyle}
                          />
                        </td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'center', color: t.textSecondary }}>{row.marginPct.toFixed(2)}%</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'center', color: t.textSecondary }}>{formatMoney(row.marginDollar)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  style={actionButtonStyle}
                  onClick={() => {
                    setTargetRates({
                      high: String((expenseTotal * 0.85).toFixed(2)),
                      target: String((expenseTotal * 0.9).toFixed(2)),
                      low: String((expenseTotal * 0.95).toFixed(2)),
                    });
                  }}
                >
                  Edit Target Rates
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Financial Summary" t={t}>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {[
                      ['Total Income', formatMoney(incomeTotal)],
                      ['Total Expenses', formatMoney(expenseTotal)],
                      ['Gross Profit/Loss', formatMoney(grossProfit)],
                      ['Gross Profit/Loss Percentage', `${grossProfitPct.toFixed(2)}%`],
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, color: t.textSecondary }}>{label}</td>
                        <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right', color: t.text }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Freight Charge Terms" t={t}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
              {[
                { key: 'prepaid', label: 'Prepaid' },
                { key: 'collect', label: 'Collect' },
                { key: 'third-party', label: '3rd Party' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFreightChargeTerms(item.key)}
                  style={{
                    ...optionButtonStyle(freightChargeTerms === item.key),
                    minWidth: 'unset',
                    width: '100%',
                    padding: '10px 12px',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Accounts Receivable/Payable History" t={t}>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" style={actionButtonStyle} onClick={() => pushHistoryRow('Sent Invoice')}>Record a Sent Invoice</button>
                  <button type="button" style={actionButtonStyle} onClick={() => pushHistoryRow('Received Bill')}>Record a Received Bill</button>
                </div>
                <button type="button" style={actionButtonStyle} onClick={() => pushHistoryRow('Advance Payment')}>Record an Advance Payment</button>
              </div>

              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: 10, textAlign: 'left' }}>Type</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Invoice/Bill Date</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Company</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Billing Amount</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Payment Date</th>
                      <th style={{ padding: 10, textAlign: 'right' }}>Actual Amount</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Notes</th>
                      <th style={{ padding: 10, textAlign: 'left' }}>Paid in Full</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arApHistory.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{row.type}</td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="date" value={row.invoiceDate} onChange={(e) => updateHistoryRow(row.id, 'invoiceDate', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={row.company} onChange={(e) => updateHistoryRow(row.id, 'company', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="number" value={row.billingAmount} onChange={(e) => updateHistoryRow(row.id, 'billingAmount', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="date" value={row.paymentDate} onChange={(e) => updateHistoryRow(row.id, 'paymentDate', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input type="number" value={row.actualAmount} onChange={(e) => updateHistoryRow(row.id, 'actualAmount', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}><input value={row.notes} onChange={(e) => updateHistoryRow(row.id, 'notes', e.target.value)} style={inputStyle} /></td>
                        <td style={{ padding: 8, borderTop: `1px solid ${t.border}`, textAlign: 'center' }}>
                          <input type="checkbox" checked={row.paidInFull} onChange={(e) => updateHistoryRow(row.id, 'paidInFull', e.target.checked)} />
                        </td>
                      </tr>
                    ))}
                    {arApHistory.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: 12, color: t.textSecondary, textAlign: 'center', borderTop: `1px solid ${t.border}` }}>
                          No Accounts Receivable/Payable History Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        </>
      ) : (
        <>
          <SectionCard title="Template Information" t={t}>
            <div style={{ display: 'grid', gridTemplateColumns: '220px minmax(0,1fr)', gap: 12, alignItems: 'start' }}>
              <Field label="Template Name">
                <input defaultValue="Caterpillar Loads" style={inputStyle} />
              </Field>
              <div style={{ fontSize: 12, color: t.textSecondary, alignSelf: 'end' }}>
                Give this template a distinct and descriptive name to help you find it quickly later.
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Load Information" t={t}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                <Field label="Load Status">
                  <select style={inputStyle} defaultValue="open">
                    <option value="open">Open</option>
                    <option value="booked">Booked</option>
                    <option value="in-transit">In Transit</option>
                  </select>
                </Field>
                <Field label="Creation Date">
                  <input type="datetime-local" style={inputStyle} defaultValue="2026-03-01T18:25" />
                </Field>
              </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
            <Field label="Truck Status">
              <select style={inputStyle} defaultValue="available">
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="pending">Pending</option>
              </select>
            </Field>
            <Field label="Branch">
              <select style={inputStyle} defaultValue="shared">
                <option value="shared">Shared</option>
                <option value="east">East</option>
                <option value="west">West</option>
              </select>
            </Field>
          </div>

          <Field label="Load Reference ID / Numbers">
            <textarea rows={3} style={{ ...inputStyle, minHeight: 84 }} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
            <Field label="Commodity">
              <select style={inputStyle} defaultValue="general">
                <option value="general">General Freight</option>
                <option value="food">Food Grade</option>
                <option value="hazmat">Hazmat</option>
              </select>
            </Field>
            <Field label="Weight (lbs)">
              <input type="number" style={inputStyle} placeholder="0" />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
            <Field label="Declared Load Value ($)">
              <input type="number" style={inputStyle} placeholder="0.00" />
            </Field>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary }}>Load Size</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={optionButtonStyle(loadSize === 'full')} onClick={() => setLoadSize('full')}>Full Load</button>
                  <button type="button" style={optionButtonStyle(loadSize === 'partial')} onClick={() => setLoadSize('partial')}>Partial Load</button>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary }}>New or Used Goods</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={optionButtonStyle(goodsCondition === 'new')} onClick={() => setGoodsCondition('new')}>New</button>
                  <button type="button" style={optionButtonStyle(goodsCondition === 'used')} onClick={() => setGoodsCondition('used')}>Used</button>
                </div>
              </div>
            </div>
          </div>
            </div>
          </SectionCard>

          <SectionCard title="Equipment Information" t={t}>
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                <Field label="Equipment Type">
                  <select style={inputStyle} defaultValue="dry-van">
                    <option value="dry-van">Dry Van</option>
                    <option value="reefer">Reefer</option>
                    <option value="flatbed">Flatbed</option>
                  </select>
                </Field>
                <Field label="Equipment Length">
                  <select style={inputStyle} defaultValue="53">
                    <option value="53">53 ft</option>
                    <option value="48">48 ft</option>
                    <option value="40">40 ft</option>
                  </select>
                </Field>
              </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12 }}>
            <Field label="Temperature (°F)">
              <input type="number" style={inputStyle} />
            </Field>
            <Field label="Lower Temp. Threshold (°F)">
              <input type="number" style={inputStyle} />
            </Field>
            <Field label="Temp. Time Tolerance (Min)">
              <input type="number" style={inputStyle} />
            </Field>
            <Field label="Upper Temp. Threshold (°F)">
              <input type="number" style={inputStyle} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
            <Field label="Intermodal / Dray Container Number">
              <input style={inputStyle} />
            </Field>
            <Field label="Last Free Day">
              <input type="date" style={inputStyle} />
            </Field>
          </div>
            </div>
          </SectionCard>

          <SectionCard title="Load Notes" t={t}>
            <div style={{ display: 'grid', gap: 12 }}>
              <Field label="Public Load Note">
                <textarea rows={3} style={{ ...inputStyle, minHeight: 84 }} />
              </Field>
              <Field label="Private Load Note">
                <textarea rows={3} style={{ ...inputStyle, minHeight: 84 }} />
              </Field>
              <Field label="Load Posting Notes / Comments">
                <textarea rows={3} style={{ ...inputStyle, minHeight: 84 }} />
              </Field>
            </div>
          </SectionCard>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => {
            if (isFinancialsTab) {
              persistDraft();
              navigate('/loadcenter');
              return;
            }
            setPanelTab(nextTabKey);
          }}
          style={{
            border: `1px solid ${t.accent2}`,
            background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
            color: t.bg,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 16px',
            cursor: 'pointer',
            boxShadow: '0 10px 22px rgba(var(--glow), 0.24)',
          }}
        >
          {isFinancialsTab ? 'Save & Exit to Load Board' : nextTabLabel}
        </button>
      </div>
    </div>
  );
}
