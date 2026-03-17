import React, { useEffect, useMemo, useState } from 'react';
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
import useLoadFilters from './hooks/useLoadFilters';
import useLoadsQuery from './hooks/useLoadsQuery';
import useLoadActions from './hooks/useLoadActions';
import useLoadSelection from './hooks/useLoadSelection';
import { addLoadBotActivity, createLoad, createLoadsBatch, deleteLoad, dispatchLoad, getLoadBotActivity, restoreLoad, sendToBidNetwork as sendToBidNetworkApi, updateLoad, voidLoad } from '../../api/loadsClient';
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
  const isLoadCenter = normalizedTitle === 'load center' || normalizedTitle === 'load board';
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
    <div className="ui-page" style={{ display: 'grid', gap: 24, margin: 0, padding: 0, position: 'relative' }}>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)' }}>{pageTitle}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {canBook && (
            <button
              type="button"
              onClick={() => setShowBookDialog(true)}
              style={{ padding: '4px 10px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 28 }}
            >
              Book
            </button>
          )}
          {isLoadCenter && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Dispatch focus: pre-dispatch readiness, in-transit SLA risk, and exception handling.
            </div>
          )}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14 }}>Load Board execution console</div>
      {!isLoadCenter && <PrimaryTabs active="loads" />}

      <div style={{ display: 'grid', gridTemplateColumns: isLoadCenter ? 'minmax(0,1fr)' : 'minmax(0,1fr) 380px', gap: 16, minHeight: '70vh' }}>
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
                selectedDetail?.load ? (
                <>
                <div
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    background: 'linear-gradient(160deg, var(--surface), var(--surface-strong))',
                    padding: 24,
                    display: 'grid',
                    gap: 24,
                    marginTop: 32,
                    marginBottom: 32,
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openLoadContextMenu(selectedDetail.load, event.clientX, event.clientY);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: 2 }}>
                      <div style={{ ...sectionLabelStyle, fontSize: 'var(--section-label-preview-size, 11px)', letterSpacing: 'var(--section-label-preview-tracking, 0.4px)' }}>LOAD COMMAND CENTER PREVIEW</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>Load {selectedDetail.load.id}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Status:{' '}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid var(--border)',
                            borderRadius: 999,
                            padding: '2px 10px',
                            background: 'var(--bg-alt)',
                            color: 'var(--text)',
                            fontWeight: 700,
                            textTransform: 'capitalize',
                          }}
                        >
                          {formatLoadStatusLabel(selectedDetail.load.status)}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditMode((prev) => !prev);
                          setEditState({ saving: false, error: '', success: '' });
                        }}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--bg-alt)',
                          color: 'var(--text)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 40,
                          padding: '0 20px',
                          cursor: 'pointer',
                        }}
                      >
                        {editMode ? 'Cancel Edit' : 'Edit Fields'}
                      </button>
                      {editMode && (
                        <button
                          type="button"
                          onClick={saveLoadEdits}
                          disabled={editState.saving}
                          style={{
                            border: '1px solid var(--accent-2)',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                            color: 'var(--bg)',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            minHeight: 40,
                            padding: '0 20px',
                            cursor: 'pointer',
                          }}
                        >
                          {editState.saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedDetail?.load?.id) return;
                          const confirmed = window.confirm(`Void load ${selectedDetail.load.id}? This marks it as void and unassigns carrier.`);
                          if (!confirmed) return;
                          runQuickAction('void', selectedDetail.load);
                        }}
                        style={{
                          border: '1px solid var(--error)',
                          background: 'var(--bg-alt)',
                          color: 'var(--error)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 40,
                          padding: '0 20px',
                          cursor: 'pointer',
                        }}
                      >
                        Void Load
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedDetail?.load?.id) return;
                          const confirmed = window.confirm(`Delete load ${selectedDetail.load.id}? This cannot be undone.`);
                          if (!confirmed) return;
                          runQuickAction('delete', selectedDetail.load);
                        }}
                        style={{
                          border: '1px solid var(--error)',
                          background: 'transparent',
                          color: 'var(--error)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 40,
                          padding: '0 20px',
                          cursor: 'pointer',
                        }}
                      >
                        Delete Load
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/loadcenter?selected=${encodeURIComponent(selectedDetail.load.id)}`)}
                        style={{
                          border: '1px solid var(--accent-2)',
                          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                          color: 'var(--bg)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 40,
                          padding: '0 20px',
                          cursor: 'pointer',
                        }}
                      >
                        Open in Load Command Center
                      </button>
                      <button
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(selectedDetail.load.id)}
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--bg-alt)',
                          color: 'var(--text)',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          minHeight: 40,
                          padding: '0 20px',
                          cursor: 'pointer',
                        }}
                      >
                        Copy Load ID
                      </button>
                    </div>
                  </div>

                  {editState.error && <div style={{ fontSize: 12, color: 'var(--error)' }}>{editState.error}</div>}
                  {editState.success && <div style={{ fontSize: 12, color: 'var(--success)' }}>{editState.success}</div>}

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24 }}>
                    <div style={{ display: 'grid', gap: 24, gridColumn: 'span 8' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 16, fontSize: 13 }}>
                        <div>
                          <strong>Status:</strong>{' '}
                          {editMode ? (
                            <select value={editDraft?.status || 'DRAFT'} onChange={(event) => onEditChange('status', event.target.value)} style={inputStyle}>
                              {LOAD_STATUSES.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          ) : (formatLoadStatusLabel(selectedDetail.load.status) || '—')}
                        </div>
                        <div>
                          <strong>Customer:</strong>{' '}
                          {editMode ? <input value={editDraft?.customerName || ''} onChange={(event) => onEditChange('customerName', event.target.value)} style={inputStyle} /> : (selectedDetail.load.customer?.name || '—')}
                        </div>
                        <div>
                          <strong>Carrier:</strong>{' '}
                          {editMode ? <input value={editDraft?.carrierName || ''} onChange={(event) => onEditChange('carrierName', event.target.value)} style={inputStyle} /> : (selectedDetail.load.carrier?.name || '—')}
                        </div>
                        <div>
                          <strong>Dispatcher:</strong>{' '}
                          {editMode ? <input value={editDraft?.dispatcherName || ''} onChange={(event) => onEditChange('dispatcherName', event.target.value)} style={inputStyle} /> : (selectedDetail.load.dispatcher?.name || '—')}
                        </div>
                        <div>
                          <strong>Equipment:</strong>{' '}
                          {editMode ? (
                            <select value={editDraft?.equipment || 'van'} onChange={(event) => onEditChange('equipment', event.target.value)} style={inputStyle}>
                              <option value="van">van</option>
                              <option value="reefer">reefer</option>
                              <option value="flatbed">flatbed</option>
                            </select>
                          ) : (selectedDetail.load.equipment || '—')}
                        </div>
                        {editMode && (
                          <>
                            <div>
                              <strong>Miles:</strong>{' '}
                              <input type="number" min="0" value={editDraft?.miles || ''} onChange={(event) => onEditChange('miles', event.target.value)} style={inputStyle} />
                            </div>
                            <div>
                              <strong>Revenue:</strong>{' '}
                              <input type="number" min="0" value={editDraft?.revenue || ''} onChange={(event) => onEditChange('revenue', event.target.value)} style={inputStyle} />
                            </div>
                            <div>
                              <strong>Carrier Cost:</strong>{' '}
                              <input type="number" min="0" value={editDraft?.carrierCost || ''} onChange={(event) => onEditChange('carrierCost', event.target.value)} style={inputStyle} />
                            </div>
                            <div>
                              <strong>Margin:</strong>{' '}
                              {(() => {
                                const revenue = Number(editDraft?.revenue || 0);
                                const carrierCost = Number(editDraft?.carrierCost || 0);
                                const margin = revenue - carrierCost;
                                const pct = revenue > 0 ? (margin / revenue) * 100 : 0;
                                return `$${margin.toLocaleString()} (${pct.toFixed(1)}%)`;
                              })()}
                            </div>
                          </>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0,1fr))', gap: 24, alignItems: 'start' }}>
                        <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 16, gridColumn: 'span 7' }}>
                          <div style={sectionLabelStyle}>ROUTE DETAIL</div>
                          <div style={{ display: 'grid', gap: 16, fontSize: 14 }}>
                            <div>
                              <strong>Origin:</strong>{' '}
                              {editMode ? (
                                <span style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 74px', gap: 6 }}>
                                  <input value={editDraft?.originCity || ''} onChange={(event) => onEditChange('originCity', event.target.value)} style={inputStyle} />
                                  <input value={editDraft?.originState || ''} onChange={(event) => onEditChange('originState', event.target.value)} maxLength={2} style={inputStyle} />
                                </span>
                              ) : (<>{selectedDetail.load.origin?.city || '—'}{selectedDetail.load.origin?.state ? `, ${selectedDetail.load.origin.state}` : ''}</>)}
                            </div>
                            <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 12, display: 'grid', gap: 8 }}>
                              <div style={sectionLabelStyle}>ROUTE PROFILE</div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                                <div style={{ display: 'grid', gap: 4 }}>
                                  <div style={{ fontWeight: 700 }}>Origin</div>
                                  <div><strong>Customer:</strong> {selectedDetail.load.customer?.name || '—'}</div>
                                  <div><strong>Address:</strong> {toLocationAddress(selectedDetail.load.origin)}</div>
                                </div>
                                <div style={{ display: 'grid', gap: 4 }}>
                                  <div style={{ fontWeight: 700 }}>Destination</div>
                                  <div><strong>Customer:</strong> {selectedDetail.load.customer?.name || '—'}</div>
                                  <div><strong>Address:</strong> {toLocationAddress(selectedDetail.load.destination)}</div>
                                </div>
                              </div>
                              <div><strong>Lane:</strong> {toLocationLabel(selectedDetail.load.origin) || '—'} → {toLocationLabel(selectedDetail.load.destination) || '—'}</div>
                              <div><strong>Miles / ETA:</strong> {Number(selectedDetail.load.miles || 0).toLocaleString()} mi • {selectedDetail.load.deliveryAt ? formatDateTime(selectedDetail.load.deliveryAt) : 'ETA pending'}</div>
                              <InternalRoutePreview
                                originLabel={toLocationLabel(selectedDetail.load.origin)}
                                destinationLabel={toLocationLabel(selectedDetail.load.destination)}
                                miles={selectedDetail.load.miles}
                                height={160}
                              />
                            </div>
                            <div>
                              <strong>Destination:</strong>{' '}
                              {editMode ? (
                                <span style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 74px', gap: 6 }}>
                                  <input value={editDraft?.destinationCity || ''} onChange={(event) => onEditChange('destinationCity', event.target.value)} style={inputStyle} />
                                  <input value={editDraft?.destinationState || ''} onChange={(event) => onEditChange('destinationState', event.target.value)} maxLength={2} style={inputStyle} />
                                </span>
                              ) : (<>{selectedDetail.load.destination?.city || '—'}{selectedDetail.load.destination?.state ? `, ${selectedDetail.load.destination.state}` : ''}</>)}
                            </div>
                            <div>
                              <strong>Pickup:</strong>{' '}
                              {editMode ? <input type="datetime-local" value={editDraft?.pickupAt || ''} onChange={(event) => onEditChange('pickupAt', event.target.value)} style={inputStyle} /> : formatDateTime(selectedDetail.load.pickupAt)}
                            </div>
                            <div>
                              <strong>Delivery:</strong>{' '}
                              {editMode ? <input type="datetime-local" value={editDraft?.deliveryAt || ''} onChange={(event) => onEditChange('deliveryAt', event.target.value)} style={inputStyle} /> : formatDateTime(selectedDetail.load.deliveryAt)}
                            </div>
                          </div>
                        </section>

                        <section style={{ border: '1px solid var(--critical-field-border)', borderRadius: 10, background: 'linear-gradient(160deg, var(--critical-field-bg), var(--bg-alt))', padding: 20, display: 'grid', gap: 12, gridColumn: 'span 5' }}>
                          <div style={criticalSectionLabelStyle}>CRITICAL DISPATCH</div>
                          <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>Load Status</strong><strong style={{ color: 'var(--critical-value)', textTransform: 'capitalize' }}>{formatLoadStatusLabel(selectedDetail.load.status)}</strong></div>

                            {lifecycleModules.isPreDispatch && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>⏳ Pickup Countdown</strong><strong style={{ color: 'var(--critical-value)' }}>{pickupCountdownLabel}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📍 Distance to Pickup</strong><strong style={{ color: 'var(--critical-value)' }}>{estimatedDistanceToPickup} mi</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>📈 Margin Buffer</strong><span style={{ color: marginBuffer < 0 ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>{marginBuffer >= 0 ? '+' : ''}{marginBuffer.toFixed(1)}%</span></div>
                                <button
                                  type="button"
                                  onClick={dispatch}
                                  disabled={!selectedDetail.controls?.canDispatch || actionState?.busy}
                                  style={{ border: '1px solid var(--accent-2)', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', color: 'var(--bg)', borderRadius: 8, minHeight: 34, fontWeight: 700, cursor: (!selectedDetail.controls?.canDispatch || actionState?.busy) ? 'not-allowed' : 'pointer' }}
                                >
                                  Dispatch Load
                                </button>
                              </>
                            )}

                            {lifecycleModules.isInTransit && (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🛰 Live Tracking</strong><strong style={{ color: 'var(--critical-value)' }}>{selectedDetail.load.carrier?.assigned ? 'Active' : 'Pending Device'}</strong></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>⏱ SLA Delta</strong><span style={{ color: etaDeltaMinutes > 30 ? 'var(--error)' : 'var(--success)', fontWeight: 700 }}>{etaDeltaMinutes} min</span></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>🛣 ETA Recalculation</strong><strong style={{ color: 'var(--critical-value)' }}>{formatDateTime(selectedDetail.load.deliveryAt)}</strong></div>
                                <div style={{ display: 'grid', gap: 4 }}>
                                  <strong>Risk Indicators</strong>
                                  <div style={{ color: 'var(--critical-value)', fontWeight: 700 }}>
                                    {Array.isArray(dispatchRisk.warnings) && dispatchRisk.warnings.length > 0 ? dispatchRisk.warnings.join(', ') : 'None'}
                                  </div>
                                </div>
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
                                <div><strong>Reason:</strong> {selectedDetail.load.exceptionReason || 'Exception reason required.'}</div>
                                <div><strong>Invoice:</strong> Locked</div>
                                <div><strong>Escalation:</strong> Alert module active</div>
                              </div>
                            )}

                            {lifecycleModules.showCapacityHeat && (
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong>Capacity Heat</strong><strong style={{ color: 'var(--critical-value)' }}>{dispatchRisk.capacityHeatIndex ?? '—'}</strong></div>
                            )}
                          </div>
                        </section>
                      </div>

                      <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 16 }}>
                        <div style={sectionLabelStyle}>
                          LIVE DISPATCH TIMELINE ({detailState.events?.length || 0})
                        </div>
                        {(detailState.events || []).slice(0, 4).map((event) => (
                          <div key={event.id} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '12px 16px', fontSize: 12, display: 'grid', gap: 8 }}>
                            <div style={{ color: 'var(--text-secondary)' }}>{formatDateTime(event.createdAt || event.timestamp)}</div>
                            <div style={{ fontWeight: 700 }}>{event.type ? String(event.type).replaceAll('_', ' ') : 'Event'}</div>
                            <div>{event.message || 'No message'}</div>
                          </div>
                        ))}
                        {(!detailState.events || detailState.events.length === 0) && (
                          <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>No events available for this load.</div>
                        )}
                      </section>
                    </div>

                    <div style={{ display: 'grid', gap: 20, alignContent: 'start', gridColumn: 'span 4' }}>
                      <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 12 }}>
                        <div style={sectionLabelStyle}>RATE LOGIC / FINANCIALS</div>
                        <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Miles</span><strong>{Number(loadMetrics?.miles || 0).toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Revenue</span><strong>${Number(loadMetrics?.revenue || 0).toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Carrier Cost</span><strong>${Number(loadMetrics?.carrierCost || 0).toLocaleString()}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Margin</span><strong>${Number(loadMetrics?.margin || 0).toLocaleString()} ({Number(loadMetrics?.marginPct || 0).toFixed(1)}%)</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Revenue / Mile</span><strong>${Number(loadMetrics?.rpm || 0).toFixed(2)}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cost / Mile</span><strong>${Number(loadMetrics?.cpm || 0).toFixed(2)}</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fleet Avg Margin</span><strong>{fleetAverageMarginPct.toFixed(1)}%</strong></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>vs Fleet Avg</span><strong style={{ color: marginVsFleet >= 0 ? 'var(--success)' : 'var(--error)' }}>{marginVsFleet >= 0 ? '▲' : '▼'} {Math.abs(marginVsFleet).toFixed(1)}%</strong></div>
                          <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Margin Strength</span>
                              <strong>{Number(loadMetrics?.marginPct || 0).toFixed(1)}%</strong>
                            </div>
                            <div style={{ height: 8, borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                              <div
                                style={{
                                  width: `${Math.max(0, Math.min(100, Number(loadMetrics?.marginPct || 0) * 3))}%`,
                                  height: '100%',
                                  borderRadius: 999,
                                  background: marginBelowTarget ? 'var(--error)' : 'linear-gradient(90deg, var(--success), var(--accent))',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </section>

                      <MarketIntelligenceModule
                        load={selectedDetail.load}
                        risk={dispatchRisk}
                        marketRate={marketRate}
                        opportunityGap={opportunityGap}
                        laneLabel={`${toLocationLabel(selectedDetail.load.origin) || '—'} → ${toLocationLabel(selectedDetail.load.destination) || '—'}`}
                      />

                      <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 20 }}>
                        <div style={sectionLabelStyle}>CARRIER SCORE</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12 }}>Overall</span>
                          <strong style={{ fontSize: 16 }}>{Number(loadMetrics?.overallScore || 0).toFixed(0)} / 100</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12 }}>Load Health Score</span>
                          <strong style={{ fontSize: 16, color: loadHealthScore >= 80 ? 'var(--success)' : loadHealthScore >= 60 ? 'var(--warning)' : 'var(--error)' }}>{Number(loadHealthScore).toFixed(0)} / 100</strong>
                        </div>
                        <div style={{ display: 'grid', gap: 8, fontSize: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Margin Health</span><span>{Number(loadMetrics?.marginScore || 0).toFixed(0)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Cost Efficiency</span><span>{Number(loadMetrics?.efficiencyScore || 0).toFixed(0)}</span></div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Stop Complexity</span><span>{Number(loadMetrics?.stopComplexity || 0).toFixed(0)}</span></div>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/loads/${encodeURIComponent(selectedDetail.load.id)}/financials`)}
                          style={{
                            border: '1px solid var(--accent-2)',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                            color: 'var(--bg)',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            minHeight: 40,
                            padding: '0 20px',
                            cursor: 'pointer',
                          }}
                        >
                          Open Financials
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/carriers-list')}
                          style={{
                            border: '1px solid var(--border)',
                            background: 'var(--bg-alt)',
                            color: 'var(--text)',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            minHeight: 40,
                            padding: '0 20px',
                            cursor: 'pointer',
                          }}
                        >
                          Go to Carriers
                        </button>
                      </section>

                      <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={sectionLabelStyle}>TEAM CHAT FEED</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setChatChannel('slack')}
                              style={{
                                border: `1px solid ${chatChannel === 'slack' ? 'var(--accent)' : 'var(--border)'}`,
                                background: chatChannel === 'slack' ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent',
                                color: chatChannel === 'slack' ? 'var(--bg)' : 'var(--text-secondary)',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '5px 8px',
                                cursor: 'pointer',
                              }}
                            >
                              Slack
                            </button>
                            <button
                              type="button"
                              onClick={() => setChatChannel('teams')}
                              style={{
                                border: `1px solid ${chatChannel === 'teams' ? 'var(--accent)' : 'var(--border)'}`,
                                background: chatChannel === 'teams' ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent',
                                color: chatChannel === 'teams' ? 'var(--bg)' : 'var(--text-secondary)',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '5px 8px',
                                cursor: 'pointer',
                              }}
                            >
                              Teams
                            </button>
                          </div>
                        </div>

                        <div style={{ maxHeight: 190, overflowY: 'auto', display: 'grid', gap: 8, paddingRight: 2 }}>
                          {visibleChatMessages.map((message) => (
                            <div key={message.id} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: '12px 16px', display: 'grid', gap: 8 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
                                <span>{message.author}</span>
                                <span>{formatDateTime(message.createdAt)}</span>
                              </div>
                              <div style={{ fontSize: 12 }}>{message.text}</div>
                            </div>
                          ))}
                          {visibleChatMessages.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No messages in this channel for this load.</div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gap: 16 }}>
                          <input
                            value={chatDraft}
                            onChange={(event) => setChatDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                sendTeamMessage();
                              }
                            }}
                            placeholder={`Send ${chatChannel === 'slack' ? 'Slack' : 'Teams'} message`}
                            style={{
                              minHeight: 40,
                              borderRadius: 8,
                              border: '1px solid var(--border)',
                              background: 'var(--surface)',
                              color: 'var(--text)',
                              fontSize: 12,
                              padding: '0 16px',
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={sendTeamMessage}
                              style={{
                                border: '1px solid var(--accent-2)',
                                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                                color: 'var(--bg)',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                minHeight: 40,
                                padding: '0 20px',
                                cursor: 'pointer',
                              }}
                            >
                              Send Message
                            </button>
                            <button
                              type="button"
                              onClick={() => setChatDraft(`ETA update for ${activeLoadId}: carrier en route and on schedule.`)}
                              style={{
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-secondary)',
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 700,
                                minHeight: 40,
                                padding: '0 20px',
                                cursor: 'pointer',
                              }}
                            >
                              Add ETA Template
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  </div>

                    <div style={{ display: 'grid', gap: 16 }}>
                      <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 20, display: 'grid', gap: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>AUCTION BOARD</div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{selectedLoad ? `Load ${selectedLoad.id}` : 'Select a load'}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8, fontSize: 12 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={botAddons.autoAssign}
                              onChange={(event) => setBotAddons((prev) => ({ ...prev, autoAssign: event.target.checked }))}
                            />
                            Auto-Assign
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={botAddons.marginGuard}
                              onChange={(event) => setBotAddons((prev) => ({ ...prev, marginGuard: event.target.checked }))}
                            />
                            Margin Guard
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={botAddons.slaAlerts}
                              onChange={(event) => setBotAddons((prev) => ({ ...prev, slaAlerts: event.target.checked }))}
                            />
                            SLA Alerts
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={botAddons.smartAuction}
                              onChange={(event) => setBotAddons((prev) => ({ ...prev, smartAuction: event.target.checked }))}
                            />
                            Smart Auction
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={runBotRecommendCarrier}
                            disabled={!selectedLoad || Boolean(botWorking)}
                            style={{
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              minHeight: 40,
                              padding: '0 20px',
                              cursor: 'pointer',
                            }}
                          >
                            Recommend Carrier
                          </button>
                          <button
                            type="button"
                            onClick={runBotDispatch}
                            disabled={!selectedLoad || Boolean(botWorking) || !botAddons.autoAssign}
                            style={{
                              border: '1px solid var(--accent-2)',
                              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                              color: 'var(--bg)',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              minHeight: 40,
                              padding: '0 20px',
                              cursor: 'pointer',
                            }}
                          >
                            {botWorking === 'dispatch' ? 'Dispatching...' : 'Auto Dispatch'}
                          </button>
                          <button
                            type="button"
                            onClick={runAuctionBot}
                            disabled={!selectedLoad || Boolean(botWorking)}
                            style={{
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--text-secondary)',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              minHeight: 40,
                              padding: '0 20px',
                              cursor: 'pointer',
                            }}
                          >
                            {botWorking === 'auction' ? 'Listing...' : 'Run Auction Bot'}
                          </button>
                        </div>

                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {recommendedCarrier
                            ? `Recommended Carrier: ${recommendedCarrier.name} (${recommendedCarrier.confidence}% fit)`
                            : 'No recommendation yet.'}
                        </div>
                        {botMessage && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{botMessage}</div>}

                        <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 20, display: 'grid', gap: 16 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Auction Activity</div>
                          {selectedBotActivity.map((entry) => (
                            <div key={entry.id} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: '12px 16px', display: 'grid', gap: 8 }}>
                              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{formatDateTime(entry.createdAt)}</div>
                              <div style={{ fontSize: 12 }}>{entry.text}</div>
                            </div>
                          ))}
                          {selectedBotActivity.length === 0 && (
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No auction activity yet for this load.</div>
                          )}
                        </div>
                      </section>
                    </div>

                  <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    Tip: left click selects and previews • right click opens Load Management.
                  </div>
                </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      background: 'linear-gradient(160deg, var(--surface), var(--surface-strong))',
                      padding: 24,
                      display: 'grid',
                      gap: 24,
                      marginTop: 32,
                      marginBottom: 32,
                    }}
                  >
                    <section style={{ border: '1px solid var(--border)', borderRadius: 10, background: 'var(--bg-alt)', padding: 14, fontSize: 13, color: 'var(--text-secondary)' }}>
                      Select a load from the table above to view Load Details.
                    </section>
                  </div>
                </>
              )
            )}
            </>
          )}

          {contextMenu?.load && (
            <div
              role="menu"
              data-load-context-menu="true"
              onClick={(event) => event.stopPropagation()}
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                zIndex: 60,
                width: 260,
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--surface)',
                boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>
                Load {contextMenu.load.id} Shortcuts
              </div>
              {(() => {
                const isDeleted = String(contextMenu.load?.status || '').toLowerCase() === 'deleted' || Boolean(contextMenu.load?.deletedAt);
                return [
                  { label: 'Assign Carrier', key: 'assign', hide: isDeleted },
                  { label: 'Post to Bid Network', key: 'post', hide: isDeleted },
                  { label: 'Duplicate Load', key: 'duplicate' },
                  { label: 'Void Load', key: 'void', hide: isDeleted },
                  { label: 'Archive Load', key: 'delete', hide: isDeleted },
                  { label: 'Restore Load', key: 'restore', hide: !isDeleted },
                  { label: 'Cancel Load', key: 'cancel', hide: isDeleted },
                  { label: 'View in Panel', key: 'view' },
                  { label: 'Open Load in New Tab', key: 'openTab' },
                  {
                    label: 'Go to Load Command Center',
                    key: 'goLoadManagement',
                    onClick: (load) => navigate(`/loadcenter?selected=${encodeURIComponent(load.id)}`),
                  },
                  {
                    label: 'Go to Customer in Load Management',
                    key: 'goCustomer',
                    onClick: (load) => navigate(`/loadcenter?selected=${encodeURIComponent(load.id)}`),
                  },
                  {
                    label: 'Go to Carrier in Load Management',
                    key: 'goCarrier',
                    onClick: (load) => navigate(`/loadcenter?selected=${encodeURIComponent(load.id)}`),
                  },
                  {
                    label: 'Go to Financials in Load Management',
                    key: 'goFinancials',
                    onClick: (load) => navigate(`/loadcenter?selected=${encodeURIComponent(load.id)}`),
                  },
                  {
                    label: 'Open Dispatch Screen',
                    key: 'dispatchScreen',
                    onClick: (load) => navigate(`/loadcenter/dispatch-screen?selected=${encodeURIComponent(load.id)}`),
                  },
                  { label: 'Copy Load ID', key: 'copyId' },
                ]
                  .filter((action) => !action.hide)
                  .map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      onClick={() => {
                        if (typeof action.onClick === 'function') {
                          action.onClick(contextMenu.load);
                        } else if (action.key === 'openTab') {
                          window.open(`/loadcenter?selected=${encodeURIComponent(contextMenu.load.id)}`, '_blank', 'noopener,noreferrer');
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
                        color: 'var(--text)',
                        fontSize: 12,
                        padding: '8px 10px',
                        cursor: 'pointer',
                      }}
                    >
                      {action.label}
                    </button>
                  ));
              })()}
            </div>
          )}
        </section>

        {!isLoadCenter && (
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
        )}
      </div>

      {detailState.loading && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Loading selected load details...</div>}
      {detailState.error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{detailState.error}</div>}
    </div>
  );
}
