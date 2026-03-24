import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import MarketIntelligenceModule from './components/MarketIntelligenceModule';
import InternalRoutePreview from '../../components/InternalRoutePreview';
import { LoadStatusBadge } from '../../components/LoadStatusBadge';
import { useTheme } from '../../contexts/ThemeContext';
import {
  addLoadBotActivity,
  dispatchLoad,
  getLoadBotActivity,
  getLoadDetail,
  listLoads,
  sendToBidNetwork as sendToBidNetworkApi,
  submitCarrierQuote,
  updateLoad,
  voidLoad,
  deleteLoad,
  restoreLoad,
  getConsolidatedFinancials,
  createAncillaryCharge,
  updateBillingAllocations,
  ANCILLARY_TYPES,
} from '../../api/loadsClient';
import {
  ALLOWED_STATUS_TRANSITIONS,
  canTransitionStatus,
  deriveRouteDetailModules,
  formatLoadStatusLabel,
  LOAD_STATUSES,
  normalizeLoadStatus,
} from '../../utils/loadLifecycle';

/* ─── freight category display ────────────────────────────────────── */
const FREIGHT_CATEGORY_META = {
  adhoc: { label: 'Ad-Hoc', color: 'var(--text-secondary)', bg: 'var(--bg-alt)', border: 'var(--border)' },
  contracted: { label: 'Contracted', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', border: 'var(--accent)' },
  spot_rate: { label: 'Spot Rate', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)', border: 'var(--warning)' },
  capacity: { label: 'Capacity', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)', border: 'var(--success)' },
};

/* ─── helpers ───────────────────────────────────────────────────────── */
const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const toLocationLabel = (loc) => {
  if (!loc) return '';
  const city = String(loc.city || '').trim();
  const state = String(loc.state || '').trim();
  if (city && state) return `${city}, ${state}`;
  return city || state || '';
};

const toLocationAddress = (loc) => {
  if (!loc) return '—';
  const explicit = String(loc.address || loc.street || '').trim();
  if (explicit) return explicit;
  return toLocationLabel(loc) || '—';
};

const toLocalInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
};

/* ─── style tokens ──────────────────────────────────────────────────── */
const sectionLabelStyle = {
  fontSize: 'var(--section-label-size, 12px)',
  fontWeight: 'var(--section-label-weight, 700)',
  color: 'var(--text-secondary)',
  letterSpacing: 'var(--section-label-tracking, 0.3px)',
};

const criticalSectionLabelStyle = {
  ...sectionLabelStyle,
  color: 'var(--critical-header)',
};

const inputStyle = {
  minHeight: 40,
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  fontSize: 12,
  padding: '0 16px',
  width: '100%',
};

const cardStyle = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'var(--bg-alt)',
  padding: 20,
  display: 'grid',
  gap: 16,
};

const accentBtnStyle = {
  border: '1px solid var(--accent-2)',
  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
  color: 'var(--bg)',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  minHeight: 40,
  padding: '0 20px',
  cursor: 'pointer',
};

const ghostBtnStyle = {
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  minHeight: 40,
  padding: '0 20px',
  cursor: 'pointer',
};

const transparentBtnStyle = {
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  borderRadius: 8,
  fontSize: 12,
  fontWeight: 700,
  minHeight: 40,
  padding: '0 20px',
  cursor: 'pointer',
};

