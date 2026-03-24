import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  addLoadBotActivity,
  createLoad,
  createLoadTemplate,
  deleteLoad,
  deleteLoadTemplate,
  dispatchLoad,
  getLoadBotActivity,
  listLoads,
  listLoadTemplates,
  sendToBidNetwork,
  updateLoadTemplate,
} from '../api/loadsClient';

export default function LoadBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, settings, setAdvancedSetting } = useTheme();
  const t = theme || {};
  const handledPrefillRef = useRef('');
  const [activeTab, setActiveTab] = useState('available');
  const [query, setQuery] = useState('');
  const [loadsState, setLoadsState] = useState({ loading: true, items: [], error: '' });
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const [savedSearches, setSavedSearches] = useState(() => {
    try {
      const raw = localStorage.getItem('fbpa-loadboard-saved-searches-v1');
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [selectedLoadIds, setSelectedLoadIds] = useState([]);
  const [detailPopover, setDetailPopover] = useState(null);
  const [rowContextMenu, setRowContextMenu] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [availableSort, setAvailableSort] = useState({ key: 'updatedAt', dir: 'desc' });
  const [botWorking, setBotWorking] = useState('');
  const [showViewControls, setShowViewControls] = useState(false);
  const [recommendedCarrier, setRecommendedCarrier] = useState(null);
  const botPanelEnabled = false;
  const [botAddons, setBotAddons] = useState({
    autoAssign: true,
    marginGuard: true,
    slaAlerts: true,
    smartBidBlast: false,
  });
  const [botActivityByLoad, setBotActivityByLoad] = useState({});
  const copyFeedbackTimerRef = useRef(null);

  const fontScale = Number.isFinite(Number(settings?.fontScale)) ? Number(settings.fontScale) : 1;
  const fontWeight = Number.isFinite(Number(settings?.fontWeight)) ? Number(settings.fontWeight) : 600;
  const effectsStrength = Number.isFinite(Number(settings?.effectsStrength)) ? Number(settings.effectsStrength) : 1;

  const interactiveTextStyle = {
    textDecoration: 'underline',
    textUnderlineOffset: 2,
    textDecorationThickness: 1,
    cursor: 'pointer',
  };

  const buildFieldDetails = (load, field) => {
    const origin = load.origin?.city || 'Unknown';
    const originState = load.origin?.state ? `, ${load.origin.state}` : '';
    const destination = load.destination?.city || 'Unknown';
    const destinationState = load.destination?.state ? `, ${load.destination.state}` : '';

    if (field === 'id') {
      return {
        title: `Load ${load.id || 'Unknown'}`,
        lines: [
          `Status: ${String(load.status || 'Unknown').replace('_', ' ')}`,
          `Margin: ${Number(load.marginPct || 0).toFixed(1)}%`,
          `Updated: ${new Date(load.updatedAt || load.createdAt || Date.now()).toLocaleString()}`,
        ],
        copyValue: String(load.id || ''),
      };
    }

    if (field === 'customer') {
      return {
        title: `Customer: ${load.customer?.name || 'Not set'}`,
        lines: [
          `Load: ${load.id || 'Unknown'}`,
          `Carrier: ${load.carrier?.name || 'Unassigned'}`,
          `Lane: ${origin}${originState} to ${destination}${destinationState}`,
        ],
        copyValue: String(load.customer?.name || ''),
      };
    }

    if (field === 'carrier') {
      return {
        title: `Carrier: ${load.carrier?.name || 'Unassigned'}`,
        lines: [
          `Load: ${load.id || 'Unknown'}`,
          `Customer: ${load.customer?.name || 'Not set'}`,
          `Status: ${String(load.status || 'Unknown').replace('_', ' ')}`,
        ],
        copyValue: String(load.carrier?.name || ''),
      };
    }

    if (field === 'lane') {
      return {
        title: `${origin}${originState} to ${destination}${destinationState}`,
        lines: [
          `Load: ${load.id || 'Unknown'}`,
          `Miles: ${Number(load.miles || 0).toLocaleString()}`,
          `Equipment: ${String(load.equipment || 'Not set').toUpperCase()}`,
        ],
        copyValue: `${origin}${originState} -> ${destination}${destinationState}`,
      };
    }

    if (field === 'status') {
      return {
        title: `Status: ${String(load.status || 'Unknown').replace('_', ' ')}`,
        lines: [
          `Load: ${load.id || 'Unknown'}`,
          `Customer: ${load.customer?.name || 'Not set'}`,
          `Margin: ${Number(load.marginPct || 0).toFixed(1)}%`,
        ],
        copyValue: String(load.status || '').replace('_', ' '),
      };
    }

    return {
      title: 'Details',
      lines: [`Load: ${load.id || 'Unknown'}`],
      copyValue: '',
    };
  };

  const copyToClipboard = async (text) => {
    const value = String(text || '').trim();
    if (!value) return;

    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(value);
      setCopyFeedback('Copied to clipboard');
    } catch {
      setCopyFeedback('Clipboard blocked');
    }

    window.clearTimeout(copyFeedbackTimerRef.current);
    copyFeedbackTimerRef.current = window.setTimeout(() => setCopyFeedback(''), 1500);
  };

  useEffect(() => () => window.clearTimeout(copyFeedbackTimerRef.current), []);

  const toggleFieldDetails = (event, load, field) => {
    event.preventDefault();
    event.stopPropagation();

    const details = buildFieldDetails(load, field);
    const key = `${load._rowId}-${field}`;
    const bounds = event.currentTarget.getBoundingClientRect();
    const next = {
      key,
      x: bounds.left,
      y: bounds.bottom + 6,
      load,
      field,
      details,
    };

    setSelectedLoadId(load._rowId);
    setRowContextMenu(null);
    setDetailPopover((current) => (current?.key === key ? null : next));
  };

  const openFieldContextMenu = (event, load, field) => {
    event.preventDefault();
    event.stopPropagation();

    setSelectedLoadId(load._rowId);
    setDetailPopover(null);
    setRowContextMenu({
      x: event.clientX,
      y: event.clientY,
      load,
      field,
      details: buildFieldDetails(load, field),
    });
  };

  useEffect(() => {
    if (!detailPopover && !rowContextMenu) return undefined;

    const closeOverlays = (event) => {
      if (event?.target?.closest?.('[data-loadboard-overlay="true"]')) return;
      if (event?.target?.closest?.('[data-loadboard-trigger="true"]')) return;
      setDetailPopover(null);
      setRowContextMenu(null);
    };

    const closeOnScroll = () => {
      setDetailPopover(null);
      setRowContextMenu(null);
    };

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setDetailPopover(null);
        setRowContextMenu(null);
      }
    };

    document.addEventListener('mousedown', closeOverlays);
    window.addEventListener('scroll', closeOnScroll, true);
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('mousedown', closeOverlays);
      window.removeEventListener('scroll', closeOnScroll, true);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [detailPopover, rowContextMenu]);

  const tabToApiTab = (tab) => {
    if (tab === 'posted') return 'my';
    if (tab === 'available') return 'all';
    return 'all';
  };

  const parseLocationValue = (value) => {
    const text = String(value || '').trim();
    if (!text) return { city: 'Not set', state: '' };

    const cityPart = text.split(',')[0]?.trim() || 'Not set';
    const stateMatch = text.toUpperCase().match(/,\s*([A-Z]{2})\b/);
    return {
      city: cityPart,
      state: stateMatch?.[1] || '',
    };
  };

  const loadBoardData = async (tab = activeTab, q = query) => {
    setLoadsState((previous) => ({ ...previous, loading: true, error: '' }));
    const result = await listLoads({ tab: tabToApiTab(tab), q, page: 1, pageSize: 50, sort: '-updatedAt' });
    if (result?.error) {
      setLoadsState({ loading: false, items: [], error: result.error });
      return;
    }

    const items = Array.isArray(result?.items) ? result.items : [];
    setLoadsState({ loading: false, items, error: '' });
  };

  const loadTemplates = async () => {
    const result = await listLoadTemplates();
    if (result?.error) return;
    const items = Array.isArray(result?.items) ? result.items : [];
    setTemplates(items);
    setSelectedTemplateId((current) => (current && items.some((template) => template.id === current)
      ? current
      : (items[0]?.id || '')));
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    if (activeTab === 'saved') return;
    loadBoardData(activeTab, query);
  }, [activeTab]);

  useEffect(() => {
    const incoming = location.state?.prefillLoad;
    const shouldAutoCreate = Boolean(location.state?.autoCreate);
    if (!incoming || !shouldAutoCreate) return;

    const prefillKey = `${incoming.createdAt || ''}-${incoming.source || ''}-${incoming.origin || ''}-${incoming.destination || ''}`;
    if (!prefillKey || handledPrefillRef.current === prefillKey) return;
    handledPrefillRef.current = prefillKey;

    const createFromPrefill = async () => {
      setWorking('create-rate-logic-load');
      setMessage('');

      const result = await createLoad({
        customerName: String(incoming.customerName || 'Rate Logic Quote'),
        equipment: String(incoming.equipment || 'van'),
        miles: Math.max(1, Number(incoming.miles || 0)),
        revenue: Math.max(0, Number(incoming.revenue || 0)),
        carrierCost: Math.max(0, Number(incoming.carrierCost || 0)),
        origin: parseLocationValue(incoming.origin),
        destination: parseLocationValue(incoming.destination),
      });

      setWorking('');

      if (result?.error || !result?.load?.id) {
        setMessage(result?.error || 'Could not create load from Rate Logic quote.');
        return;
      }

      setActiveTab('available');
      setSelectedLoadId(result.load.id);
      setMessage(`Rate Logic quote converted to load ${result.load.id}.`);
      await loadBoardData('available', '');
    };

    createFromPrefill();
  }, [location.state]);

  const visibleLoads = useMemo(() => {
    if (activeTab === 'saved') return [];
    return (Array.isArray(loadsState.items) ? loadsState.items : []).map((row, index) => ({
      ...row,
      _rowId: String(row?.id ?? `row-${index}`),
      _rowKey: `${String(row?.id ?? `row-${index}`)}-${index}`,
    }));
  }, [activeTab, loadsState.items]);

  const selectedLoad = useMemo(
    () => visibleLoads.find((row) => row._rowId === selectedLoadId) || visibleLoads[0] || null,
    [visibleLoads, selectedLoadId]
  );

  const sortedAvailableLoads = useMemo(() => {
    const rows = [...visibleLoads];
    const factor = availableSort.dir === 'asc' ? 1 : -1;
    rows.sort((left, right) => {
      const getValue = (load, key) => {
        if (key === 'id') return String(load.id || '');
        if (key === 'customer') return String(load.customer?.name || '');
        if (key === 'carrier') return String(load.carrier?.name || '');
        if (key === 'lane') return `${load.origin?.city || ''} ${load.destination?.city || ''}`;
        if (key === 'marginPct') return Number(load.marginPct || 0);
        if (key === 'status') return String(load.status || '');
        if (key === 'updatedAt') return new Date(load.updatedAt || load.createdAt || 0).getTime();
        return '';
      };

      const leftValue = getValue(left, availableSort.key);
      const rightValue = getValue(right, availableSort.key);

      if (typeof leftValue === 'number' || typeof rightValue === 'number') {
        return (Number(leftValue || 0) - Number(rightValue || 0)) * factor;
      }

      return String(leftValue).localeCompare(String(rightValue)) * factor;
    });
    return rows;
  }, [availableSort.dir, availableSort.key, visibleLoads]);

  const allVisibleSelected = sortedAvailableLoads.length > 0 && sortedAvailableLoads.every((row) => selectedLoadIds.includes(row._rowId));

  const toggleAvailableSort = (key) => {
    setAvailableSort((current) => {
      if (current.key === key) {
        return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const toggleLoadRowSelection = (rowId, checked) => {
    setSelectedLoadIds((previous) => {
      if (checked) {
        if (previous.includes(rowId)) return previous;
        return [...previous, rowId];
      }
      return previous.filter((entry) => entry !== rowId);
    });
  };

  const toggleSelectAllAvailable = (checked) => {
    if (!checked) {
      setSelectedLoadIds([]);
      return;
    }
    setSelectedLoadIds(sortedAvailableLoads.map((row) => row._rowId));
  };

  useEffect(() => {
    if (!visibleLoads.length) {
      setSelectedLoadId('');
      return;
    }
    setSelectedLoadId((current) => (current && visibleLoads.some((row) => row._rowId === current) ? current : visibleLoads[0]._rowId));
  }, [visibleLoads]);

  useEffect(() => {
    setSelectedLoadIds((previous) => previous.filter((rowId) => visibleLoads.some((row) => row._rowId === rowId)));
  }, [visibleLoads]);

  const runCreateNewLoad = async () => {
    navigate('/loads/new/load-basics');
  };

  const runUseTemplate = async () => {
    if (!selectedTemplateId) {
      setMessage('Select a template first.');
      return;
    }

    navigate(`/loads/new/load-basics?templateId=${encodeURIComponent(selectedTemplateId)}`);
  };

  const runUseTemplateById = async (templateId) => {
    if (!templateId) return;
    setSelectedTemplateId(templateId);
    setWorking(`template-load-${templateId}`);
    setMessage('');
    const result = await createLoad({ templateId });
    setWorking('');

    if (result?.error || !result?.load?.id) {
      setMessage(result?.error || 'Could not create load from template.');
      return;
    }

    setMessage(`Template load ${result.load.id} created.`);
    navigate(`/loads/${encodeURIComponent(result.load.id)}/load-basics`);
  };

  const runEditTemplate = async (template) => {
    const name = window.prompt('Template name', template.name);
    if (!name || !name.trim()) return;

    const customer = window.prompt('Customer name', template.customer || 'Not set') || 'Not set';
    const picks = Number.parseInt(window.prompt('Number of picks', String(template.picks ?? 0)) || String(template.picks ?? 0), 10);
    const drops = Number.parseInt(window.prompt('Number of drops', String(template.drops ?? 0)) || String(template.drops ?? 0), 10);

    setWorking(`edit-template-${template.id}`);
    setMessage('');
    const result = await updateLoadTemplate(template.id, {
      name: name.trim(),
      customer,
      picks: Number.isFinite(picks) ? picks : Number(template.picks || 0),
      drops: Number.isFinite(drops) ? drops : Number(template.drops || 0),
      branch: template.branch || 'Shared',
      defaults: template.defaults || {},
    });
    setWorking('');

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    setMessage(`Template ${name.trim()} updated.`);
    await loadTemplates();
  };

  const runDeleteTemplate = async (template) => {
    const confirmed = window.confirm(`Delete template "${template.name}"?`);
    if (!confirmed) return;

    setWorking(`delete-template-${template.id}`);
    setMessage('');
    const result = await deleteLoadTemplate(template.id);
    setWorking('');

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    setMessage(`Template ${template.name} deleted.`);
    await loadTemplates();
  };

  const runCreateTemplate = async () => {
    const name = window.prompt('Template name');
    if (!name || !name.trim()) return;

    const customer = window.prompt('Customer name (optional)', 'Not set') || 'Not set';
    const picks = Number.parseInt(window.prompt('Number of picks', '1') || '1', 10);
    const drops = Number.parseInt(window.prompt('Number of drops', '1') || '1', 10);

    setWorking('create-template');
    setMessage('');
    const result = await createLoadTemplate({
      name: name.trim(),
      customer,
      picks: Number.isFinite(picks) ? picks : 1,
      drops: Number.isFinite(drops) ? drops : 1,
      branch: 'Shared',
    });
    setWorking('');

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    setMessage(`Template ${name.trim()} created.`);
    await loadTemplates();
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

  const appendBotActivity = async (loadId, text) => {
    if (!loadId || !text) return;
    const result = await addLoadBotActivity(loadId, { text, source: 'dispatch-bot-addon' });
    if (result?.item) {
      appendBotActivityLocal(result.item);
      return;
    }

    appendBotActivityLocal({
      id: `${loadId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      loadId,
      text,
      createdAt: new Date().toISOString(),
      source: 'dispatch-bot-addon-fallback',
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
      setMessage('Select a load first for Dispatch Bot recommendations.');
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
    setMessage(`Dispatch Bot recommended ${baseline.name} (${confidence}% fit).`);
    appendBotActivity(selectedLoad.id, `Recommended ${baseline.name} with ${confidence}% fit score.`);
  };

  const runBotDispatch = async () => {
    if (!selectedLoad) {
      setMessage('Select a load first.');
      return;
    }

    const carrier = recommendedCarrier || { id: 'CR-BOT-01', name: 'Prime Logistics AI Pool' };
    setBotWorking('dispatch');
    setMessage('');

    const result = await dispatchLoad(selectedLoad.id, {
      carrierId: carrier.id,
      carrierName: carrier.name,
      source: 'dispatch-bot-addon',
      marginGuard: botAddons.marginGuard,
      slaAlerts: botAddons.slaAlerts,
    });

    setBotWorking('');

    if (result?.error) {
      setMessage(result.error);
      appendBotActivity(selectedLoad.id, `Auto Dispatch failed: ${result.error}`);
      return;
    }

    setMessage(`Dispatch Bot assigned ${carrier.name} to ${selectedLoad.id}.`);
    appendBotActivity(selectedLoad.id, `Auto-dispatched to ${carrier.name}.`);
    await loadBoardData(activeTab === 'saved' ? 'available' : activeTab, query);
  };

  const runBotBidBlast = async () => {
    if (!selectedLoad) {
      setMessage('Select a load first.');
      return;
    }

    setBotWorking('bid-blast');
    setMessage('');
    const result = await sendToBidNetwork(selectedLoad.id, {
      network: botAddons.smartBidBlast ? 'smart-bid-bot' : 'internal-bid-network',
      source: 'dispatch-bot-addon',
    });
    setBotWorking('');

    if (result?.error) {
      setMessage(result.error);
      appendBotActivity(selectedLoad.id, `Bid network push failed: ${result.error}`);
      return;
    }

    setMessage(`Dispatch Bot pushed ${selectedLoad.id} to bid network (${result.requestId || 'queued'}).`);
    appendBotActivity(selectedLoad.id, `Pushed to bid network (${result.requestId || 'queued'}).`);
  };

  const selectedBotActivity = useMemo(() => {
    if (!botPanelEnabled) return [];
    if (!selectedLoad?.id) return [];
    return botActivityByLoad[selectedLoad.id] || [];
  }, [botActivityByLoad, botPanelEnabled, selectedLoad?.id]);

  useEffect(() => {
    if (!botPanelEnabled) return;
    if (!selectedLoad?.id) return;
    hydrateBotActivity(selectedLoad.id);
  }, [botPanelEnabled, selectedLoad?.id]);

  const saveCurrentSearch = () => {
    const normalized = query.trim();
    if (!normalized) {
      setMessage('Enter a search query before saving.');
      return;
    }

    const next = [
      {
        id: `search-${Date.now()}`,
        label: normalized,
        createdAt: new Date().toISOString(),
      },
      ...savedSearches,
    ].slice(0, 12);

    setSavedSearches(next);
    try {
      localStorage.setItem('fbpa-loadboard-saved-searches-v1', JSON.stringify(next));
    } catch {
      // no-op in restricted environments
    }
    setMessage(`Saved search: ${normalized}`);
  };

  const applySavedSearch = async (item) => {
    setActiveTab('available');
    setQuery(item.label);
    await loadBoardData('available', item.label);
  };

  const removeSavedSearch = (searchId) => {
    const next = savedSearches.filter((row) => row.id !== searchId);
    setSavedSearches(next);
    try {
      localStorage.setItem('fbpa-loadboard-saved-searches-v1', JSON.stringify(next));
    } catch {
      // no-op in restricted environments
    }
  };

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
    position: 'relative',
  };

  const headerStyle = {
    marginBottom: 24,
    minHeight: 52,
    padding: '0 4px',
    borderBottom: `1px solid ${t.border}`,
    background: t.bgAlt,
  };

  const titleStyle = {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 8,
  };

  const subtitleStyle = {
    fontSize: 14,
    color: t.textSecondary,
  };

  const tabsStyle = {
    display: 'flex',
    gap: 0,
    borderBottom: `1px solid ${t.border}`,
    marginBottom: 24,
  };

  const tabStyle = (isActive) => ({
    padding: '12px 20px',
    fontSize: 13,
    fontWeight: isActive ? 600 : 500,
    color: isActive ? t.accent : t.textSecondary,
    borderBottom: `2px solid ${isActive ? t.accent : 'transparent'}`,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const contentStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 24,
    minHeight: 400,
  };

  const primaryBtn = {
    border: `1px solid ${t.accent2}`,
    background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
    color: t.bg,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  const ghostBtn = {
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  return (
    <div style={containerStyle}>
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
            width: 30,
            height: 30,
            borderRadius: 999,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: '30px',
            textAlign: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
          }}
        >
          ⚙
        </button>

        {showViewControls && (
          <div
            style={{
              width: 180,
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.surface,
              color: t.text,
              padding: 8,
              display: 'grid',
              gap: 8,
              boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
            }}
          >
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: t.textSecondary }}>
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

      <div style={headerStyle}>
        <div style={titleStyle}>🚛 Load Board</div>
        <div style={subtitleStyle}>Discover, post, and manage loads in real-time</div>
        {message && <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>{message}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(300px,420px)', gap: 12, marginBottom: 12 }}>
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12, background: t.bgAlt, display: 'grid', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <strong style={{ fontSize: 13 }}>Load Actions</strong>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" style={primaryBtn} onClick={runCreateNewLoad} disabled={Boolean(working)}>
                {working === 'create-load' ? 'Creating...' : '+ New Shipment'}
              </button>
              <button type="button" style={ghostBtn} onClick={() => navigate('/load-board/new-shipment')}>
                Manage Templates
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 8 }}>
            <select
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
              style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '7px 10px', fontSize: 12 }}
            >
              {templates.length === 0 && <option value="">No templates available</option>}
              {templates.map((template) => (
                <option key={template.id} value={template.id}>{template.name}</option>
              ))}
            </select>
            <button type="button" style={primaryBtn} onClick={runUseTemplate} disabled={Boolean(working) || !selectedTemplateId}>
              {working === 'template-load' ? 'Creating...' : 'Use Template'}
            </button>
          </div>
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12, background: t.bgAlt, display: 'grid', gap: 10 }}>
          <strong style={{ fontSize: 13 }}>Search</strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 8 }}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by load, customer, carrier, city"
              style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '7px 10px', fontSize: 12 }}
            />
            <button type="button" style={ghostBtn} onClick={() => loadBoardData(activeTab === 'saved' ? 'available' : activeTab, query)}>
              Run
            </button>
            <button type="button" style={ghostBtn} onClick={saveCurrentSearch}>Save</button>
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, padding: 12, background: t.bgAlt, marginBottom: 12, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 13 }}>Internal Route Engine Preview</strong>
          <span style={{ fontSize: 11, color: t.textSecondary }}>Single lane preview</span>
        </div>
        {selectedLoad ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface, padding: 8 }}>
                <div style={{ fontSize: 11, color: t.textSecondary }}>Origin</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{selectedLoad.origin?.city || '—'}{selectedLoad.origin?.state ? `, ${selectedLoad.origin.state}` : ''}</div>
              </div>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface, padding: 8 }}>
                <div style={{ fontSize: 11, color: t.textSecondary }}>Destination</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{selectedLoad.destination?.city || '—'}{selectedLoad.destination?.state ? `, ${selectedLoad.destination.state}` : ''}</div>
              </div>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface, padding: 8 }}>
                <div style={{ fontSize: 11, color: t.textSecondary }}>Estimated Miles</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{Number(selectedLoad.miles || 0).toLocaleString()}</div>
              </div>
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface, padding: 8 }}>
                <div style={{ fontSize: 11, color: t.textSecondary }}>Engine Status</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.success }}>Ready</div>
              </div>
            </div>
            <div style={{ fontSize: 11, color: t.textSecondary }}>
              Showing one internal route preview for the selected load ({selectedLoad.id}).
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: t.textSecondary }}>Select a load to preview the lane route.</div>
        )}
      </div>

      {botPanelEnabled && (
      <>
      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 13 }}>Load Templates</strong>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: t.textSecondary }}>{templates.length} templates</span>
            <button type="button" style={ghostBtn} onClick={runCreateTemplate} disabled={Boolean(working)}>
              {working === 'create-template' ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ color: t.textSecondary, background: t.surface }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Template Name</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Customer</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Picks</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Drops</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Branch</th>
              <th style={{ padding: 8, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr key={template.id} style={{ background: selectedTemplateId === template.id ? 'rgba(var(--glow), 0.12)' : 'transparent' }}>
                <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{template.name}</td>
                <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{template.customer || 'Not set'}</td>
                <td style={{ padding: 8, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>{template.picks ?? 0}</td>
                <td style={{ padding: 8, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>{template.drops ?? 0}</td>
                <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{template.branch || 'Shared'}</td>
                <td style={{ padding: 8, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      style={ghostBtn}
                      onClick={() => runUseTemplateById(template.id)}
                      disabled={Boolean(working)}
                    >
                      {working === `template-load-${template.id}` ? 'Using...' : 'Use'}
                    </button>
                    <button
                      type="button"
                      style={ghostBtn}
                      onClick={() => runEditTemplate(template)}
                      disabled={Boolean(working)}
                    >
                      {working === `edit-template-${template.id}` ? 'Saving...' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      style={{ ...ghostBtn, borderColor: t.error, color: t.error }}
                      onClick={() => runDeleteTemplate(template)}
                      disabled={Boolean(working)}
                    >
                      {working === `delete-template-${template.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 12, borderTop: `1px solid ${t.border}`, textAlign: 'center', color: t.textSecondary }}>
                  No templates available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 13 }}>Dispatch Bot Add-ons</strong>
          <span style={{ fontSize: 12, color: t.textSecondary }}>{selectedLoad ? `Target: ${selectedLoad.id}` : 'Select a load below'}</span>
        </div>
        <div style={{ padding: 12, display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={botAddons.autoAssign}
                onChange={(event) => setBotAddons((prev) => ({ ...prev, autoAssign: event.target.checked }))}
              />
              Auto-Assign
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={botAddons.marginGuard}
                onChange={(event) => setBotAddons((prev) => ({ ...prev, marginGuard: event.target.checked }))}
              />
              Margin Guard
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={botAddons.slaAlerts}
                onChange={(event) => setBotAddons((prev) => ({ ...prev, slaAlerts: event.target.checked }))}
              />
              SLA Alerts
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={botAddons.smartBidBlast}
                onChange={(event) => setBotAddons((prev) => ({ ...prev, smartBidBlast: event.target.checked }))}
              />
              Smart Bid Blast
            </label>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={ghostBtn} onClick={runBotRecommendCarrier} disabled={!selectedLoad || Boolean(botWorking)}>
              Recommend Carrier
            </button>
            <button
              type="button"
              style={primaryBtn}
              onClick={runBotDispatch}
              disabled={!selectedLoad || Boolean(botWorking) || !botAddons.autoAssign}
            >
              {botWorking === 'dispatch' ? 'Dispatching...' : 'Auto Dispatch'}
            </button>
            <button type="button" style={ghostBtn} onClick={runBotBidBlast} disabled={!selectedLoad || Boolean(botWorking)}>
              {botWorking === 'bid-blast' ? 'Sending...' : 'Push to Bid Network'}
            </button>
          </div>

          <div style={{ fontSize: 12, color: t.textSecondary }}>
            {recommendedCarrier
              ? `Recommended Carrier: ${recommendedCarrier.name} (${recommendedCarrier.confidence}% fit)`
              : 'No recommendation yet. Use Recommend Carrier to generate one.'}
          </div>

          <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10, display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>Bot Activity Log</div>
            {selectedBotActivity.map((entry) => (
              <div key={entry.id} style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.surface, padding: 8, display: 'grid', gap: 2 }}>
                <div style={{ fontSize: 11, color: t.textSecondary }}>{new Date(entry.createdAt).toLocaleString()}</div>
                <div style={{ fontSize: 12 }}>{entry.text}</div>
              </div>
            ))}
            {selectedBotActivity.length === 0 && (
              <div style={{ fontSize: 12, color: t.textSecondary }}>No bot actions recorded for this load yet.</div>
            )}
          </div>
        </div>
      </div>
      </>
      )}

      <div style={tabsStyle}>
        <button
          onClick={() => setActiveTab('available')}
          style={tabStyle(activeTab === 'available')}
        >
          Available Loads
        </button>
        <button
          onClick={() => setActiveTab('posted')}
          style={tabStyle(activeTab === 'posted')}
        >
          My Posted Loads
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          style={tabStyle(activeTab === 'saved')}
        >
          Saved Searches
        </button>
      </div>

      <div style={contentStyle}>
        {activeTab === 'available' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {/* Text size control for table/excel elements */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 2 }}>
              <div style={{ fontSize: 12, color: t.textSecondary }}>{sortedAvailableLoads.length} rows</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>
                Underlined values are clickable. Click to toggle details, right-click for menu, and scroll to dismiss.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: t.textSecondary }}>Text size</span>
                <input
                  type="range"
                  min="90"
                  max="120"
                  step="5"
                  value={Math.round(fontScale * 100)}
                  onChange={e => setAdvancedSetting('fontScale', Number(e.target.value) / 100)}
                  style={{ verticalAlign: 'middle' }}
                  aria-label="Table text size"
                />
                <span style={{ fontSize: 11, color: t.textSecondary, minWidth: 28, textAlign: 'right' }}>{Math.round(fontScale * 100)}%</span>
              </div>
              <button
                type="button"
                style={{ ...ghostBtn, fontSize: 11, padding: '5px 9px', marginLeft: 'auto' }}
                disabled={!selectedLoadIds.length}
                onClick={() => {
                  const first = sortedAvailableLoads.find((row) => selectedLoadIds.includes(row._rowId));
                  if (first?.id) navigate(`/loads/${encodeURIComponent(first.id)}/load-basics`);
                }}
              >
                Open Selected ({selectedLoadIds.length})
              </button>
            </div>
            {loadsState.loading && <div style={{ color: t.textSecondary, fontSize: 13 }}>Loading loads...</div>}
            {loadsState.error && <div style={{ color: t.error, fontSize: 13 }}>{loadsState.error}</div>}
            {!loadsState.loading && !loadsState.error && (
              <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem', lineHeight: 1.15 }}>
                  <thead>
                    <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                      <th style={{ padding: '3px 5px', textAlign: 'center', width: 26 }}>
                        <input type="checkbox" checked={allVisibleSelected} onChange={(event) => toggleSelectAllAvailable(event.target.checked)} aria-label="Select all visible loads" />
                      </th>
                      <th style={{ padding: '3px 5px', textAlign: 'left', cursor: 'pointer' }} onClick={() => toggleAvailableSort('id')}>Load</th>
                      <th style={{ padding: '3px 5px', textAlign: 'left', cursor: 'pointer' }} onClick={() => toggleAvailableSort('customer')}>Customer</th>
                      <th style={{ padding: '3px 5px', textAlign: 'left', cursor: 'pointer' }} onClick={() => toggleAvailableSort('carrier')}>Carrier</th>
                      <th style={{ padding: '3px 5px', textAlign: 'left', cursor: 'pointer' }} onClick={() => toggleAvailableSort('lane')}>Lane</th>
                      <th style={{ padding: '3px 5px', textAlign: 'right', cursor: 'pointer' }} onClick={() => toggleAvailableSort('marginPct')}>Margin</th>
                      <th style={{ padding: '3px 5px', textAlign: 'left', cursor: 'pointer' }} onClick={() => toggleAvailableSort('status')}>Status</th>
                      <th style={{ padding: '3px 5px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedAvailableLoads.map((load) => (
                      <tr
                        key={load._rowKey}
                        tabIndex={0}
                        onClick={() => setSelectedLoadId(load._rowId)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`);
                          } else if (event.key === ' ') {
                            event.preventDefault();
                            toggleLoadRowSelection(load._rowId, !selectedLoadIds.includes(load._rowId));
                          }
                        }}
                        style={{ background: selectedLoadId === load._rowId ? 'rgba(var(--glow), 0.12)' : 'transparent', cursor: 'pointer', userSelect: 'none' }}
                      >
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}`, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={selectedLoadIds.includes(load._rowId)}
                            onChange={(event) => toggleLoadRowSelection(load._rowId, event.target.checked)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Select ${load.id}`}
                          />
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}` }}>
                          <span
                            data-loadboard-trigger="true"
                            role="button"
                            tabIndex={0}
                            style={interactiveTextStyle}
                            onClick={(event) => toggleFieldDetails(event, load, 'id')}
                            onContextMenu={(event) => openFieldContextMenu(event, load, 'id')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                toggleFieldDetails(event, load, 'id');
                              }
                            }}
                            title="Click for details, right-click for actions"
                          >
                            {load.id}
                          </span>
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}` }}>
                          <span
                            data-loadboard-trigger="true"
                            role="button"
                            tabIndex={0}
                            style={interactiveTextStyle}
                            onClick={(event) => toggleFieldDetails(event, load, 'customer')}
                            onContextMenu={(event) => openFieldContextMenu(event, load, 'customer')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                toggleFieldDetails(event, load, 'customer');
                              }
                            }}
                            title="Click for details, right-click for actions"
                          >
                            {load.customer?.name || '—'}
                          </span>
                          {load.customer?.id && (
                            <div><a href={`/customers/${encodeURIComponent(load.customer.id)}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 10, textDecoration: 'underline' }} title="Open customer profile">{load.customer.id}</a></div>
                          )}
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}` }}>
                          <span
                            data-loadboard-trigger="true"
                            role="button"
                            tabIndex={0}
                            style={interactiveTextStyle}
                            onClick={(event) => toggleFieldDetails(event, load, 'carrier')}
                            onContextMenu={(event) => openFieldContextMenu(event, load, 'carrier')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                toggleFieldDetails(event, load, 'carrier');
                              }
                            }}
                            title="Click for details, right-click for actions"
                          >
                            {load.carrier?.name || '—'}
                          </span>
                          {(load.carrier?.id || load.carrier?.name) && load.carrier?.name !== '—' && (
                            <div><a href={`/carriers/profile/${encodeURIComponent(load.carrier.id || load.carrier.name)}`} onClick={(e) => e.stopPropagation()} style={{ color: 'var(--accent)', fontSize: 10, textDecoration: 'underline' }} title="Open carrier profile">{load.carrier.id || 'Profile'}</a></div>
                          )}
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}` }}>
                          <span
                            data-loadboard-trigger="true"
                            role="button"
                            tabIndex={0}
                            style={interactiveTextStyle}
                            onClick={(event) => toggleFieldDetails(event, load, 'lane')}
                            onContextMenu={(event) => openFieldContextMenu(event, load, 'lane')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                toggleFieldDetails(event, load, 'lane');
                              }
                            }}
                            title="Click for details, right-click for actions"
                          >
                            {(load.origin?.city || '—')}
                            {' -> '}
                            {(load.destination?.city || '—')}
                          </span>
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>
                          {Number(load.marginPct || 0).toFixed(1)}%
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}` }}>
                          <span
                            data-loadboard-trigger="true"
                            role="button"
                            tabIndex={0}
                            style={interactiveTextStyle}
                            onClick={(event) => toggleFieldDetails(event, load, 'status')}
                            onContextMenu={(event) => openFieldContextMenu(event, load, 'status')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                toggleFieldDetails(event, load, 'status');
                              }
                            }}
                            title="Click for details, right-click for actions"
                          >
                            {String(load.status || '').replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '3px 5px', borderTop: `1px solid ${t.border}`, textAlign: 'right', display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            style={{ ...ghostBtn, fontSize: 9, padding: '2px 6px', borderRadius: 5 }}
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`);
                            }}
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            style={{ ...ghostBtn, fontSize: 9, padding: '2px 6px', borderRadius: 5, color: '#c0392b', borderColor: '#c0392b' }}
                            disabled={working === `delete-load-${load.id}`}
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (!window.confirm(`Delete load ${load.id}?`)) return;
                              setWorking(`delete-load-${load.id}`);
                              setMessage('');
                              const result = await deleteLoad(load.id);
                              setWorking('');
                              if (result?.error) { setMessage(result.error); return; }
                              setMessage(`Load ${load.id} deleted.`);
                              await loadBoardData(activeTab, query);
                            }}
                          >
                            {working === `delete-load-${load.id}` ? '...' : 'Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedAvailableLoads.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: 12, textAlign: 'center', color: t.textSecondary, borderTop: `1px solid ${t.border}` }}>
                          No loads found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'posted' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {loadsState.loading && <div style={{ color: t.textSecondary, fontSize: 13 }}>Loading posted loads...</div>}
            {loadsState.error && <div style={{ color: t.error, fontSize: 13 }}>{loadsState.error}</div>}
            {!loadsState.loading && !loadsState.error && (
              <div style={{ display: 'grid', gap: 8 }}>
                {visibleLoads.map((load) => (
                  <div
                    key={load.id}
                    style={{
                      border: `1px solid ${t.border}`,
                      borderRadius: 10,
                      background: t.bgAlt,
                      padding: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                      <strong>{load.id}</strong>
                      <span style={{ color: t.textSecondary }}>{load.customer?.name || '—'} • {load.origin?.city || '—'} → {load.destination?.city || '—'}</span>
                      <span style={{ color: t.textSecondary }}>Status: {String(load.status || '').replace('_', ' ')} • Margin: {Number(load.marginPct || 0).toFixed(1)}%</span>
                    </div>
                    <button type="button" style={ghostBtn} onClick={() => navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`)}>
                      Manage
                    </button>
                  </div>
                ))}
                {visibleLoads.length === 0 && <div style={{ color: t.textSecondary, fontSize: 13 }}>No posted loads found.</div>}
              </div>
            )}
          </div>
        )}
        {activeTab === 'saved' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {savedSearches.map((item) => (
              <div
                key={item.id}
                style={{
                  border: `1px solid ${t.border}`,
                  borderRadius: 10,
                  background: t.bgAlt,
                  padding: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'grid', gap: 2, fontSize: 12 }}>
                  <strong>{item.label}</strong>
                  <span style={{ color: t.textSecondary }}>{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" style={ghostBtn} onClick={() => applySavedSearch(item)}>Run</button>
                  <button type="button" style={ghostBtn} onClick={() => removeSavedSearch(item.id)}>Delete</button>
                </div>
              </div>
            ))}
            {savedSearches.length === 0 && (
              <div style={{ color: t.textSecondary, fontSize: 13 }}>No saved searches yet. Run a search and click Save.</div>
            )}
          </div>
        )}
      </div>

      {copyFeedback && (
        <div
          data-loadboard-overlay="true"
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            zIndex: 1100,
            border: `1px solid ${t.border}`,
            background: t.surface,
            color: t.text,
            borderRadius: 8,
            padding: '8px 10px',
            fontSize: 12,
            boxShadow: '0 8px 22px rgba(0,0,0,0.22)',
          }}
        >
          {copyFeedback}
        </div>
      )}

      {detailPopover && (
        <div
          data-loadboard-overlay="true"
          style={{
            position: 'fixed',
            left: detailPopover.x,
            top: detailPopover.y,
            zIndex: 1050,
            width: 280,
            maxWidth: 'calc(100vw - 16px)',
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            background: t.surface,
            color: t.text,
            boxShadow: '0 12px 30px rgba(0,0,0,0.24)',
            padding: 10,
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <strong style={{ fontSize: 12 }}>{detailPopover.details.title}</strong>
            <div style={{ display: 'flex', gap: 6 }}>
              {detailPopover.details.copyValue && (
                <button
                  type="button"
                  style={{ ...ghostBtn, fontSize: 10, padding: '4px 6px' }}
                  onClick={() => copyToClipboard(detailPopover.details.copyValue)}
                >
                  Clipboard
                </button>
              )}
              <button
                type="button"
                style={{ ...ghostBtn, fontSize: 10, padding: '4px 6px' }}
                onClick={() => setDetailPopover(null)}
              >
                Close
              </button>
            </div>
          </div>
          {detailPopover.details.lines.map((line) => (
            <div key={line} style={{ fontSize: 11, color: t.textSecondary }}>{line}</div>
          ))}
          <div style={{ fontSize: 10, color: t.textSecondary }}>Click the underlined text again or scroll away to hide.</div>
        </div>
      )}

      {rowContextMenu && (
        <div
          data-loadboard-overlay="true"
          style={{
            position: 'fixed',
            left: rowContextMenu.x,
            top: rowContextMenu.y,
            zIndex: 1060,
            width: 220,
            border: `1px solid ${t.border}`,
            borderRadius: 10,
            background: t.surface,
            color: t.text,
            boxShadow: '0 12px 28px rgba(0,0,0,0.25)',
            padding: 6,
            display: 'grid',
            gap: 4,
          }}
        >
          <div style={{ fontSize: 11, color: t.textSecondary, padding: '4px 6px', borderBottom: `1px solid ${t.border}` }}>
            {rowContextMenu.details.title}
          </div>
          <button
            type="button"
            style={{ ...ghostBtn, textAlign: 'left', fontSize: 11, padding: '6px 8px' }}
            onClick={() => {
              setDetailPopover({
                key: `${rowContextMenu.load._rowId}-${rowContextMenu.field}`,
                x: rowContextMenu.x,
                y: rowContextMenu.y + 8,
                load: rowContextMenu.load,
                field: rowContextMenu.field,
                details: rowContextMenu.details,
              });
              setRowContextMenu(null);
            }}
          >
            Toggle Details
          </button>
          <button
            type="button"
            style={{ ...ghostBtn, textAlign: 'left', fontSize: 11, padding: '6px 8px' }}
            onClick={() => {
              copyToClipboard(rowContextMenu.details.copyValue || rowContextMenu.load.id);
              setRowContextMenu(null);
            }}
          >
            Copy Value
          </button>
          <button
            type="button"
            style={{ ...ghostBtn, textAlign: 'left', fontSize: 11, padding: '6px 8px' }}
            onClick={() => {
              navigate(`/loads/${encodeURIComponent(rowContextMenu.load.id)}/load-basics`);
              setRowContextMenu(null);
            }}
          >
            Open Load
          </button>
          <button
            type="button"
            style={{ ...ghostBtn, textAlign: 'left', fontSize: 11, padding: '6px 8px' }}
            onClick={() => setRowContextMenu(null)}
          >
            Close Menu
          </button>
        </div>
      )}
    </div>
  );
}
