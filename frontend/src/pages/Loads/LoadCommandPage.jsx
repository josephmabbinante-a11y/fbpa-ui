import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import BookLoadDialog from '../../components/BookLoadDialog';
import { useNavigate } from 'react-router-dom';
import { PrimaryTabs } from './components/PrimaryTabs';
import { SubTabs } from './components/SubTabs';
import { FilterBar } from './components/FilterBar';
import { LoadsGrid } from './components/LoadsGrid';
import { LoadDetailPanel } from './components/LoadDetailPanel';
import { FacetsBar } from './components/FacetsBar';
import { PaginationBar } from './components/PaginationBar';
import MarketIntelligenceModule from './components/MarketIntelligenceModule';
import SoftphoneWidget from './components/SoftphoneWidget';
import useLoadFilters from './hooks/useLoadFilters';
import useLoadsQuery from './hooks/useLoadsQuery';
import useLoadActions from './hooks/useLoadActions';
import useLoadSelection from './hooks/useLoadSelection';
import { addLoadBotActivity, createLoad, createLoadsBatch, deleteLoad, dispatchLoad, getLoadBotActivity, listLoads, restoreLoad, sendToBidNetwork as sendToBidNetworkApi, submitCarrierQuote, updateLoad, voidLoad } from '../../api/loadsClient';
import { getCarriers } from '../../api/client';
import InternalRoutePreview from '../../components/InternalRoutePreview';
import { useTheme } from '../../contexts/ThemeContext';
import {
  canTransitionStatus,
  deriveRouteDetailModules,
  formatLoadStatusLabel,
  LOAD_STATUSES,
  normalizeLoadStatus,
} from '../../utils/loadLifecycle';