/* ─── component ─────────────────────────────────────────────────────── */
export default function LoadCommandCenterPage() {
  const navigate = useNavigate();
  const { loadId: paramLoadId } = useParams();
  const [searchParams] = useSearchParams();
  const resolvedLoadId = paramLoadId || searchParams.get('selected') || '';
  const { settings } = useTheme();

  /* ── load data ──────────────────────────────────── */
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [events, setEvents] = useState([]);

  const fetchLoad = async (id) => {
    if (!id) { setLoading(false); return; }
    setLoading(true);
    setError('');
    try {
      const result = await getLoadDetail(id);
      if (result?.error) { setError(typeof result.error === 'string' ? result.error : 'Failed to fetch load'); }
      else {
        const l = result?.load || result?.item || result;
        setLoad(l);
        setEvents(Array.isArray(result?.events) ? result.events : Array.isArray(l?.events) ? l.events : []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoad(resolvedLoadId); }, [resolvedLoadId]);

  /* ── consolidated financials (split billing) ──── */
  const [consolidatedFin, setConsolidatedFin] = useState(null);
  const [allocDraft, setAllocDraft] = useState([]);
  const [allocSaving, setAllocSaving] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [newCharge, setNewCharge] = useState({ ancillaryType: 'detention', revenue: '', carrierCost: '', notes: '' });

  const fetchConsolidated = async (id) => {
    if (!id) return;
    const data = await getConsolidatedFinancials(id);
    if (!data?.error) {
      setConsolidatedFin(data);
      setAllocDraft(data.billingAllocations || []);
    }
  };

  useEffect(() => {
    if (load?.id && load.loadType !== 'ancillary') fetchConsolidated(load.id);
    else if (load?.parentLoadId) fetchConsolidated(load.parentLoadId);
  }, [load?.id, load?.loadType, load?.parentLoadId]);

  const saveAllocations = async () => {
    const targetId = load?.loadType === 'ancillary' ? load.parentLoadId : load?.id;
    if (!targetId) return;
    setAllocSaving(true);
    const result = await updateBillingAllocations(targetId, allocDraft);
    setAllocSaving(false);
    if (!result?.error) fetchConsolidated(targetId);
  };

  const addAllocationRow = () => {
    setAllocDraft((prev) => [...prev, { partyId: '', partyName: '', partyType: 'customer', percentage: 0, fixedAmount: null, notes: '' }]);
  };

  const updateAllocRow = (idx, field, value) => {
    setAllocDraft((prev) => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const removeAllocRow = (idx) => {
    setAllocDraft((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddAncillaryCharge = async () => {
    const targetId = load?.loadType === 'ancillary' ? load.parentLoadId : load?.id;
    if (!targetId) return;
    await createAncillaryCharge(targetId, {
      ancillaryType: newCharge.ancillaryType,
      revenue: Number(newCharge.revenue) || 0,
      carrierCost: Number(newCharge.carrierCost) || 0,
      notes: newCharge.notes,
    });
    setNewCharge({ ancillaryType: 'detention', revenue: '', carrierCost: '', notes: '' });
    setAddChargeOpen(false);
    fetchConsolidated(targetId);
  };

  /* ── edit mode ──────────────────────────────────── */
  const [editMode, setEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [editState, setEditState] = useState({ saving: false, error: '', success: '' });

  useEffect(() => {
    if (!load) { setEditDraft(null); setEditMode(false); return; }
    setEditDraft({
      status: normalizeLoadStatus(load.status),
      freightCategory: load.freightCategory || 'adhoc',
      customerName: load.customer?.name || '',
      carrierName: load.carrier?.name === '—' ? '' : (load.carrier?.name || ''),
      dispatcherName: load.dispatcher?.name || '',
      equipment: load.equipment || 'van',
      miles: String(load.miles ?? ''),
      revenue: String(load.revenue ?? ''),
      carrierCost: String(load.carrierCost ?? ''),
      originCity: load.origin?.city || '',
      originState: load.origin?.state || '',
      destinationCity: load.destination?.city || '',
      destinationState: load.destination?.state || '',
      pickupAt: toLocalInputValue(load.pickupAt),
      deliveryAt: toLocalInputValue(load.deliveryAt),
      weight: String(load.weight ?? ''),
      commodity: load.commodity || '',
      temperature: String(load.temperature ?? ''),
      referenceNumbers: load.referenceNumbers || '',
      specialInstructions: load.specialInstructions || '',
    });
    setEditMode(false);
    setEditState({ saving: false, error: '', success: '' });
  }, [load]);

  const onEditChange = (field, value) => setEditDraft((p) => ({ ...(p || {}), [field]: value }));

  const saveLoadEdits = async () => {
    if (!load?.id || !editDraft) return;
    setEditState({ saving: true, error: '', success: '' });
    const payload = {
      status: editDraft.status,
      freightCategory: editDraft.freightCategory,
      customerName: editDraft.customerName,
      carrierName: editDraft.carrierName,
      dispatcherName: editDraft.dispatcherName,
      equipment: editDraft.equipment,
      miles: Number(editDraft.miles || 0),
      revenue: Number(editDraft.revenue || 0),
      carrierCost: Number(editDraft.carrierCost || 0),
      originCity: editDraft.originCity,
      originState: editDraft.originState,
      destinationCity: editDraft.destinationCity,
      destinationState: editDraft.destinationState,
      pickupAt: editDraft.pickupAt ? new Date(editDraft.pickupAt).toISOString() : undefined,
      deliveryAt: editDraft.deliveryAt ? new Date(editDraft.deliveryAt).toISOString() : undefined,
      weight: Number(editDraft.weight || 0),
      commodity: editDraft.commodity,
      temperature: editDraft.temperature,
      referenceNumbers: editDraft.referenceNumbers,
      specialInstructions: editDraft.specialInstructions,
      userId: 'command_center_ui',
      transitionReason: 'Edited via Load Command Center',
    };
    const result = await updateLoad(load.id, payload);
    if (result?.error) {
      setEditState({ saving: false, error: typeof result.error === 'string' ? result.error : 'Save failed', success: '' });
    } else {
      setEditState({ saving: false, error: '', success: 'Load updated.' });
      setEditMode(false);
      fetchLoad(load.id);
    }
  };

  /* ── chat ────────────────────────────────────────── */
  const [chatChannel, setChatChannel] = useState('slack');
  const [chatDraft, setChatDraft] = useState('');
  const [chatFeed, setChatFeed] = useState([]);

  useEffect(() => {
    if (!load?.id) return;
    setChatFeed([
      { id: `${load.id}-seed-slack`, channel: 'slack', author: 'Dispatch Bot', text: `Load ${load.id} selected. Team collaboration feed ready.`, createdAt: new Date().toISOString() },
      { id: `${load.id}-seed-teams`, channel: 'teams', author: 'Ops Lead', text: 'Confirm pickup ETA and carrier assignment updates here.', createdAt: new Date().toISOString() },
    ]);
  }, [load?.id]);

  const visibleChatMessages = chatFeed.filter((m) => m.channel === chatChannel);

  const sendTeamMessage = () => {
    const text = String(chatDraft || '').trim();
    if (!load?.id || !text) return;
    setChatFeed((prev) => [...prev, { id: `${load.id}-${Date.now()}`, channel: chatChannel, author: 'You', text, createdAt: new Date().toISOString() }]);
    setChatDraft('');
  };

  /* ── bot / auction ──────────────────────────────── */
  const [botWorking, setBotWorking] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [recommendedCarrier, setRecommendedCarrier] = useState(null);
  const [botAddons, setBotAddons] = useState({ autoAssign: true, marginGuard: true, slaAlerts: true, smartAuction: true });
  const [botActivity, setBotActivity] = useState([]);

  useEffect(() => {
    if (!load?.id) return;
    (async () => {
      const res = await getLoadBotActivity(load.id);
      if (Array.isArray(res?.items)) setBotActivity(res.items.slice(0, 12));
    })();
  }, [load?.id]);

  const appendBotActivity = async (text, source = 'dispatch-bot') => {
    if (!load?.id || !text) return;
    const result = await addLoadBotActivity(load.id, { text, source });
    const entry = result?.item || { id: `${load.id}-${Date.now()}`, loadId: load.id, text, createdAt: new Date().toISOString(), source: `${source}-fallback` };
    setBotActivity((prev) => [entry, ...prev].slice(0, 12));
  };

  const runBotRecommendCarrier = () => {
    if (!load) return;
    const eq = String(load.equipment || '').toLowerCase();
    const margin = Number(load.marginPct || 0);
    const map = { van: { id: 'CR-BOT-VAN-01', name: 'Velocity Van Logistics' }, reefer: { id: 'CR-BOT-REF-01', name: 'Polar Freight Solutions' }, flatbed: { id: 'CR-BOT-FLT-01', name: 'IronDeck Transport' } };
    const baseline = map[eq] || { id: 'CR-BOT-01', name: 'Prime Logistics AI Pool' };
    const confidence = Math.max(55, Math.min(96, Math.round((margin * 2.4) + 52)));
    setRecommendedCarrier({ ...baseline, confidence });
    setBotMessage(`Dispatch Bot recommended ${baseline.name} (${confidence}% fit).`);
    appendBotActivity(`Recommended ${baseline.name} with ${confidence}% fit score.`);
  };

  const runBotDispatch = async () => {
    if (!load) return;
    const carrier = recommendedCarrier || { id: 'CR-BOT-01', name: 'Prime Logistics AI Pool' };
    setBotWorking('dispatch');
    setBotMessage('');
    const result = await dispatchLoad(load.id, { carrierId: carrier.id, carrierName: carrier.name, source: 'dispatch-bot-addon', marginGuard: botAddons.marginGuard, slaAlerts: botAddons.slaAlerts });
    setBotWorking('');
    if (result?.error) {
      setBotMessage(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      appendBotActivity(`Auto Dispatch failed: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`);
      return;
    }
    setBotMessage(`Dispatch Bot assigned ${carrier.name} to ${load.id}.`);
    appendBotActivity(`Auto-dispatched to ${carrier.name}.`);
    fetchLoad(load.id);
  };

  const runAuctionBot = async () => {
    if (!load) return;
    setBotWorking('auction');
    setBotMessage('');
    const result = await sendToBidNetworkApi(load.id, { network: botAddons.smartAuction ? 'smart-auction-bot' : 'internal-auction-network', source: 'auction-bot-addon' });
    setBotWorking('');
    if (result?.error) {
      setBotMessage(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      appendBotActivity(`Auction Bot push failed: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`, 'auction-bot');
      return;
    }
    setBotMessage(`Auction Bot listed ${load.id} (${result.requestId || 'queued'}).`);
    appendBotActivity(`Auction Bot listed load (${result.requestId || 'queued'}).`, 'auction-bot');
  };

  /* ── void / delete / restore ───────────────────── */
  const handleVoid = async () => {
    if (!load?.id) return;
    const result = await voidLoad(load.id, { userId: 'command_center_ui', reason: 'Voided via Load Command Center' });
    if (!result?.error) fetchLoad(load.id);
  };
  const handleDelete = async () => {
    if (!load?.id) return;
    const result = await deleteLoad(load.id, { userId: 'command_center_ui', reason: 'Deleted via Load Command Center' });
    if (!result?.error) fetchLoad(load.id);
  };
  const handleRestore = async () => {
    if (!load?.id) return;
    const result = await restoreLoad(load.id, { userId: 'command_center_ui' });
    if (!result?.error) fetchLoad(load.id);
  };
  const handleDispatch = async () => {
    if (!load?.id) return;
    const result = await dispatchLoad(load.id, { userId: 'command_center_ui', source: 'command-center' });
    if (!result?.error) fetchLoad(load.id);
  };

  /* ── computed metrics ───────────────────────────── */
  const loadMetrics = useMemo(() => {
    if (!load) return null;
    const miles = Number(load.miles || 0);
    const revenue = Number(load.revenue || 0);
    const carrierCost = Number(load.carrierCost || 0);
    const margin = revenue - carrierCost;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
    const rpm = miles > 0 ? revenue / miles : 0;
    const cpm = miles > 0 ? carrierCost / miles : 0;
    const stopComplexityPenalty = 12;
    const marginScore = Math.max(0, Math.min(100, marginPct * 4));
    const efficiencyScore = Math.max(0, Math.min(100, rpm > 0 ? ((rpm - cpm) / rpm) * 100 : 0));
    const overallScore = Math.max(0, Math.min(100, (marginScore * 0.5) + (efficiencyScore * 0.35) + ((100 - stopComplexityPenalty) * 0.15)));
    return { miles, revenue, carrierCost, margin, marginPct, rpm, cpm, marginScore, efficiencyScore, stopComplexity: 100 - stopComplexityPenalty, overallScore };
  }, [load]);

  const selectedStatus = normalizeLoadStatus(load?.status);
  const lifecycleModules = deriveRouteDetailModules(selectedStatus);

  const toCountdownMinutes = (v) => { if (!v) return null; const ts = new Date(v).getTime(); if (Number.isNaN(ts)) return null; return Math.max(0, Math.round((ts - Date.now()) / 60000)); };
  const pickupCountdownMinutes = load ? toCountdownMinutes(load.pickupAt) : null;
  const pickupCountdownLabel = pickupCountdownMinutes === null ? '—' : `${Math.floor(pickupCountdownMinutes / 60)}h ${pickupCountdownMinutes % 60}m`;
  const estimatedDistanceToPickup = load ? Math.max(25, Math.round(Number(load.miles || 0) * 0.18)) : 0;
  const slaRisk = Boolean(load && lifecycleModules.showRiskIndicators && pickupCountdownMinutes !== null && pickupCountdownMinutes < 240 && !load.carrier?.assigned);
  const marginBelowTarget = Boolean(load && Number(load.marginPct || 0) < Number(load.targetMarginPct || 12));
  const marginBuffer = Number((Number(load?.marginPct || 0) - Number(load?.targetMarginPct || 12)).toFixed(1));
  const etaDeltaMinutes = load ? Math.max(0, Math.round((new Date(load.deliveryAt).getTime() - Date.now()) / 60000) - Math.max(0, Math.round(Number(load.miles || 0) * 1.35))) : 0;

  const dispatchRisk = useMemo(() => {
    const fallbackLaneVolatility = load ? Math.max(12, Math.min(94, 25 + (selectedStatus === 'TENDERED' ? 26 : 0) + (selectedStatus === 'EXCEPTION' ? 18 : 0) + (Number(load.marginPct || 0) < 12 ? 12 : 0) + (Number(load.miles || 0) > 1200 ? 8 : 0))) : null;
    const fallbackCapacityHeat = load ? Math.max(20, Math.min(96, 40 + (load.carrier?.assigned ? -8 : 14) + (selectedStatus === 'TENDERED' ? 15 : 0) + (selectedStatus === 'IN_TRANSIT' ? -6 : 0) + (estimatedDistanceToPickup > 160 ? 8 : 0))) : null;
    const fallbackWarnings = [...(slaRisk ? ['sla_risk_high'] : []), ...(marginBelowTarget ? ['margin_below_target'] : []), ...(!load?.carrier?.assigned ? ['carrier_unassigned'] : [])];
    return {
      laneVolatilityScore: Number(fallbackLaneVolatility ?? 0),
      capacityHeatIndex: Number(fallbackCapacityHeat ?? 0),
      pickupCountdownMinutes: Number(pickupCountdownMinutes ?? 0),
      etaDeltaMinutes: Number(etaDeltaMinutes ?? 0),
      complianceStatus: 'valid',
      warnings: fallbackWarnings,
    };
  }, [load, selectedStatus, pickupCountdownMinutes, estimatedDistanceToPickup, slaRisk, marginBelowTarget, etaDeltaMinutes]);

  const marketRate = Number(load?.revenue || 0) + 650;
  const opportunityGap = marketRate - Number(load?.revenue || 0);

  const loadHealthScore = load ? Math.max(0, Math.min(100, (Math.max(0, Number(loadMetrics?.marginPct || 0)) * 2.2) + (pickupCountdownMinutes !== null ? Math.min(25, pickupCountdownMinutes / 20) : 12) + (load.carrier?.assigned ? 20 : 6) + (100 - Number(dispatchRisk.laneVolatilityScore || 40)) * 0.2 + (marginBelowTarget ? -14 : 0) + (slaRisk ? -18 : 0))) : 0;

  const isDeleted = String(load?.status || '').toLowerCase() === 'deleted' || Boolean(load?.deletedAt);

  /* ── active tab ─────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('overview');
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'route', label: 'Route & Shipment' },
    { key: 'financials', label: 'Financials & Rate' },
    { key: 'dispatch', label: 'Dispatch Control' },
    { key: 'market', label: 'Market Intel' },
    { key: 'auction', label: 'Auction Board' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'chat', label: 'Team Chat' },
  ];

  /* ─── render ──────────────────────────────────────────────────────── */
  if (loading) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>Loading load details...</div>;
  if (error) return <div style={{ padding: 40, color: 'var(--error)' }}>{error}</div>;
  if (!load) return <div style={{ padding: 40, color: 'var(--text-secondary)' }}>No load selected. Return to <button type="button" onClick={() => navigate('/loadcenter/dispatch-screen')} style={{ ...transparentBtnStyle, display: 'inline', padding: '4px 12px', minHeight: 28 }}>Dispatch Center</button></div>;

  return (
    <div style={{ display: 'grid', gap: 24, padding: '0 0 40px' }}>
      {/* ─── HEADER ─────────────────────────────── */}
      <div style={{ border: '1px solid var(--border)', borderRadius: 12, background: 'linear-gradient(160deg, var(--surface), var(--surface-strong))', padding: 24, display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.4 }}>LOAD COMMAND CENTER</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>Load {load.id}</span>
              {load.referenceNumber && <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Ref: {load.referenceNumber}</span>}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: 13 }}>
              <LoadStatusBadge status={normalizeLoadStatus(load.status)} />
              {(() => {
                const cat = FREIGHT_CATEGORY_META[load.freightCategory] || FREIGHT_CATEGORY_META.adhoc;
                return (
                  <span style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${cat.border}`, borderRadius: 999, padding: '2px 12px', background: cat.bg, color: cat.color, fontWeight: 700, fontSize: 11 }}>
                    {cat.label}
                  </span>
                );
              })()}
              {load.loadType === 'ancillary' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--warning)', borderRadius: 999, padding: '2px 12px', background: 'color-mix(in srgb, var(--warning) 12%, transparent)', color: 'var(--warning)', fontWeight: 700, fontSize: 11 }}>
                  Ancillary
                </span>
              )}
              {load.loadType === 'auction' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid var(--accent)', borderRadius: 999, padding: '2px 12px', background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)', fontWeight: 700, fontSize: 11 }}>
                  Auction
                </span>
              )}
              {load.loadType === 'ancillary' && load.parentLoadId && (
                <span
                  role="link"
                  tabIndex={0}
                  onClick={() => navigate(`/loadcenter/command-center/${load.parentLoadId}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/loadcenter/command-center/${load.parentLoadId}`)}
                  style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
                >
                  Parent: {load.parentLoadId}
                </span>
              )}
              {load.equipment && <span style={{ color: 'var(--text-secondary)' }}>{load.equipment}</span>}
              {load.customer?.name && <span style={{ color: 'var(--text-secondary)' }}>• {load.customer.name}</span>}
              {load.carrier?.name && load.carrier.name !== '—' && <span style={{ color: 'var(--text-secondary)' }}>• Carrier: {load.carrier.name}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => navigate(-1)} style={ghostBtnStyle}>← Back</button>
            <button type="button" onClick={() => { setEditMode((p) => !p); setEditState({ saving: false, error: '', success: '' }); }} style={editMode ? accentBtnStyle : ghostBtnStyle}>
              {editMode ? 'Cancel Edit' : 'Edit Load'}
            </button>
            {editMode && <button type="button" onClick={saveLoadEdits} disabled={editState.saving} style={accentBtnStyle}>{editState.saving ? 'Saving...' : 'Save Changes'}</button>}
            {!isDeleted && <button type="button" onClick={handleVoid} style={{ ...ghostBtnStyle, color: 'var(--warning)' }}>Void</button>}
            {!isDeleted && <button type="button" onClick={handleDelete} style={{ ...ghostBtnStyle, color: 'var(--error)' }}>Delete</button>}
            {isDeleted && <button type="button" onClick={handleRestore} style={{ ...ghostBtnStyle, color: 'var(--success)' }}>Restore</button>}
            <button type="button" onClick={() => { navigator.clipboard?.writeText(load.id); }} style={ghostBtnStyle}>Copy ID</button>
          </div>
        </div>

        {editState.error && <div style={{ fontSize: 12, color: 'var(--error)' }}>{editState.error}</div>}
        {editState.success && <div style={{ fontSize: 12, color: 'var(--success)' }}>{editState.success}</div>}

        {/* health summary bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Health Score', value: `${Number(loadHealthScore).toFixed(0)} / 100`, color: loadHealthScore >= 80 ? 'var(--success)' : loadHealthScore >= 60 ? 'var(--warning)' : 'var(--error)' },
            { label: 'Margin', value: `$${Number(loadMetrics?.margin || 0).toLocaleString()} (${Number(loadMetrics?.marginPct || 0).toFixed(1)}%)`, color: (loadMetrics?.marginPct || 0) >= 12 ? 'var(--success)' : 'var(--error)' },
            { label: 'Revenue / Mile', value: `$${Number(loadMetrics?.rpm || 0).toFixed(2)}`, color: 'var(--text)' },
            { label: 'Miles', value: Number(loadMetrics?.miles || 0).toLocaleString(), color: 'var(--text)' },
            { label: 'Pickup Countdown', value: pickupCountdownLabel, color: slaRisk ? 'var(--error)' : 'var(--text)' },
            { label: 'Lane Volatility', value: `${dispatchRisk.laneVolatilityScore}%`, color: dispatchRisk.laneVolatilityScore > 60 ? 'var(--error)' : 'var(--text)' },
          ].map((kpi) => (
            <div key={kpi.label} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: '10px 14px', display: 'grid', gap: 2 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{kpi.label}</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TABS ───────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: 2 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveTab(t.key)}
            style={{
              border: 'none',
              borderBottom: activeTab === t.key ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === t.key ? 'var(--text)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: activeTab === t.key ? 700 : 500,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: OVERVIEW ──────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
          {/* left – details 8-col */}
          <div style={{ display: 'grid', gap: 24, gridColumn: 'span 8' }}>
            {/* editable fields */}
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>LOAD DETAILS</div>
              {/* ── status display (read-only at top) + editable dropdown ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <LoadStatusBadge status={normalizeLoadStatus(load.status)} />
                {load.loadId && <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>#{load.loadId}</span>}
              </div>
              {/* ── Status Transition Control (always visible) ── */}
              {(ALLOWED_STATUS_TRANSITIONS[normalizeLoadStatus(load.status)] || []).length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '8px 12px', background: 'var(--bg-alt)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Advance Status:</label>
                  <select
                    value={editDraft?.status || normalizeLoadStatus(load.status)}
                    onChange={(e) => {
                      const newStatus = e.target.value;
                      onEditChange('status', newStatus);
                      // Auto-save status change immediately
                      (async () => {
                        const result = await updateLoad(load.id, { status: newStatus, userId: 'command_center_ui', transitionReason: 'Status advanced via Load Command Center' });
                        if (!result?.error) fetchLoad(load.id);
                      })();
                    }}
                    style={{ ...inputStyle, maxWidth: 240, fontSize: 12, fontWeight: 700 }}
                  >
                    <option value={normalizeLoadStatus(load.status)}>{formatLoadStatusLabel(load.status)} (current)</option>
                    {(ALLOWED_STATUS_TRANSITIONS[normalizeLoadStatus(load.status)] || []).map((s) => (
                      <option key={s} value={s}>{formatLoadStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, fontSize: 13 }}>
                <div><strong>Customer:</strong>{' '}{editMode ? <input value={editDraft?.customerName || ''} onChange={(e) => onEditChange('customerName', e.target.value)} style={inputStyle} /> : (load.customer?.id ? <a href={`/customers/${encodeURIComponent(load.customer.id)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} title="Open customer profile">{load.customer.name || '—'}</a> : (load.customer?.name || '—'))}</div>
                <div><strong>Carrier:</strong>{' '}{editMode ? <input value={editDraft?.carrierName || ''} onChange={(e) => onEditChange('carrierName', e.target.value)} style={inputStyle} /> : ((load.carrier?.id || load.carrier?.name) && load.carrier?.name !== '—' ? <a href={`/carriers/profile/${encodeURIComponent(load.carrier.id || load.carrier.name)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} title="Open carrier profile">{load.carrier.name || '—'}</a> : (load.carrier?.name || '—'))}</div>
                <div><strong>Dispatcher:</strong>{' '}{editMode ? <input value={editDraft?.dispatcherName || ''} onChange={(e) => onEditChange('dispatcherName', e.target.value)} style={inputStyle} /> : (load.dispatcher?.name || '—')}</div>
                <div><strong>Equipment:</strong>{' '}{editMode ? (<select value={editDraft?.equipment || 'van'} onChange={(e) => onEditChange('equipment', e.target.value)} style={inputStyle}><option value="van">van</option><option value="reefer">reefer</option><option value="flatbed">flatbed</option></select>) : (load.equipment || '—')}</div>
                <div><strong>Freight Category:</strong>{' '}{editMode ? (<select value={editDraft?.freightCategory || 'adhoc'} onChange={(e) => onEditChange('freightCategory', e.target.value)} style={inputStyle}><option value="adhoc">Ad-Hoc (Transactional)</option><option value="contracted">Contracted</option><option value="spot_rate">Spot Rate (Quoting)</option><option value="capacity">Capacity (RFP)</option></select>) : ((FREIGHT_CATEGORY_META[load.freightCategory] || FREIGHT_CATEGORY_META.adhoc).label)}</div>
                <div><strong>Weight:</strong>{' '}{editMode ? <input type="number" min="0" value={editDraft?.weight || ''} onChange={(e) => onEditChange('weight', e.target.value)} style={inputStyle} /> : (load.weight ? `${Number(load.weight).toLocaleString()} lbs` : '—')}</div>
                <div><strong>Commodity:</strong>{' '}{editMode ? <input value={editDraft?.commodity || ''} onChange={(e) => onEditChange('commodity', e.target.value)} style={inputStyle} /> : (load.commodity || '—')}</div>
                <div><strong>Temperature:</strong>{' '}{editMode ? <input value={editDraft?.temperature || ''} onChange={(e) => onEditChange('temperature', e.target.value)} style={inputStyle} /> : (load.temperature ? `${load.temperature}°F` : '—')}</div>
                {editMode && (
                  <>
                    <div><strong>Miles:</strong>{' '}<input type="number" min="0" value={editDraft?.miles || ''} onChange={(e) => onEditChange('miles', e.target.value)} style={inputStyle} /></div>
                    <div><strong>Revenue:</strong>{' '}<input type="number" min="0" value={editDraft?.revenue || ''} onChange={(e) => onEditChange('revenue', e.target.value)} style={inputStyle} /></div>
                    <div><strong>Carrier Cost:</strong>{' '}<input type="number" min="0" value={editDraft?.carrierCost || ''} onChange={(e) => onEditChange('carrierCost', e.target.value)} style={inputStyle} /></div>
                    <div><strong>Margin:</strong>{' '}{(() => { const r = Number(editDraft?.revenue || 0); const c = Number(editDraft?.carrierCost || 0); const m = r - c; const p = r > 0 ? (m / r) * 100 : 0; return `$${m.toLocaleString()} (${p.toFixed(1)}%)`; })()}</div>
                  </>
                )}
              </div>
              {editMode && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <div><strong>Reference Numbers:</strong>{' '}<input value={editDraft?.referenceNumbers || ''} onChange={(e) => onEditChange('referenceNumbers', e.target.value)} style={inputStyle} placeholder="BOL, PO, PRO numbers" /></div>
                  <div><strong>Special Instructions:</strong>{' '}<textarea value={editDraft?.specialInstructions || ''} onChange={(e) => onEditChange('specialInstructions', e.target.value)} rows={3} style={{ ...inputStyle, minHeight: 60, padding: '8px 16px' }} placeholder="Driver instructions, access codes, etc." /></div>
                </div>
              )}
            </section>

            {/* route summary */}
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>ROUTE SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 16, fontSize: 13 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontWeight: 700 }}>Origin</div>
                  <div>{editMode ? (<span style={{ display: 'grid', gridTemplateColumns: '1fr 74px', gap: 6 }}><input value={editDraft?.originCity || ''} onChange={(e) => onEditChange('originCity', e.target.value)} style={inputStyle} /><input value={editDraft?.originState || ''} onChange={(e) => onEditChange('originState', e.target.value)} maxLength={2} style={inputStyle} /></span>) : (<>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</>)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{toLocationAddress(load.origin)}</div>
                  <div><strong>Pickup:</strong>{' '}{editMode ? <input type="datetime-local" value={editDraft?.pickupAt || ''} onChange={(e) => onEditChange('pickupAt', e.target.value)} style={inputStyle} /> : formatDateTime(load.pickupAt)}</div>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontWeight: 700 }}>Destination</div>
                  <div>{editMode ? (<span style={{ display: 'grid', gridTemplateColumns: '1fr 74px', gap: 6 }}><input value={editDraft?.destinationCity || ''} onChange={(e) => onEditChange('destinationCity', e.target.value)} style={inputStyle} /><input value={editDraft?.destinationState || ''} onChange={(e) => onEditChange('destinationState', e.target.value)} maxLength={2} style={inputStyle} /></span>) : (<>{load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</>)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{toLocationAddress(load.destination)}</div>
                  <div><strong>Delivery:</strong>{' '}{editMode ? <input type="datetime-local" value={editDraft?.deliveryAt || ''} onChange={(e) => onEditChange('deliveryAt', e.target.value)} style={inputStyle} /> : formatDateTime(load.deliveryAt)}</div>
                </div>
              </div>
              <div style={{ fontSize: 13 }}><strong>Lane:</strong> {toLocationLabel(load.origin) || '—'} → {toLocationLabel(load.destination) || '—'} &nbsp;•&nbsp; <strong>{Number(load.miles || 0).toLocaleString()} mi</strong></div>
              <InternalRoutePreview originLabel={toLocationLabel(load.origin)} destinationLabel={toLocationLabel(load.destination)} miles={load.miles} height={200} />
            </section>

            {/* quick financial strip */}
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>FINANCIAL SNAPSHOT</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12, fontSize: 13 }}>
                <div style={{ display: 'grid', gap: 2 }}><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Revenue</span><strong>${Number(loadMetrics?.revenue || 0).toLocaleString()}</strong></div>
                <div style={{ display: 'grid', gap: 2 }}><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Carrier Cost</span><strong>${Number(loadMetrics?.carrierCost || 0).toLocaleString()}</strong></div>
                <div style={{ display: 'grid', gap: 2 }}><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Margin</span><strong style={{ color: (loadMetrics?.marginPct || 0) >= 12 ? 'var(--success)' : 'var(--error)' }}>${Number(loadMetrics?.margin || 0).toLocaleString()} ({Number(loadMetrics?.marginPct || 0).toFixed(1)}%)</strong></div>
                <div style={{ display: 'grid', gap: 2 }}><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Rev / Mile</span><strong>${Number(loadMetrics?.rpm || 0).toFixed(2)}</strong></div>
                <div style={{ display: 'grid', gap: 2 }}><span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Cost / Mile</span><strong>${Number(loadMetrics?.cpm || 0).toFixed(2)}</strong></div>
              </div>
            </section>
          </div>

          {/* right – critical dispatch + carrier score 4-col */}
          <div style={{ display: 'grid', gap: 20, alignContent: 'start', gridColumn: 'span 4' }}>
            {/* critical dispatch card */}
            <section style={{ border: '1px solid var(--critical-field-border)', borderRadius: 10, background: 'linear-gradient(160deg, var(--critical-field-bg), var(--bg-alt))', padding: 20, display: 'grid', gap: 12 }}>
              <div style={criticalSectionLabelStyle}>CRITICAL DISPATCH</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><strong>Load Status</strong><strong style={{ color: 'var(--critical-value)', textTransform: 'capitalize' }}>{formatLoadStatusLabel(load.status)}</strong></div>
                {lifecycleModules.isPreDispatch && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>⏳ Pickup Countdown</strong><strong style={{ color: 'var(--critical-value)' }}>{pickupCountdownLabel}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📍 Distance to Pickup</strong><strong style={{ color: 'var(--critical-value)' }}>{estimatedDistanceToPickup} mi</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📈 Margin Buffer</strong><span style={{ color: marginBuffer < 0 ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>{marginBuffer >= 0 ? '+' : ''}{marginBuffer.toFixed(1)}%</span></div>
                    <button type="button" onClick={handleDispatch} style={{ ...accentBtnStyle, cursor: 'pointer' }}>Dispatch Load</button>
                  </>
                )}
                {lifecycleModules.isInTransit && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🛰 Live Tracking</strong><strong style={{ color: 'var(--critical-value)' }}>{load.carrier?.assigned ? 'Active' : 'Pending Device'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>⏱ SLA Delta</strong><span style={{ color: etaDeltaMinutes > 30 ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>{etaDeltaMinutes} min</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🛣 ETA Recalculation</strong><strong style={{ color: 'var(--critical-value)' }}>{formatDateTime(load.deliveryAt)}</strong></div>
                    <div style={{ display: 'grid', gap: 4 }}><strong>Risk Indicators</strong><div style={{ color: 'var(--critical-value)', fontWeight: 700 }}>{Array.isArray(dispatchRisk.warnings) && dispatchRisk.warnings.length > 0 ? dispatchRisk.warnings.join(', ') : 'None'}</div></div>
                  </>
                )}
                {lifecycleModules.isDeliveredOrLater && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📄 POD Panel</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedStatus === 'POD_RECEIVED' || selectedStatus === 'INVOICED' || selectedStatus === 'READY_TO_PAY' || selectedStatus === 'PAID' ? 'Received' : 'Pending Upload'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🧾 Invoice Readiness</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedStatus === 'INVOICED' || selectedStatus === 'READY_TO_PAY' || selectedStatus === 'PAID' ? 'Ready' : 'Waiting POD'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🔒 Margin Lock</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedStatus === 'PAID' ? 'Finalized' : 'Locked'}</strong></div>
                  </>
                )}
                {lifecycleModules.isException && (
                  <div style={{ border: '1px solid var(--error)', borderRadius: 8, padding: 10, background: 'rgba(220,38,38,0.08)', color: 'var(--error)', display: 'grid', gap: 6 }}>
                    <div style={{ fontWeight: 800 }}>Exception Active</div>
                    <div><strong>Reason:</strong> {load.exceptionReason || 'Exception reason required.'}</div>
                    <div><strong>Invoice:</strong> Locked</div>
                    <div><strong>Escalation:</strong> Alert module active</div>
                  </div>
                )}
                {lifecycleModules.showCapacityHeat && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>Capacity Heat</strong><strong style={{ color: 'var(--critical-value)' }}>{dispatchRisk.capacityHeatIndex ?? '—'}</strong></div>
                )}
              </div>
            </section>

            {/* carrier score */}
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>CARRIER SCORE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12 }}>Overall</span><strong style={{ fontSize: 16 }}>{Number(loadMetrics?.overallScore || 0).toFixed(0)} / 100</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ fontSize: 12 }}>Load Health Score</span><strong style={{ fontSize: 16, color: loadHealthScore >= 80 ? 'var(--success)' : loadHealthScore >= 60 ? 'var(--warning)' : 'var(--error)' }}>{Number(loadHealthScore).toFixed(0)} / 100</strong></div>
              <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Margin Health</span><span>{Number(loadMetrics?.marginScore || 0).toFixed(0)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cost Efficiency</span><span>{Number(loadMetrics?.efficiencyScore || 0).toFixed(0)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Stop Complexity</span><span>{Number(loadMetrics?.stopComplexity || 0).toFixed(0)}</span></div>
              </div>
              {/* margin strength bar */}
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>Margin Strength</span><strong>{Number(loadMetrics?.marginPct || 0).toFixed(1)}%</strong></div>
                <div style={{ height: 8, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                  <div style={{ width: `${Math.max(0, Math.min(100, Number(loadMetrics?.marginPct || 0) * 3))}%`, height: '100%', borderRadius: 999, background: marginBelowTarget ? 'var(--error)' : 'linear-gradient(90deg, var(--success), var(--accent))' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/financials`)} style={accentBtnStyle}>Open Financials</button>
                <button type="button" onClick={() => navigate('/carriers-list')} style={ghostBtnStyle}>Go to Carriers</button>
              </div>
            </section>

            {/* quick actions for this load */}
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>QUICK ACTIONS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                <button type="button" onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`)} style={ghostBtnStyle}>Load Basics</button>
                <button type="button" onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/customer-info`)} style={ghostBtnStyle}>Customer Info</button>
                <button type="button" onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/carrier-asset-info`)} style={ghostBtnStyle}>Carrier / Asset</button>
                <button type="button" onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/edit-stops`)} style={ghostBtnStyle}>Edit Stops</button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ─── TAB: ROUTE & SHIPMENT ─────────────── */}
      {activeTab === 'route' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>ROUTE DETAIL</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 20 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Origin</div>
                <div><strong>Customer:</strong> {load.customer?.name || '—'}</div>
                <div><strong>Address:</strong> {toLocationAddress(load.origin)}</div>
                <div><strong>City / State:</strong> {load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</div>
                <div><strong>Zip:</strong> {load.origin?.zip || load.origin?.postalCode || '—'}</div>
                <div><strong>Pickup:</strong> {formatDateTime(load.pickupAt)}</div>
                <div><strong>Contact:</strong> {load.origin?.contact || load.origin?.contactName || '—'}</div>
                <div><strong>Phone:</strong> {load.origin?.phone || '—'}</div>
                <div><strong>Hours:</strong> {load.origin?.hours || '—'}</div>
                <div><strong>Appointment:</strong> {load.origin?.appointmentRequired ? 'Required' : 'Not required'}</div>
              </div>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Destination</div>
                <div><strong>Customer:</strong> {load.customer?.name || '—'}</div>
                <div><strong>Address:</strong> {toLocationAddress(load.destination)}</div>
                <div><strong>City / State:</strong> {load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</div>
                <div><strong>Zip:</strong> {load.destination?.zip || load.destination?.postalCode || '—'}</div>
                <div><strong>Delivery:</strong> {formatDateTime(load.deliveryAt)}</div>
                <div><strong>Contact:</strong> {load.destination?.contact || load.destination?.contactName || '—'}</div>
                <div><strong>Phone:</strong> {load.destination?.phone || '—'}</div>
                <div><strong>Hours:</strong> {load.destination?.hours || '—'}</div>
                <div><strong>Appointment:</strong> {load.destination?.appointmentRequired ? 'Required' : 'Not required'}</div>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <div style={sectionLabelStyle}>ROUTE PROFILE</div>
            <div style={{ display: 'grid', gap: 12, fontSize: 13 }}>
              <div><strong>Lane:</strong> {toLocationLabel(load.origin) || '—'} → {toLocationLabel(load.destination) || '—'}</div>
              <div><strong>Miles / ETA:</strong> {Number(load.miles || 0).toLocaleString()} mi • {load.deliveryAt ? formatDateTime(load.deliveryAt) : 'ETA pending'}</div>
              <div><strong>Equipment:</strong> {load.equipment || '—'}</div>
              <div><strong>Weight:</strong> {load.weight ? `${Number(load.weight).toLocaleString()} lbs` : '—'}</div>
              <div><strong>Commodity:</strong> {load.commodity || '—'}</div>
              <div><strong>Temperature:</strong> {load.temperature ? `${load.temperature}°F` : 'N/A'}</div>
              <div><strong>Reference Numbers:</strong> {load.referenceNumbers || '—'}</div>
              <div><strong>Special Instructions:</strong> {load.specialInstructions || '—'}</div>
            </div>
            <InternalRoutePreview originLabel={toLocationLabel(load.origin)} destinationLabel={toLocationLabel(load.destination)} miles={load.miles} height={240} />
          </section>

          <section style={cardStyle}>
            <div style={sectionLabelStyle}>SHIPMENT PARTIES</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 16, fontSize: 13 }}>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Customer / Shipper</div>
                <div>{load.customer?.id ? <a href={`/customers/${encodeURIComponent(load.customer.id)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} title="Open customer profile">{load.customer.name || '—'}</a> : (load.customer?.name || '—')}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{load.customer?.email || ''}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{load.customer?.phone || ''}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Carrier</div>
                <div>{(load.carrier?.id || load.carrier?.name) && load.carrier?.name !== '—' ? <a href={`/carriers/profile/${encodeURIComponent(load.carrier.id || load.carrier.name)}`} style={{ color: 'var(--accent)', textDecoration: 'none' }} title="Open carrier profile">{load.carrier.name || '—'}</a> : (load.carrier?.name || '—')}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{load.carrier?.mc ? <a href={`/carriers/profile/${encodeURIComponent(load.carrier.id || load.carrier.name || load.carrier.mc)}`} style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 12 }} title="Open carrier profile">MC #{load.carrier.mc}</a> : 'MC #—'}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{load.carrier?.phone || ''}</div>
                <div style={{ color: load.carrier?.assigned ? 'var(--success)' : 'var(--warning)', fontWeight: 700, fontSize: 12 }}>{load.carrier?.assigned ? 'Assigned' : 'Not Assigned'}</div>
              </div>
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ fontWeight: 700 }}>Dispatcher</div>
                <div>{load.dispatcher?.name || '—'}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{load.dispatcher?.email || ''}</div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ─── TAB: FINANCIALS & RATE ────────────── */}
      {activeTab === 'financials' && (
        <div style={{ display: 'grid', gap: 24 }}>
          {/* Row 1: Rate Logic + Cost Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
            <div style={{ gridColumn: 'span 6' }}>
              <section style={cardStyle}>
                <div style={sectionLabelStyle}>RATE LOGIC / FINANCIALS</div>
                <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
                  {[
                    ['Miles', Number(loadMetrics?.miles || 0).toLocaleString()],
                    ['Revenue', `$${Number(loadMetrics?.revenue || 0).toLocaleString()}`],
                    ['Carrier Cost', `$${Number(loadMetrics?.carrierCost || 0).toLocaleString()}`],
                    ['Margin', `$${Number(loadMetrics?.margin || 0).toLocaleString()} (${Number(loadMetrics?.marginPct || 0).toFixed(1)}%)`],
                    ['Revenue / Mile', `$${Number(loadMetrics?.rpm || 0).toFixed(2)}`],
                    ['Cost / Mile', `$${Number(loadMetrics?.cpm || 0).toFixed(2)}`],
                    ['Market Rate (est.)', `$${Number(marketRate).toLocaleString()}`],
                    ['Opportunity Gap', `$${Number(opportunityGap).toLocaleString()}`],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{label}</span><strong>{val}</strong></div>
                  ))}
                </div>
                <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}><span>Margin Strength</span><strong>{Number(loadMetrics?.marginPct || 0).toFixed(1)}%</strong></div>
                  <div style={{ height: 10, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    <div style={{ width: `${Math.max(0, Math.min(100, Number(loadMetrics?.marginPct || 0) * 3))}%`, height: '100%', borderRadius: 999, background: marginBelowTarget ? 'var(--error)' : 'linear-gradient(90deg, var(--success), var(--accent))' }} />
                  </div>
                </div>
                <button type="button" onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/financials`)} style={accentBtnStyle}>Open Full Financials</button>
              </section>
            </div>

            <div style={{ gridColumn: 'span 6' }}>
              <section style={cardStyle}>
                <div style={sectionLabelStyle}>COST BREAKDOWN</div>
                <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Line Haul</span><strong>${Number(load.lineHaul || loadMetrics?.carrierCost || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fuel Surcharge</span><strong>${Number(load.fuelSurcharge || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Accessorials</span><strong>${Number(load.accessorials || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Detention</span><strong>${Number(load.detention || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lumper</span><strong>${Number(load.lumper || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8 }}><strong>Total Cost</strong><strong>${Number(loadMetrics?.carrierCost || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Total Revenue</strong><strong>${Number(loadMetrics?.revenue || 0).toLocaleString()}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>Net Margin</strong><strong style={{ color: (loadMetrics?.marginPct || 0) >= 12 ? 'var(--success)' : 'var(--error)' }}>${Number(loadMetrics?.margin || 0).toLocaleString()}</strong></div>
                </div>
              </section>

              <section style={{ ...cardStyle, marginTop: 24 }}>
                <div style={sectionLabelStyle}>INVOICE STATUS</div>
                <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>POD Status</span><strong>{selectedStatus === 'POD_RECEIVED' || selectedStatus === 'INVOICED' || selectedStatus === 'READY_TO_PAY' || selectedStatus === 'PAID' ? 'Received' : 'Pending'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Invoice Ready</span><strong>{selectedStatus === 'INVOICED' || selectedStatus === 'READY_TO_PAY' || selectedStatus === 'PAID' ? 'Yes' : 'No'}</strong></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Payment Status</span><strong>{selectedStatus === 'PAID' ? 'Paid' : selectedStatus === 'READY_TO_PAY' ? 'Ready to Pay' : 'Pending'}</strong></div>
                </div>
              </section>
            </div>
          </div>

          {/* Row 2: Consolidated Financials (parent + ancillary rollup) */}
          {consolidatedFin && (consolidatedFin.ancillaryCount > 0 || load.loadType !== 'ancillary') && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
              <div style={{ gridColumn: 'span 12' }}>
                <section style={{ ...cardStyle, border: '1px solid var(--accent)', background: 'linear-gradient(160deg, color-mix(in srgb, var(--accent) 4%, var(--bg-alt)), var(--bg-alt))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ ...sectionLabelStyle, color: 'var(--accent)' }}>CONSOLIDATED FINANCIALS (PARENT + ANCILLARY)</div>
                    <button type="button" onClick={() => setAddChargeOpen((p) => !p)} style={ghostBtnStyle}>{addChargeOpen ? 'Cancel' : '+ Add Ancillary Charge'}</button>
                  </div>

                  {/* Consolidated summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, fontSize: 14 }}>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>Consolidated Revenue</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent)' }}>${Number(consolidatedFin.consolidated?.revenue || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>Consolidated Cost</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>${Number(consolidatedFin.consolidated?.carrierCost || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>Consolidated Margin</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: (consolidatedFin.consolidated?.marginPct || 0) >= 12 ? 'var(--success)' : 'var(--error)' }}>${Number(consolidatedFin.consolidated?.margin || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700 }}>Ancillary Charges</div>
                      <div style={{ fontSize: 20, fontWeight: 800 }}>{consolidatedFin.ancillaryCount}</div>
                    </div>
                  </div>

                  {/* Ancillary charges table */}
                  {consolidatedFin.ancillaryCount > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border)', height: 30 }}>
                            <th style={{ textAlign: 'left', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Charge ID</th>
                            <th style={{ textAlign: 'left', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Type</th>
                            <th style={{ textAlign: 'right', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Revenue</th>
                            <th style={{ textAlign: 'right', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Cost</th>
                            <th style={{ textAlign: 'right', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Margin</th>
                            <th style={{ textAlign: 'left', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Status</th>
                            <th style={{ textAlign: 'left', padding: '0 8px', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {consolidatedFin.ancillaryCharges.map((charge) => (
                            <tr key={charge.id} style={{ borderBottom: '1px solid var(--border)', height: 32, cursor: 'pointer' }} onClick={() => navigate(`/loadcenter/command-center/${encodeURIComponent(charge.id)}`)}>
                              <td style={{ padding: '0 8px', color: 'var(--accent)', fontWeight: 700 }}>{charge.id}</td>
                              <td style={{ padding: '0 8px', textTransform: 'capitalize' }}>{(charge.ancillaryType || 'other').replace(/_/g, ' ')}</td>
                              <td style={{ padding: '0 8px', textAlign: 'right' }}>${Number(charge.revenue).toLocaleString()}</td>
                              <td style={{ padding: '0 8px', textAlign: 'right' }}>${Number(charge.carrierCost).toLocaleString()}</td>
                              <td style={{ padding: '0 8px', textAlign: 'right', color: charge.margin >= 0 ? 'var(--success)' : 'var(--error)' }}>${Number(charge.margin).toLocaleString()}</td>
                              <td style={{ padding: '0 8px' }}>{charge.status}</td>
                              <td style={{ padding: '0 8px', color: 'var(--text-secondary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{charge.notes || '—'}</td>
                            </tr>
                          ))}
                          <tr style={{ borderTop: '2px solid var(--border)', height: 32, fontWeight: 700 }}>
                            <td style={{ padding: '0 8px' }}>TOTAL</td>
                            <td style={{ padding: '0 8px' }}>{consolidatedFin.ancillaryCount} charges</td>
                            <td style={{ padding: '0 8px', textAlign: 'right' }}>${Number(consolidatedFin.totalAncillaryRevenue).toLocaleString()}</td>
                            <td style={{ padding: '0 8px', textAlign: 'right' }}>${Number(consolidatedFin.totalAncillaryCost).toLocaleString()}</td>
                            <td style={{ padding: '0 8px', textAlign: 'right' }}>${Number(consolidatedFin.totalAncillaryRevenue - consolidatedFin.totalAncillaryCost).toLocaleString()}</td>
                            <td colSpan={2} />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Add ancillary charge form */}
                  {addChargeOpen && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, background: 'var(--surface)', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12, alignItems: 'end' }}>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Charge Type</label>
                        <select value={newCharge.ancillaryType} onChange={(e) => setNewCharge((p) => ({ ...p, ancillaryType: e.target.value }))} style={inputStyle}>
                          {ANCILLARY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Revenue ($)</label>
                        <input type="number" min="0" value={newCharge.revenue} onChange={(e) => setNewCharge((p) => ({ ...p, revenue: e.target.value }))} style={inputStyle} placeholder="0" />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Carrier Cost ($)</label>
                        <input type="number" min="0" value={newCharge.carrierCost} onChange={(e) => setNewCharge((p) => ({ ...p, carrierCost: e.target.value }))} style={inputStyle} placeholder="0" />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)' }}>Notes</label>
                        <input value={newCharge.notes} onChange={(e) => setNewCharge((p) => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="Optional" />
                      </div>
                      <button type="button" onClick={handleAddAncillaryCharge} style={accentBtnStyle}>Add Charge</button>
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* Row 3: Split Billing Allocations */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
            <div style={{ gridColumn: 'span 12' }}>
              <section style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={sectionLabelStyle}>SPLIT BILLING ALLOCATIONS</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={addAllocationRow} style={ghostBtnStyle}>+ Add Party</button>
                    {allocDraft.length > 0 && <button type="button" onClick={saveAllocations} disabled={allocSaving} style={accentBtnStyle}>{allocSaving ? 'Saving...' : 'Save Allocations'}</button>}
                  </div>
                </div>

                {allocDraft.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 8 }}>
                    No billing allocations configured. This load bills 100% to the primary customer. Click "+ Add Party" to split billing across multiple parties.
                  </div>
                )}

                {allocDraft.length > 0 && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 100px 1fr 40px', gap: 8, fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', padding: '0 4px' }}>
                      <span>Party Name</span><span>Party Type</span><span>Percentage</span><span>Fixed Amt</span><span>Allocated</span><span>Notes</span><span />
                    </div>
                    {allocDraft.map((row, idx) => {
                      const consolidated = consolidatedFin?.consolidated?.revenue || loadMetrics?.revenue || 0;
                      const allocated = row.fixedAmount != null && row.fixedAmount !== '' ? Number(row.fixedAmount) : Math.round(consolidated * (Number(row.percentage) || 0) / 100);
                      return (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 100px 100px 1fr 40px', gap: 8, alignItems: 'center' }}>
                          <input value={row.partyName || ''} onChange={(e) => updateAllocRow(idx, 'partyName', e.target.value)} style={{ ...inputStyle, minHeight: 32 }} placeholder="Party name" />
                          <select value={row.partyType || 'customer'} onChange={(e) => updateAllocRow(idx, 'partyType', e.target.value)} style={{ ...inputStyle, minHeight: 32 }}>
                            <option value="customer">Customer</option>
                            <option value="carrier">Carrier</option>
                            <option value="broker">Broker</option>
                            <option value="third_party">Third Party</option>
                          </select>
                          <input type="number" min="0" max="100" value={row.percentage ?? ''} onChange={(e) => updateAllocRow(idx, 'percentage', Number(e.target.value) || 0)} style={{ ...inputStyle, minHeight: 32 }} placeholder="%" />
                          <input type="number" min="0" value={row.fixedAmount ?? ''} onChange={(e) => updateAllocRow(idx, 'fixedAmount', e.target.value === '' ? null : Number(e.target.value))} style={{ ...inputStyle, minHeight: 32 }} placeholder="—" />
                          <div style={{ fontSize: 13, fontWeight: 700, padding: '0 4px' }}>${allocated.toLocaleString()}</div>
                          <input value={row.notes || ''} onChange={(e) => updateAllocRow(idx, 'notes', e.target.value)} style={{ ...inputStyle, minHeight: 32 }} placeholder="Optional" />
                          <button type="button" onClick={() => removeAllocRow(idx)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 16, fontWeight: 700 }} title="Remove">×</button>
                        </div>
                      );
                    })}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 4px 0', borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Total allocation: <strong>{allocDraft.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0)}%</strong></span>
                      {allocDraft.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0) > 100 && (
                        <span style={{ color: 'var(--error)', fontWeight: 700 }}>Exceeds 100% — please adjust</span>
                      )}
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: DISPATCH CONTROL ─────────────── */}
      {activeTab === 'dispatch' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
          <div style={{ gridColumn: 'span 7' }}>
            <section style={{ border: '1px solid var(--critical-field-border)', borderRadius: 10, background: 'linear-gradient(160deg, var(--critical-field-bg), var(--bg-alt))', padding: 24, display: 'grid', gap: 16 }}>
              <div style={criticalSectionLabelStyle}>DISPATCH CONTROL CENTER</div>
              <div style={{ display: 'grid', gap: 10, fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}><strong>Load Status</strong><strong style={{ color: 'var(--critical-value)', textTransform: 'capitalize' }}>{formatLoadStatusLabel(load.status)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>Carrier Assigned</strong><strong style={{ color: load.carrier?.assigned ? 'var(--success)' : 'var(--warning)' }}>{load.carrier?.assigned ? `Yes — ${load.carrier.name}` : 'No'}</strong></div>

                {lifecycleModules.isPreDispatch && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>⏳ Pickup Countdown</strong><strong style={{ color: 'var(--critical-value)' }}>{pickupCountdownLabel}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📍 Distance to Pickup</strong><strong style={{ color: 'var(--critical-value)' }}>{estimatedDistanceToPickup} mi</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📈 Margin Buffer</strong><span style={{ color: marginBuffer < 0 ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>{marginBuffer >= 0 ? '+' : ''}{marginBuffer.toFixed(1)}%</span></div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleDispatch} style={accentBtnStyle}>Dispatch Load</button>
                      <button type="button" onClick={runBotRecommendCarrier} style={transparentBtnStyle}>Recommend Carrier</button>
                      <button type="button" onClick={runBotDispatch} disabled={Boolean(botWorking) || !botAddons.autoAssign} style={accentBtnStyle}>{botWorking === 'dispatch' ? 'Dispatching...' : 'Auto Dispatch'}</button>
                    </div>
                  </>
                )}
                {lifecycleModules.isInTransit && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🛰 Live Tracking</strong><strong style={{ color: 'var(--critical-value)' }}>{load.carrier?.assigned ? 'Active' : 'Pending Device'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>⏱ SLA Delta</strong><span style={{ color: etaDeltaMinutes > 30 ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>{etaDeltaMinutes} min</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🛣 ETA Recalculation</strong><strong style={{ color: 'var(--critical-value)' }}>{formatDateTime(load.deliveryAt)}</strong></div>
                    <div style={{ display: 'grid', gap: 4 }}><strong>Risk Indicators</strong><div style={{ color: 'var(--critical-value)', fontWeight: 700 }}>{Array.isArray(dispatchRisk.warnings) && dispatchRisk.warnings.length > 0 ? dispatchRisk.warnings.join(', ') : 'None'}</div></div>
                  </>
                )}
                {lifecycleModules.isDeliveredOrLater && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📄 POD Panel</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedStatus === 'POD_RECEIVED' || selectedStatus === 'INVOICED' || selectedStatus === 'READY_TO_PAY' || selectedStatus === 'PAID' ? 'Received' : 'Pending Upload'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🧾 Invoice Readiness</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedStatus === 'INVOICED' || selectedStatus === 'READY_TO_PAY' || selectedStatus === 'PAID' ? 'Ready' : 'Waiting POD'}</strong></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🔒 Margin Lock</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedStatus === 'PAID' ? 'Finalized' : 'Locked'}</strong></div>
                  </>
                )}
                {lifecycleModules.isException && (
                  <div style={{ border: '1px solid var(--error)', borderRadius: 8, padding: 12, background: 'rgba(220,38,38,0.08)', color: 'var(--error)', display: 'grid', gap: 6 }}>
                    <div style={{ fontWeight: 800 }}>Exception Active</div>
                    <div><strong>Reason:</strong> {load.exceptionReason || 'Exception reason required.'}</div>
                    <div><strong>Invoice:</strong> Locked</div>
                    <div><strong>Escalation:</strong> Alert module active</div>
                  </div>
                )}
              </div>
            </section>
          </div>

          <div style={{ gridColumn: 'span 5', display: 'grid', gap: 20, alignContent: 'start' }}>
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>RISK ASSESSMENT</div>
              <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lane Volatility</span><strong style={{ color: dispatchRisk.laneVolatilityScore > 60 ? 'var(--error)' : 'var(--success)' }}>{dispatchRisk.laneVolatilityScore}%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Capacity Heat</span><strong style={{ color: dispatchRisk.capacityHeatIndex > 70 ? 'var(--error)' : 'var(--success)' }}>{dispatchRisk.capacityHeatIndex}%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SLA Risk</span><strong style={{ color: slaRisk ? 'var(--error)' : 'var(--success)' }}>{slaRisk ? 'High' : 'Normal'}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Compliance</span><strong>{dispatchRisk.complianceStatus}</strong></div>
                <div style={{ display: 'grid', gap: 4, marginTop: 4 }}>
                  <strong>Active Warnings</strong>
                  {dispatchRisk.warnings.length > 0 ? dispatchRisk.warnings.map((w) => <div key={w} style={{ color: 'var(--warning)', fontSize: 12 }}>⚠ {w.replaceAll('_', ' ')}</div>) : <div style={{ color: 'var(--success)', fontSize: 12 }}>No warnings</div>}
                </div>
              </div>
            </section>

            <section style={cardStyle}>
              <div style={sectionLabelStyle}>DISPATCH BOT SETTINGS</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
                {[['autoAssign', 'Auto-Assign'], ['marginGuard', 'Margin Guard'], ['slaAlerts', 'SLA Alerts'], ['smartAuction', 'Smart Auction']].map(([key, label]) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={botAddons[key]} onChange={(e) => setBotAddons((p) => ({ ...p, [key]: e.target.checked }))} />{label}
                  </label>
                ))}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {recommendedCarrier ? `Recommended: ${recommendedCarrier.name} (${recommendedCarrier.confidence}% fit)` : 'No carrier recommendation yet.'}
              </div>
              {botMessage && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{botMessage}</div>}
            </section>
          </div>
        </div>
      )}

      {/* ─── TAB: MARKET INTEL ─────────────────── */}
      {activeTab === 'market' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
          <div style={{ gridColumn: 'span 8' }}>
            <MarketIntelligenceModule load={load} risk={dispatchRisk} marketRate={marketRate} opportunityGap={opportunityGap} laneLabel={`${toLocationLabel(load.origin) || '—'} → ${toLocationLabel(load.destination) || '—'}`} />
          </div>
          <div style={{ gridColumn: 'span 4', display: 'grid', gap: 20, alignContent: 'start' }}>
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>LANE ANALYTICS</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Lane Volatility</span><strong>{dispatchRisk.laneVolatilityScore}%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Capacity Heat Index</span><strong>{dispatchRisk.capacityHeatIndex}%</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Market Rate (est.)</span><strong>${Number(marketRate).toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Opportunity Gap</span><strong style={{ color: opportunityGap > 0 ? 'var(--success)' : 'var(--error)' }}>${Number(opportunityGap).toLocaleString()}</strong></div>
              </div>
            </section>
            <section style={cardStyle}>
              <div style={sectionLabelStyle}>RATE COMPARISON</div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Your Rate</span><strong>${Number(load.revenue || 0).toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Market Est.</span><strong>${Number(marketRate).toLocaleString()}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Difference</span><strong style={{ color: (marketRate - Number(load.revenue || 0)) >= 0 ? 'var(--success)' : 'var(--error)' }}>${Math.abs(marketRate - Number(load.revenue || 0)).toLocaleString()}</strong></div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* ─── TAB: AUCTION BOARD ────────────────── */}
      {activeTab === 'auction' && (
        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>AUCTION BOARD</div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Load {load.id}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, fontSize: 12 }}>
            {[['autoAssign', 'Auto-Assign'], ['marginGuard', 'Margin Guard'], ['slaAlerts', 'SLA Alerts'], ['smartAuction', 'Smart Auction']].map(([key, label]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={botAddons[key]} onChange={(e) => setBotAddons((p) => ({ ...p, [key]: e.target.checked }))} />{label}
              </label>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={runBotRecommendCarrier} disabled={Boolean(botWorking)} style={transparentBtnStyle}>Recommend Carrier</button>
            <button type="button" onClick={runBotDispatch} disabled={Boolean(botWorking) || !botAddons.autoAssign} style={accentBtnStyle}>{botWorking === 'dispatch' ? 'Dispatching...' : 'Auto Dispatch'}</button>
            <button type="button" onClick={runAuctionBot} disabled={Boolean(botWorking)} style={transparentBtnStyle}>{botWorking === 'auction' ? 'Listing...' : 'Run Auction Bot'}</button>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{recommendedCarrier ? `Recommended Carrier: ${recommendedCarrier.name} (${recommendedCarrier.confidence}% fit)` : 'No recommendation yet.'}</div>
          {botMessage && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{botMessage}</div>}

          <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 20, display: 'grid', gap: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Auction Activity</div>
            {botActivity.map((entry) => (
              <div key={entry.id} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: '12px 16px', display: 'grid', gap: 8 }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatDateTime(entry.createdAt)}</div>
                <div style={{ fontSize: 12 }}>{entry.text}</div>
              </div>
            ))}
            {botActivity.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No auction activity yet for this load.</div>}
          </div>
        </section>
      )}

      {/* ─── TAB: TIMELINE ─────────────────────── */}
      {activeTab === 'timeline' && (
        <section style={cardStyle}>
          <div style={sectionLabelStyle}>LIVE DISPATCH TIMELINE ({events.length})</div>
          <div style={{ display: 'grid', gap: 12 }}>
            {events.map((event) => (
              <div key={event.id} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '14px 18px', fontSize: 13, display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>{event.type ? String(event.type).replaceAll('_', ' ') : 'Event'}</span>
                  <span>{formatDateTime(event.createdAt || event.timestamp)}</span>
                </div>
                <div style={{ fontWeight: 600 }}>{event.message || 'No message'}</div>
                {event.userId && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>By: {event.userId}</div>}
              </div>
            ))}
            {events.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No events available for this load.</div>}
          </div>
        </section>
      )}

      {/* ─── TAB: TEAM CHAT ────────────────────── */}
      {activeTab === 'chat' && (
        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div style={sectionLabelStyle}>TEAM CHAT FEED</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['slack', 'teams'].map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChatChannel(ch)}
                  style={{
                    border: `1px solid ${chatChannel === ch ? 'var(--accent)' : 'var(--border)'}`,
                    background: chatChannel === ch ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent',
                    color: chatChannel === ch ? 'var(--bg)' : 'var(--text-secondary)',
                    borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '5px 10px', cursor: 'pointer',
                  }}
                >
                  {ch === 'slack' ? 'Slack' : 'Teams'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ maxHeight: 400, overflowY: 'auto', display: 'grid', gap: 10, paddingRight: 2 }}>
            {visibleChatMessages.map((msg) => (
              <div key={msg.id} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '12px 16px', display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>{msg.author}</span><span>{formatDateTime(msg.createdAt)}</span>
                </div>
                <div style={{ fontSize: 12 }}>{msg.text}</div>
              </div>
            ))}
            {visibleChatMessages.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No messages in this channel for this load.</div>}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            <input
              value={chatDraft}
              onChange={(e) => setChatDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendTeamMessage(); } }}
              placeholder={`Send ${chatChannel === 'slack' ? 'Slack' : 'Teams'} message`}
              style={{ minHeight: 40, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 12, padding: '0 16px' }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={sendTeamMessage} style={accentBtnStyle}>Send Message</button>
              <button type="button" onClick={() => setChatDraft(`ETA update for ${load.id}: carrier en route and on schedule.`)} style={transparentBtnStyle}>Add ETA Template</button>
              <button type="button" onClick={() => setChatDraft(`Pickup confirmed for ${load.id} at ${formatDateTime(load.pickupAt)}.`)} style={transparentBtnStyle}>Pickup Confirmed</button>
              <button type="button" onClick={() => setChatDraft(`${load.id} delivered. Awaiting POD upload.`)} style={transparentBtnStyle}>Delivery Note</button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