export default function LoadCommandPage({ pageTitle = 'Load Command' }) {
  // State for booking dialog and carriers
  const [showBookDialog, setShowBookDialog] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Carriers state, fetched from backend
  const [carriers, setCarriers] = useState([]);
  const [carriersLoading, setCarriersLoading] = useState(true);
  const [carriersError, setCarriersError] = useState(null);

  // All custom hooks must be called before any usage of their returned values
  const { filters, selectedId, updateFilters, resetFilters, selectLoad } = useLoadFilters();
  const { listState, detailState, refreshList, refreshDetail } = useLoadsQuery(filters, selectedId);
  const { actionState, dispatch, reassign, sendToBidNetwork: sendToBidNetworkAction, markDelivered } = useLoadActions({ selectedId, refreshList, refreshDetail });
  const { selectedDetail } = useLoadSelection({ selectedId, listState, detailState });

  // (Removed duplicate hook calls here)

  useEffect(() => {
    setCarriersLoading(true);
    setCarriersError(null);
    getCarriers({ limit: 100 })
      .then((res) => {
        if (Array.isArray(res?.carriers)) {
          setCarriers(res.carriers);
        } else if (Array.isArray(res)) {
          setCarriers(res);
        } else {
          setCarriers([]);
        }
      })
      .catch((err) => setCarriersError(err.message || 'Failed to load carriers'))
      .finally(() => setCarriersLoading(false));
  }, []);

  // Compute canBook at top-level for use in render and booking logic
  const selectedLoad = selectedDetail?.load || null;
  const canBook = !!selectedLoad &&
    ['DRAFT', 'QUOTED', 'RATE_LOCKED', 'TENDERED'].includes(normalizeLoadStatus(selectedLoad.status)) &&
    !selectedLoad.carrier?.assigned;

  // Handler for booking a load
  const handleBookLoad = async ({ carrierId, rate, notes }) => {
    if (!selectedLoad?.id) return;
    setBookingLoading(true);
    setBookingError(null);
    try {
      const carrier = carriers.find(c => c.id === carrierId);
      const payload = {
        status: 'BOOKED',
        carrierId,
        carrierName: carrier ? carrier.name : '',
        carrierAssigned: true,
        revenue: Number(selectedLoad.revenue || 0),
        carrierCost: Number(rate),
        notes: notes || '',
        userId: 'booking_ui',
        transitionReason: 'Booked via UI',
      };
      const result = await updateLoad(selectedLoad.id, payload);
      if (result?.error) {
        setBookingError(result.error);
      } else {
        setShowBookDialog(false);
        await Promise.all([refreshList(), refreshDetail(selectedLoad.id)]);
      }
    } catch (err) {
      setBookingError(err.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  // Show Book button for eligible loads (e.g., not already BOOKED or beyond)
  // canBook will be recalculated below after selectedLoad is set
  const navigate = useNavigate();
  const { settings, setAdvancedSetting } = useTheme();
  const normalizedTitle = String(pageTitle || '').toLowerCase();
  const isLoadCenter = normalizedTitle === 'load center' || normalizedTitle === 'load board' || normalizedTitle === 'dispatch center';
  const isDispatchCenter = normalizedTitle === 'dispatch center';
  const [contextMenu, setContextMenu] = useState(null);
  const [chatChannel, setChatChannel] = useState('slack');
  const [chatDraft, setChatDraft] = useState('');
  const [chatFeedByLoad, setChatFeedByLoad] = useState({});
  const [botWorking, setBotWorking] = useState('');
  const [botMessage, setBotMessage] = useState('');
  const [recommendedCarrier, setRecommendedCarrier] = useState(null);
  const [botAddons, setBotAddons] = useState({
    autoAssign: true,
    marginGuard: true,
    slaAlerts: true,
    smartAuction: true,
  });
  const [botActivityByLoad, setBotActivityByLoad] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [showViewControls, setShowViewControls] = useState(false);
  const [editDraft, setEditDraft] = useState(null);
  const [editState, setEditState] = useState({ saving: false, error: '', success: '' });
  const [quickActionState, setQuickActionState] = useState({ busy: false, error: '', success: '' });
  const [boardLoads, setBoardLoads] = useState([]);
  const [boardLoadsLoading, setBoardLoadsLoading] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ loadId: '', carrierName: '', amount: '', notes: '' });
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState('');
  const fontScale = Number.isFinite(Number(settings?.fontScale)) ? Number(settings.fontScale) : 1;
  const fontWeight = Number.isFinite(Number(settings?.fontWeight)) ? Number(settings.fontWeight) : 600;
  const effectsStrength = Number.isFinite(Number(settings?.effectsStrength)) ? Number(settings.effectsStrength) : 1;

  // Reset key UI state on navigation or load change to prevent mixed artifacts
  useEffect(() => {
    setContextMenu(null);
    setShowViewControls(false);
    setEditMode(false);
    setEditDraft(null);
    setEditState({ saving: false, error: '', success: '' });
    setQuickActionState({ busy: false, error: '', success: '' });
  }, [pageTitle, selectedId]);

  // Fetch loads posted to the internal loadboard for carrier quoting
  const fetchBoardLoads = async () => {
    setBoardLoadsLoading(true);
    const result = await listLoads({ tab: 'posted', pageSize: 50, sort: '-updatedAt' });
    if (!result?.error) {
      setBoardLoads(Array.isArray(result?.items) ? result.items : []);
    }
    setBoardLoadsLoading(false);
  };

  useEffect(() => {
    if (isLoadCenter) {
      fetchBoardLoads();
      const interval = setInterval(fetchBoardLoads, 15000);
      return () => clearInterval(interval);
    }
  }, [isLoadCenter]);

  const handleSubmitQuote = async () => {
    if (!quoteForm.loadId || !quoteForm.carrierName || !quoteForm.amount) return;
    setQuoteSubmitting(true);
    setQuoteMessage('');
    const result = await submitCarrierQuote(quoteForm.loadId, {
      carrierName: quoteForm.carrierName,
      amount: Number(quoteForm.amount),
      notes: quoteForm.notes,
    });
    setQuoteSubmitting(false);
    if (result?.error) {
      setQuoteMessage(typeof result.error === 'string' ? result.error : 'Quote submission failed');
    } else {
      setQuoteMessage(`Quote of $${Number(quoteForm.amount).toLocaleString()} submitted for ${quoteForm.loadId}`);
      setQuoteForm({ loadId: '', carrierName: '', amount: '', notes: '' });
      fetchBoardLoads();
    }
  };

  useEffect(() => {
    if (!contextMenu) return undefined;

    const handlePointerDown = (event) => {
      if (event.target?.closest?.('[data-load-context-menu="true"]')) return;
      setContextMenu(null);
    };

    const handleScroll = () => setContextMenu(null);

    const handleEscape = (event) => {
      if (event.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu]);

  const formatDateTime = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString();
  };

  const toLocationLabel = (location) => {
    if (!location) return '';
    const city = String(location.city || '').trim();
    const state = String(location.state || '').trim();
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
  };

  const toLocationAddress = (location) => {
    if (!location) return '—';
    const explicitAddress = String(location.address || location.street || '').trim();
    if (explicitAddress) return explicitAddress;
    const label = toLocationLabel(location);
    return label || '—';
  };

  const loadMetrics = selectedDetail?.load
    ? (() => {
      const miles = Number(selectedDetail.load.miles || 0);
      const revenue = Number(selectedDetail.load.revenue || 0);
      const carrierCost = Number(selectedDetail.load.carrierCost || 0);
      const margin = revenue - carrierCost;
      const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
      const rpm = miles > 0 ? revenue / miles : 0;
      const cpm = miles > 0 ? carrierCost / miles : 0;
      const stopComplexityPenalty = 12;
      const marginScore = Math.max(0, Math.min(100, marginPct * 4));
      const efficiencyScore = Math.max(0, Math.min(100, rpm > 0 ? ((rpm - cpm) / rpm) * 100 : 0));
      const overallScore = Math.max(0, Math.min(100, (marginScore * 0.5) + (efficiencyScore * 0.35) + ((100 - stopComplexityPenalty) * 0.15)));

      return {
        miles,
        revenue,
        carrierCost,
        margin,
        marginPct,
        rpm,
        cpm,
        marginScore,
        efficiencyScore,
        stopComplexity: 100 - stopComplexityPenalty,
        overallScore,
      };
    })()
    : null;

  const toCountdownMinutes = (value) => {
    if (!value) return null;
    const ts = new Date(value).getTime();
    if (Number.isNaN(ts)) return null;
    return Math.max(0, Math.round((ts - Date.now()) / 60000));
  };

  const selectedStatus = normalizeLoadStatus(selectedDetail?.load?.status);
  const lifecycleModules = deriveRouteDetailModules(selectedStatus);
  const pickupCountdownMinutes = selectedDetail?.load ? toCountdownMinutes(selectedDetail.load.pickupAt) : null;
  const pickupCountdownLabel = pickupCountdownMinutes === null
    ? '—'
    : `${Math.floor(pickupCountdownMinutes / 60)}h ${pickupCountdownMinutes % 60}m`;
  const estimatedDistanceToPickup = selectedDetail?.load ? Math.max(25, Math.round(Number(selectedDetail.load.miles || 0) * 0.18)) : 0;
  const slaRisk = Boolean(
    selectedDetail?.load
      && lifecycleModules.showRiskIndicators
      && pickupCountdownMinutes !== null
      && pickupCountdownMinutes < 240
      && !selectedDetail.load.carrier?.assigned,
  );
  const marginBelowTarget = Boolean(selectedDetail?.load && Number(selectedDetail.load.marginPct || 0) < Number(selectedDetail.load.targetMarginPct || 12));
  const marginBuffer = Number((Number(selectedDetail?.load?.marginPct || 0) - Number(selectedDetail?.load?.targetMarginPct || 12)).toFixed(1));
  const etaDeltaMinutes = selectedDetail?.load
    ? Math.max(0, Math.round((new Date(selectedDetail.load.deliveryAt).getTime() - Date.now()) / 60000) - Math.max(0, Math.round(Number(selectedDetail.load.miles || 0) * 1.35)))
    : 0;

  const dispatchRisk = useMemo(() => {
    const serverRisk = detailState.risk || {};
    const fallbackLaneVolatility = selectedDetail?.load
      ? Math.max(12, Math.min(94,
        25
        + (selectedStatus === 'TENDERED' ? 26 : 0)
        + (selectedStatus === 'EXCEPTION' ? 18 : 0)
        + (Number(selectedDetail.load.marginPct || 0) < 12 ? 12 : 0)
        + (Number(selectedDetail.load.miles || 0) > 1200 ? 8 : 0)
      ))
      : null;

    const fallbackCapacityHeat = selectedDetail?.load
      ? Math.max(20, Math.min(96,
        40
        + (selectedDetail.load.carrier?.assigned ? -8 : 14)
        + (selectedStatus === 'TENDERED' ? 15 : 0)
        + (selectedStatus === 'IN_TRANSIT' ? -6 : 0)
        + (estimatedDistanceToPickup > 160 ? 8 : 0)
      ))
      : null;

    const fallbackWarnings = [
      ...(slaRisk ? ['sla_risk_high'] : []),
      ...(marginBelowTarget ? ['margin_below_target'] : []),
      ...(!selectedDetail?.load?.carrier?.assigned ? ['carrier_unassigned'] : []),
    ];

    return {
      ...serverRisk,
      laneVolatilityScore: Number(serverRisk.laneVolatilityScore ?? fallbackLaneVolatility ?? 0),
      capacityHeatIndex: Number(serverRisk.capacityHeatIndex ?? fallbackCapacityHeat ?? 0),
      pickupCountdownMinutes: Number(serverRisk.pickupCountdownMinutes ?? pickupCountdownMinutes ?? 0),
      etaDeltaMinutes: Number(serverRisk.etaDeltaMinutes ?? etaDeltaMinutes ?? 0),
      complianceStatus: String(serverRisk.complianceStatus || 'valid'),
      warnings: Array.isArray(serverRisk.warnings) && serverRisk.warnings.length > 0
        ? serverRisk.warnings
        : fallbackWarnings,
    };
  }, [detailState.risk, selectedDetail?.load, pickupCountdownMinutes, estimatedDistanceToPickup, selectedStatus, slaRisk, marginBelowTarget, etaDeltaMinutes]);

  const fleetAverageMarginPct = useMemo(() => {
    const items = listState.data?.items || [];
    if (items.length === 0) return 0;
    const sum = items.reduce((acc, item) => acc + Number(item.marginPct || 0), 0);
    return sum / items.length;
  }, [listState.data?.items]);

  const marginVsFleet = Number((Number(loadMetrics?.marginPct || 0) - Number(fleetAverageMarginPct || 0)).toFixed(1));
  const marketRate = Number(selectedDetail?.load?.revenue || 0) + 650;
  const opportunityGap = marketRate - Number(selectedDetail?.load?.revenue || 0);

  const loadHealthScore = selectedDetail?.load
    ? Math.max(0, Math.min(100,
      (Math.max(0, Number(loadMetrics?.marginPct || 0)) * 2.2)
      + (pickupCountdownMinutes !== null ? Math.min(25, pickupCountdownMinutes / 20) : 12)
      + (selectedDetail.load.carrier?.assigned ? 20 : 6)
      + (100 - Number(detailState.risk?.laneVolatilityScore || 40)) * 0.2
      + (marginBelowTarget ? -14 : 0)
      + (slaRisk ? -18 : 0)
    ))
    : 0;

  useEffect(() => {
    const loadId = selectedDetail?.load?.id;
    if (!loadId) return;

    setChatFeedByLoad((previous) => {
      if (Array.isArray(previous[loadId]) && previous[loadId].length > 0) {
        return previous;
      }

      const seeded = [
        {
          id: `${loadId}-seed-slack`,
          channel: 'slack',
          author: 'Dispatch Bot',
          text: `Load ${loadId} selected. Team collaboration feed ready.`,
          createdAt: new Date().toISOString(),
        },
        {
          id: `${loadId}-seed-teams`,
          channel: 'teams',
          author: 'Ops Lead',
          text: 'Confirm pickup ETA and carrier assignment updates here.',
          createdAt: new Date().toISOString(),
        },
      ];

      return {
        ...previous,
        [loadId]: seeded,
      };
    });
  }, [selectedDetail?.load?.id]);

  const activeLoadId = selectedDetail?.load?.id || '';
  const allChatMessages = activeLoadId ? (chatFeedByLoad[activeLoadId] || []) : [];
  const visibleChatMessages = allChatMessages.filter((message) => message.channel === chatChannel);

  const sendTeamMessage = () => {
    const loadId = selectedDetail?.load?.id;
    const messageText = String(chatDraft || '').trim();
    if (!loadId || !messageText) return;

    const nextMessage = {
      id: `${loadId}-${Date.now()}`,
      channel: chatChannel,
      author: 'You',
      text: messageText,
      createdAt: new Date().toISOString(),
    };

    setChatFeedByLoad((previous) => ({
      ...previous,
      [loadId]: [...(previous[loadId] || []), nextMessage],
    }));
    setChatDraft('');
  };

  const appendBotActivityLocal = (entry) => {
    if (!entry?.loadId || !entry?.text) return;
    setBotActivityByLoad((previous) => {
      const existing = Array.isArray(previous[entry.loadId]) ? previous[entry.loadId] : [];
      return {
        ...previous,
        [entry.loadId]: [entry, ...existing].slice(0, 12),
      };
    });
  };

  const appendBotActivity = async (loadId, text, source = 'dispatch-bot') => {
    if (!loadId || !text) return;
    const result = await addLoadBotActivity(loadId, { text, source });
    if (result?.item) {
      appendBotActivityLocal(result.item);
      return;
    }

    appendBotActivityLocal({
      id: `${loadId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      loadId,
      text,
      createdAt: new Date().toISOString(),
      source: `${source}-fallback`,
    });
  };

  const hydrateBotActivity = async (loadId) => {
    if (!loadId) return;
    const result = await getLoadBotActivity(loadId);
    if (result?.error || !Array.isArray(result?.items)) return;

    setBotActivityByLoad((previous) => ({
      ...previous,
      [loadId]: result.items.slice(0, 12),
    }));
  };

  const runBotRecommendCarrier = () => {
    if (!selectedLoad) {
      setBotMessage('Select a load first for Dispatch Bot recommendations.');
      return;
    }

    const equipment = String(selectedLoad.equipment || '').toLowerCase();
    const margin = Number(selectedLoad.marginPct || 0);
    const mapByEquipment = {
      van: { id: 'CR-BOT-VAN-01', name: 'Velocity Van Logistics' },
      reefer: { id: 'CR-BOT-REF-01', name: 'Polar Freight Solutions' },
      flatbed: { id: 'CR-BOT-FLT-01', name: 'IronDeck Transport' },
    };

    const baseline = mapByEquipment[equipment] || { id: 'CR-BOT-01', name: 'Prime Logistics AI Pool' };
    const confidence = Math.max(55, Math.min(96, Math.round((margin * 2.4) + 52)));

    setRecommendedCarrier({ ...baseline, confidence });
    setBotMessage(`Dispatch Bot recommended ${baseline.name} (${confidence}% fit).`);
    appendBotActivity(selectedLoad.id, `Recommended ${baseline.name} with ${confidence}% fit score.`);
  };

  const runBotDispatch = async () => {
    if (!selectedLoad) {
      setBotMessage('Select a load first.');
      return;
    }

    const carrier = recommendedCarrier || { id: 'CR-BOT-01', name: 'Prime Logistics AI Pool' };
    setBotWorking('dispatch');
    setBotMessage('');

    const result = await dispatchLoad(selectedLoad.id, {
      carrierId: carrier.id,
      carrierName: carrier.name,
      source: 'dispatch-bot-addon',
      marginGuard: botAddons.marginGuard,
      slaAlerts: botAddons.slaAlerts,
    });

    setBotWorking('');

    if (result?.error) {
      setBotMessage(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      appendBotActivity(selectedLoad.id, `Auto Dispatch failed: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`);
      return;
    }

    setBotMessage(`Dispatch Bot assigned ${carrier.name} to ${selectedLoad.id}.`);
    appendBotActivity(selectedLoad.id, `Auto-dispatched to ${carrier.name}.`);
    await Promise.all([refreshList(), refreshDetail(selectedLoad.id)]);
  };

  const runAuctionBot = async () => {
    if (!selectedLoad) {
      setBotMessage('Select a load first for Auction Bot.');
      return;
    }

    setBotWorking('auction');
    setBotMessage('');
    const result = await sendToBidNetworkApi(selectedLoad.id, {
      network: botAddons.smartAuction ? 'smart-auction-bot' : 'internal-auction-network',
      source: 'auction-bot-addon',
    });
    setBotWorking('');

    if (result?.error) {
      setBotMessage(typeof result.error === 'string' ? result.error : JSON.stringify(result.error));
      appendBotActivity(selectedLoad.id, `Auction Bot push failed: ${typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}`, 'auction-bot');
      return;
    }

    setBotMessage(`Auction Bot listed ${selectedLoad.id} (${result.requestId || 'queued'}).`);
    appendBotActivity(selectedLoad.id, `Auction Bot listed load (${result.requestId || 'queued'}).`, 'auction-bot');
  };

  const selectedBotActivity = useMemo(() => {
    if (!selectedLoad?.id) return [];
    return botActivityByLoad[selectedLoad.id] || [];
  }, [botActivityByLoad, selectedLoad?.id]);

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

  useEffect(() => {
    if (!selectedDetail?.load) {
      setEditDraft(null);
      setEditMode(false);
      setEditState({ saving: false, error: '', success: '' });
      return;
    }

    const load = selectedDetail.load;
    setEditDraft({
      status: normalizeLoadStatus(load.status),
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
    });
    setEditMode(false);
    setEditState({ saving: false, error: '', success: '' });
  }, [selectedDetail?.load]);

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

  const onEditChange = (field, value) => {
    setEditDraft((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const saveLoadEdits = async () => {
    const loadId = selectedDetail?.load?.id;
    if (!loadId || !editDraft) return;

    const currentStatus = normalizeLoadStatus(selectedDetail?.load?.status);
    const nextStatus = normalizeLoadStatus(editDraft.status);
    if (!canTransitionStatus(currentStatus, nextStatus)) {
      setEditState({
        saving: false,
        error: `Illegal transition ${formatLoadStatusLabel(currentStatus)} → ${formatLoadStatusLabel(nextStatus)}. Override role permission required.`,
        success: '',
      });
      return;
    }

    setEditState({ saving: true, error: '', success: '' });

    const payload = {
      status: editDraft.status,
      customerName: editDraft.customerName,
      carrierName: editDraft.carrierName,
      carrierAssigned: Boolean(String(editDraft.carrierName || '').trim()),
      dispatcherName: editDraft.dispatcherName,
      equipment: editDraft.equipment,
      miles: Number(editDraft.miles || 0),
      revenue: Number(editDraft.revenue || 0),
      carrierCost: Number(editDraft.carrierCost || 0),
      originCity: editDraft.originCity,
      originState: editDraft.originState,
      destinationCity: editDraft.destinationCity,
      destinationState: editDraft.destinationState,
      pickupAt: editDraft.pickupAt,
      deliveryAt: editDraft.deliveryAt,
      userId: 'load_editor',
      transitionReason: 'Manual status update from Route Detail',
    };

    const result = await updateLoad(loadId, payload);
    if (result?.error) {
      setEditState({ saving: false, error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error), success: '' });
      return;
    }

    setEditState({ saving: false, error: '', success: 'Load fields saved.' });
    setEditMode(false);
    await Promise.all([refreshList(), refreshDetail(loadId)]);
  };

  const runQuickAction = async (action, load) => {
    if (!load?.id) return;
    setQuickActionState({ busy: true, error: '', success: '' });

    let result;
    try {
      if (action === 'assign') {
        result = await dispatchLoad(load.id, {
          carrierId: load.carrier?.id || 'CR-18',
          carrierName: (load.carrier?.name && load.carrier.name !== '—') ? load.carrier.name : 'Prime Logistics',
          userId: 'dispatch_ui',
          transitionReason: 'Assign and dispatch action',
        });
      } else if (action === 'post') {
        result = await sendToBidNetworkApi(load.id, { network: 'smart-auction-board', userId: 'dispatch_ui', transitionReason: 'Posted to bid network' });
      } else if (action === 'duplicate') {
        result = await createLoad({
          customerName: load.customer?.name,
          equipment: load.equipment,
          miles: load.miles,
          revenue: load.revenue,
          carrierCost: load.carrierCost,
          origin: load.origin,
          destination: load.destination,
        });
      } else if (action === 'createAncillary') {
        const ancillaryType = load._ancillaryType || 'other';
        const realLoadId = load._ancillaryType ? (load.id || load._id) : load.id;
        result = await createLoad({
          customerName: load.customer?.name,
          equipment: load.equipment,
          miles: 0,
          revenue: 0,
          carrierCost: 0,
          origin: load.origin,
          destination: load.destination,
          loadType: 'ancillary',
          ancillaryType,
          parentLoadId: realLoadId,
          idPrefix: 'AX',
          notes: `${ancillaryType.replace(/_/g, ' ')} charge for ${realLoadId}`,
        });
      } else if (action === 'cancel') {
        result = await updateLoad(load.id, {
          status: 'ON_HOLD',
          carrierName: '—',
          carrierId: '',
          carrierAssigned: false,
          userId: 'dispatch_ui',
          transitionReason: 'Load placed on hold',
        });
      } else if (action === 'void') {
        result = await voidLoad(load.id, {
          reason: 'Voided from Load Command Center',
        });
      } else if (action === 'restore') {
        result = await restoreLoad(load.id);
      } else if (action === 'delete') {
        const confirmed = window.confirm(`Archive load ${load.id}? It will be retained and searchable.`);
        if (!confirmed) {
          setQuickActionState({ busy: false, error: '', success: '' });
          return;
        }
        result = await deleteLoad(load.id);
      } else if (action === 'view') {
        selectLoad(load.id);
        setQuickActionState({ busy: false, error: '', success: `Viewing ${load.id}` });
        return;
      }

      if (result?.error) {
        setQuickActionState({ busy: false, error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error), success: '' });
        return;
      }

      const successByAction = {
        assign: `Assigned carrier for ${load.id}`,
        post: `Posted ${load.id} to board`,
        duplicate: `Duplicated ${load.id}`,
        createAncillary: `Created ancillary load for ${load.id}`,
        cancel: `Moved ${load.id} to On Hold`,
        void: `Voided ${load.id}`,
        restore: `Restored ${load.id} to Draft`,
        delete: `Archived ${load.id}`,
      };

      setQuickActionState({ busy: false, error: '', success: successByAction[action] || 'Action completed' });
      if (action === 'delete') {
        selectLoad('');
        await refreshList();
      } else {
        await Promise.all([refreshList(), refreshDetail(load.id)]);
      }
    } catch (error) {
      setQuickActionState({ busy: false, error: typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || 'Action failed'), success: '' });
    }
  };

  const createMultipleLoads = async () => {
    const input = window.prompt('How many loads do you want to create?', '5');
    if (input === null) return;

    const count = Number.parseInt(String(input).trim(), 10);
    if (!Number.isFinite(count) || count < 1) {
      setQuickActionState({ busy: false, error: 'Enter a valid number of loads.', success: '' });
      return;
    }

    const safeCount = Math.min(50, count);
    const template = selectedLoad || {};

    setQuickActionState({ busy: true, error: '', success: '' });

    const result = await createLoadsBatch({
      count: safeCount,
      customerName: template.customer?.name || 'Customer',
      carrierName: template.carrier?.assigned ? (template.carrier?.name || 'Prime Logistics') : 'Pending',
      carrierId: template.carrier?.assigned ? (template.carrier?.id || '') : '',
      carrierAssigned: Boolean(template.carrier?.assigned),
      equipment: template.equipment || 'van',
      miles: Number(template.miles || 650),
      revenue: Number(template.revenue || 3200),
      carrierCost: Number(template.carrierCost || 2450),
      originCity: template.origin?.city || 'Dallas',
      originState: template.origin?.state || 'TX',
      destinationCity: template.destination?.city || 'Atlanta',
      destinationState: template.destination?.state || 'GA',
    });

    if (result?.error) {
      setQuickActionState({ busy: false, error: typeof result.error === 'string' ? result.error : JSON.stringify(result.error), success: '' });
      return;
    }

    const successCount = Math.max(0, Number(result?.count || (Array.isArray(result?.loads) ? result.loads.length : 0)));
    const failureCount = Math.max(0, safeCount - successCount);

    await refreshList();

    if (successCount === 0) {
      setQuickActionState({ busy: false, error: 'Failed to create loads.', success: '' });
      return;
    }

    const summary = failureCount > 0
      ? `Created ${successCount} load(s), ${failureCount} failed.`
      : `Created ${successCount} load(s).`;

    setQuickActionState({ busy: false, error: '', success: summary });
  };

  const openLoadContextMenu = (load, x, y) => {
    if (!load?.id) return;
    selectLoad(load.id);

    const menuWidth = 260;
    const menuHeight = 420;
    const viewportWidth = window.innerWidth || 1280;
    const viewportHeight = window.innerHeight || 720;

    const clampedX = Math.max(8, Math.min(x, viewportWidth - menuWidth - 8));
    const clampedY = Math.max(8, Math.min(y, viewportHeight - menuHeight - 8));

    setContextMenu({ load, x: clampedX, y: clampedY });
  };

  const runCheckCall = async (load) => {
    if (!load?.id) return;

    const checkCallMessage = `Check call initiated for ${load.id}. Requesting carrier status and ETA update.`;
    setQuickActionState({ busy: false, error: '', success: checkCallMessage });

    setChatFeedByLoad((previous) => ({
      ...previous,
      [load.id]: [
        ...(previous[load.id] || []),
        {
          id: `${load.id}-${Date.now()}-check-call`,
          channel: 'slack',
          author: 'Dispatch Ops',
          text: checkCallMessage,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    await appendBotActivity(load.id, 'Check call logged by operations.', 'check-call');
  };

  useEffect(() => {
    if (!isLoadCenter || !selectedLoad?.id) return;
    hydrateBotActivity(selectedLoad.id);
  }, [isLoadCenter, selectedLoad?.id]);

  return (
    <div className="ui-page" style={{ display: 'grid', gap: isDispatchCenter ? 8 : 24, margin: 0, padding: 0, position: 'relative' }}>
      {/* Book Load Dialog */}
      <BookLoadDialog
        open={showBookDialog}
        onClose={() => setShowBookDialog(false)}
        onBook={handleBookLoad}
        carriers={carriers}
        load={selectedLoad}
        loading={bookingLoading}
      />
      {isLoadCenter && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 20,
            display: 'grid',
            justifyItems: 'end',
            gap: 8,
          }}
        >
          <button
            type="button"
            aria-label="Open text and view controls"
            title="Text and view controls"
            onClick={() => setShowViewControls((prev) => !prev)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: '26px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.13)',
              padding: 0,
            }}
          >
            ⚙
          </button>

          {showViewControls && (
            <div
              style={{
                width: 170,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text)',
                padding: 6,
                display: 'grid',
                gap: 6,
                boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
                zIndex: 1001,
              }}
            >
              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Text size</span>
                  <span>{Math.round(fontScale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="90"
                  max="120"
                  step="5"
                  value={Math.round(fontScale * 100)}
                  onChange={(event) => setAdvancedSetting('fontScale', Number(event.target.value) / 100)}
                />
              </div>

              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Text weight</span>
                  <span>{Math.round(fontWeight)}</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="700"
                  step="50"
                  value={Math.round(fontWeight)}
                  onChange={(event) => setAdvancedSetting('fontWeight', Number(event.target.value))}
                />
              </div>

              <div style={{ display: 'grid', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span>Page effects</span>
                  <span>{Math.round(effectsStrength * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={Math.round(effectsStrength * 100)}
                  onChange={(event) => setAdvancedSetting('effectsStrength', Number(event.target.value) / 100)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: isDispatchCenter ? 4 : 32 }}>
        <div style={{ fontSize: isDispatchCenter ? 16 : 20, fontWeight: 700, color: 'var(--text)' }}>{pageTitle}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isLoadCenter && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {isDispatchCenter ? 'Dispatch center: load board, dispatch readiness, SLA risk, and exception handling.' : 'Dispatch focus: pre-dispatch readiness, in-transit SLA risk, and exception handling.'}
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: isDispatchCenter ? 4 : 14 }}>{isDispatchCenter ? 'Dispatch Center console' : 'Load Board execution console'}</div>
      {!isLoadCenter && <PrimaryTabs active="loads" />}

      <div style={{ display: 'grid', gridTemplateColumns: isDispatchCenter ? 'minmax(0,1fr) 380px' : isLoadCenter ? 'minmax(0,1fr)' : 'minmax(0,1fr) 380px', gap: 16, minHeight: '70vh' }}>
        <section style={{ minWidth: 0 }}>
          <SubTabs activeTab={filters.tab} onChange={(tab) => updateFilters({ tab })} />
          <FilterBar
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
          />
          <FacetsBar facets={listState.data?.facets} />
          {quickActionState.error && <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--error)' }}>{quickActionState.error}</div>}
          {quickActionState.success && <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--success)' }}>{quickActionState.success}</div>}
          {quickActionState.busy && <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--text-secondary)' }}>Running action...</div>}

          {listState.loading && <div style={{ padding: 12, color: 'var(--text-secondary)' }}>Loading loads...</div>}
          {listState.refreshing && !listState.loading && (
            <div style={{ padding: '4px 12px', color: 'var(--text-secondary)', fontSize: 12 }}>Refreshing loads...</div>
          )}
          {listState.error && <div style={{ padding: 12, color: 'var(--error)' }}>{listState.error}</div>}

          {!listState.loading && !listState.error && (
            <>
              <LoadsGrid
                items={listState.data?.items || []}
                selectedId={selectedId}
                onSelect={(load) => {
                  selectLoad(load.id);
                }}
                onQuickAction={runQuickAction}
                onContextMenuAction={({ load, x, y }) => {
                  openLoadContextMenu(load, x, y);
                }}
              />
              <PaginationBar
                page={filters.page}
                pageSize={filters.pageSize}
                total={listState.data?.total || 0}
                onPageChange={(page) => updateFilters({ page }, { resetPage: false })}
                onPageSizeChange={(pageSize) => updateFilters({ pageSize }, { resetPage: true })}
              />
              {isLoadCenter && (
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  background: 'linear-gradient(160deg, var(--surface), var(--surface-strong))',
                  padding: 24,
                  display: 'grid',
                  gap: 16,
                  marginTop: 24,
                  marginBottom: 24,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: 0.3 }}>INTERNAL LOADBOARD FEED</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {boardLoadsLoading ? 'Refreshing...' : `${boardLoads.length} load${boardLoads.length !== 1 ? 's' : ''} posted`}
                    </div>
                  </div>
                  {boardLoads.length === 0 && !boardLoadsLoading && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: 12 }}>No loads currently posted to the internal loadboard. Use "Post to Bid Network" on a load to make it available for carrier quoting.</div>
                  )}
                  {boardLoads.length > 0 && (
                    <div style={{ display: 'grid', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                      {boardLoads.map((load) => (
                        <div
                          key={load.id}
                          style={{
                            border: quoteForm.loadId === load.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                            borderRadius: 8,
                            background: 'var(--bg-alt)',
                            padding: '12px 16px',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: 8,
                            cursor: 'pointer',
                          }}
                          onClick={() => {
                            setQuoteForm((prev) => ({ ...prev, loadId: load.id }));
                            selectLoad(load.id);
                          }}
                        >
                          <div style={{ display: 'grid', gap: 4 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{load.id}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {load.origin?.city}, {load.origin?.state} → {load.destination?.city}, {load.destination?.state}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              {load.miles} mi · {load.equipment} · {load.customer?.name || 'Unknown'}
                            </div>
                            {Array.isArray(load.carrierQuotes) && load.carrierQuotes.length > 0 && (
                              <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                {load.carrierQuotes.length} quote{load.carrierQuotes.length !== 1 ? 's' : ''} received
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>${Number(load.revenue || 0).toLocaleString()}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              ${(load.miles > 0 ? (load.revenue / load.miles) : 0).toFixed(2)}/mi
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quote Submission Form */}
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 16, display: 'grid', gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>SUBMIT CARRIER QUOTE</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Load ID</label>
                        <input
                          type="text"
                          value={quoteForm.loadId}
                          readOnly
                          placeholder="Select a load above"
                          style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Carrier Name</label>
                        <input
                          type="text"
                          value={quoteForm.carrierName}
                          onChange={(e) => setQuoteForm((prev) => ({ ...prev, carrierName: e.target.value }))}
                          placeholder="Carrier name"
                          style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Quote Amount ($)</label>
                        <input
                          type="number"
                          value={quoteForm.amount}
                          onChange={(e) => setQuoteForm((prev) => ({ ...prev, amount: e.target.value }))}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gap: 4 }}>
                      <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>Notes (optional)</label>
                      <input
                        type="text"
                        value={quoteForm.notes}
                        onChange={(e) => setQuoteForm((prev) => ({ ...prev, notes: e.target.value }))}
                        placeholder="Transit time, equipment notes, etc."
                        style={{ padding: '6px 10px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', color: 'var(--text)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={handleSubmitQuote}
                        disabled={!quoteForm.loadId || !quoteForm.carrierName || !quoteForm.amount || quoteSubmitting}
                        style={{
                          border: '1px solid var(--accent-2)',
                          background: (!quoteForm.loadId || !quoteForm.carrierName || !quoteForm.amount) ? 'var(--bg-alt)' : 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                          color: (!quoteForm.loadId || !quoteForm.carrierName || !quoteForm.amount) ? 'var(--text-secondary)' : 'var(--bg)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 36,
                          padding: '0 20px',
                          cursor: (!quoteForm.loadId || !quoteForm.carrierName || !quoteForm.amount) ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {quoteSubmitting ? 'Submitting...' : 'Submit Quote'}
                      </button>
                      {quoteMessage && <div style={{ fontSize: 12, color: quoteMessage.includes('failed') ? 'var(--error)' : 'var(--success)' }}>{quoteMessage}</div>}
                    </div>
                  </div>

                  {/* Show quotes for the selected load */}
                  {quoteForm.loadId && (() => {
                    const boardLoad = boardLoads.find((l) => l.id === quoteForm.loadId);
                    const quotes = boardLoad?.carrierQuotes || [];
                    if (quotes.length === 0) return null;
                    return (
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 16, display: 'grid', gap: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>QUOTES FOR {quoteForm.loadId}</div>
                        {quotes.map((q) => (
                          <div key={q.id} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, background: 'var(--surface)' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{q.carrierName}</div>
                              {q.notes && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{q.notes}</div>}
                              <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{new Date(q.submittedAt).toLocaleString()}</div>
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)' }}>${Number(q.amount).toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}

          {contextMenu?.load && createPortal(
            <div
              role="menu"
              data-load-context-menu="true"
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 9999,
                width: 260,
                maxHeight: 'calc(100vh - 16px)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--surface)',
                boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
                overflowY: 'auto',
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Load {contextMenu.load.id} Shortcuts
              </div>
              {(() => {
                const isDeleted = String(contextMenu.load?.status || '').toLowerCase() === 'deleted' || Boolean(contextMenu.load?.deletedAt);
                const status = normalizeLoadStatus(contextMenu.load?.status);
                const isPreBooking = ['DRAFT', 'QUOTED', 'RATE_LOCKED'].includes(status);
                const isBookedPreDispatch = ['BOOKED', 'TENDERED', 'CARRIER_ASSIGNED', 'DRIVER_ASSIGNED', 'PRE_DISPATCH'].includes(status);
                const isDispatched = status === 'DISPATCHED' || status === 'AT_PICKUP' || status === 'LOADED';
                const isInTransit = ['IN_TRANSIT', 'AT_DELIVERY'].includes(status);
                const isPostDelivery = ['DELIVERED', 'POD_RECEIVED', 'INVOICED', 'READY_TO_PAY', 'PAID'].includes(status);
                const isFinancialException = ['SHORT_PAID', 'RECONCILIATION_REQUIRED', 'CLAIM_OPEN'].includes(status);
                const isOperationalException = ['EXCEPTION', 'DETENTION_ACTIVE', 'LAYOVER_REQUIRED', 'TONU_PENDING'].includes(status);
                const isOnHold = status === 'ON_HOLD';
                const isCancelled = status === 'CANCELLED';
                const isPaid = status === 'PAID';
                const isAncillary = String(contextMenu.load?.id || '').startsWith('AX-');
                const isAuction = String(contextMenu.load?.id || '').startsWith('AL-');

                const items = [
                  // ─── Pre-booking actions ───
                  { label: 'Get Quote', key: 'getQuote', show: isPreBooking, section: 'workflow', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`) },
                  { label: 'Book Load', key: 'book', show: isPreBooking && status !== 'DRAFT', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/carrier-asset-info`) },
                  { label: 'Post to Bid Network', key: 'post', show: isPreBooking || (isBookedPreDispatch && !isDispatched), section: 'workflow' },

                  // ─── Carrier / dispatch actions ───
                  { label: 'Assign Carrier', key: 'assign', show: isBookedPreDispatch && !['DRIVER_ASSIGNED', 'PRE_DISPATCH'].includes(status), section: 'dispatch' },
                  { label: 'Dispatch Load', key: 'dispatch', show: status === 'PRE_DISPATCH', section: 'dispatch', onClick: (load) => runQuickAction('assign', load) },
                  { label: 'Reassign Carrier', key: 'reassign', show: isBookedPreDispatch || isDispatched, section: 'dispatch', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/carrier-asset-info`) },

                  // ─── In-transit actions ───
                  { label: 'Update ETA', key: 'updateEta', show: isInTransit, section: 'transit', onClick: (load) => navigate(`/loadcenter/command-center/${encodeURIComponent(load.id)}`) },
                  { label: 'Report Exception', key: 'reportException', show: isDispatched || isInTransit, section: 'transit', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`) },
                  { label: 'Mark Delivered', key: 'markDelivered', show: status === 'AT_DELIVERY', section: 'transit', onClick: (load) => { runQuickAction('assign', load); } },

                  // ─── Post-delivery actions ───
                  { label: 'Upload POD', key: 'uploadPod', show: status === 'DELIVERED', section: 'post', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`) },
                  { label: 'Generate Invoice', key: 'genInvoice', show: status === 'POD_RECEIVED', section: 'post', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`) },
                  { label: 'Approve Payment', key: 'approvePayment', show: status === 'READY_TO_PAY', section: 'post', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`) },

                  // ─── Exception / hold handling ───
                  { label: 'Resolve Exception', key: 'resolveException', show: isOperationalException, section: 'exception', onClick: (load) => navigate(`/loadcenter/command-center/${encodeURIComponent(load.id)}`) },
                  { label: 'File Claim', key: 'fileClaim', show: isOperationalException || isFinancialException, section: 'exception', onClick: (load) => navigate(`/exceptions`) },
                  { label: 'Resume from Hold', key: 'resumeHold', show: isOnHold, section: 'exception', onClick: (load) => runQuickAction('cancel', load) },
                  { label: 'Reconcile', key: 'reconcile', show: isFinancialException, section: 'exception', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`) },

                  // ─── Ancillary load specific ───
                  { label: 'View Parent Load', key: 'viewParent', show: isAncillary && contextMenu.load?.parentLoadId, section: 'ancillary', onClick: (load) => navigate(`/loadcenter/command-center/${encodeURIComponent(load.parentLoadId)}`) },

                  // ─── Lifecycle actions (always available where valid) ───
                  { label: '—', key: 'sep1', separator: true, show: true },
                  { label: 'Duplicate Load', key: 'duplicate', show: !isCancelled && !isDeleted, section: 'general' },

                  // ─── Ancillary charge types (expanded) ───
                  { label: 'Add Detention Charge', key: 'addDetention', show: !isCancelled && !isDeleted && !isPaid && !isAncillary, section: 'general', onClick: (load) => runQuickAction('createAncillary', { ...load, _ancillaryType: 'detention' }) },
                  { label: 'Add Lumper Charge', key: 'addLumper', show: !isCancelled && !isDeleted && !isPaid && !isAncillary, section: 'general', onClick: (load) => runQuickAction('createAncillary', { ...load, _ancillaryType: 'lumper' }) },
                  { label: 'Add TONU Charge', key: 'addTonu', show: !isCancelled && !isDeleted && !isPaid && !isAncillary, section: 'general', onClick: (load) => runQuickAction('createAncillary', { ...load, _ancillaryType: 'tonu' }) },
                  { label: 'Add Layover Charge', key: 'addLayover', show: !isCancelled && !isDeleted && !isPaid && !isAncillary, section: 'general', onClick: (load) => runQuickAction('createAncillary', { ...load, _ancillaryType: 'layover' }) },
                  { label: 'Add Other Ancillary', key: 'addOtherAncillary', show: !isCancelled && !isDeleted && !isPaid && !isAncillary, section: 'general', onClick: (load) => runQuickAction('createAncillary', { ...load, _ancillaryType: 'other' }) },
                  { label: 'Place On Hold', key: 'cancel', show: !isCancelled && !isDeleted && !isPaid && !isOnHold && !isPostDelivery, section: 'general' },
                  { label: 'Void Load', key: 'void', show: !isDeleted && !isCancelled && !isPaid, section: 'general' },
                  { label: 'Archive Load', key: 'delete', show: !isDeleted && (isCancelled || isPaid || isPreBooking), section: 'general' },
                  { label: 'Restore Load', key: 'restore', show: isDeleted, section: 'general' },

                  // ─── Navigation ───
                  { label: '—', key: 'sep2', separator: true, show: true },
                  { label: 'View in Panel', key: 'view', show: true, section: 'nav' },
                  { label: 'Open in Command Center', key: 'goLoadManagement', show: true, section: 'nav', onClick: (load) => navigate(`/loadcenter/command-center/${encodeURIComponent(load.id)}`) },
                  { label: 'Open in New Tab', key: 'openTab', show: true, section: 'nav' },
                  { label: 'Open Load Basics', key: 'goLoadBasics', show: true, section: 'nav', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`) },
                  { label: 'Open Financials', key: 'goFinancials', show: true, section: 'nav', onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`) },
                  { label: 'Open Dispatch Screen', key: 'dispatchScreen', show: true, section: 'nav', onClick: (load) => navigate(`/loadcenter/dispatch-screen?selected=${encodeURIComponent(load.id)}`) },
                  { label: 'Copy Load ID', key: 'copyId', show: true, section: 'nav' },
                ]
                  .filter((item) => item.show)
                  .map((action) => {
                    if (action.separator) {
                      return <div key={action.key} style={{ borderBottom: '1px solid var(--border)', margin: '2px 0' }} />;
                    }
                    return (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => {
                        if (typeof action.onClick === 'function') {
                          action.onClick(contextMenu.load);
                        } else if (action.key === 'openTab') {
                          window.open(`/loadcenter/command-center/${encodeURIComponent(contextMenu.load.id)}`, '_blank', 'noopener,noreferrer');
                        } else if (action.key === 'copyId') {
                          navigator.clipboard?.writeText(contextMenu.load.id);
                        } else {
                          runQuickAction(action.key, contextMenu.load);
                        }
                        setContextMenu(null);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        borderBottom: '1px solid var(--border)',
                        background: 'transparent',
                        color: action.section === 'exception' ? 'var(--warning)' : action.key === 'void' || action.key === 'delete' ? 'var(--error)' : 'var(--text)',
                        fontSize: 12,
                        padding: '8px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      {action.label}
                    </button>
                  );
                  });
              })()}
            </div>,
            document.body
          )}
        </section>

        {(!isLoadCenter || isDispatchCenter) && (
          <aside style={{ display: 'grid', gap: 16, alignContent: 'start', position: 'sticky', top: 16, alignSelf: 'start', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
            <LoadDetailPanel
              detail={selectedDetail}
              risk={dispatchRisk}
              events={detailState.events}
              actionState={actionState}
              onDispatch={dispatch}
              onReassign={reassign}
              onBidNetwork={sendToBidNetworkAction}
              onDelivered={markDelivered}
            />
            {isDispatchCenter && <SoftphoneWidget selectedLoad={selectedLoad} />}
          </aside>
        )}
      </div>

      {detailState.loading && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Loading selected load details...</div>}
      {detailState.error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{detailState.error}</div>}
    </div>
  );
}
