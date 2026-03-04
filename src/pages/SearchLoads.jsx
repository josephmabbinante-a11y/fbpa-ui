import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLoad, deleteLoad, dispatchLoad, listLoads, restoreLoad, sendToBidNetwork, updateLoad, voidLoad } from '../api/loadsClient';
import { useTheme } from '../contexts/ThemeContext';
import { formatLoadStatusLabel, normalizeLoadStatus } from '../utils/loadLifecycle';

const DEFAULT_CRITERIA = {
  searchTerm: '',
  originState: '',
  destinationState: '',
  status: '',
  includeDeleted: 'false',
  equipment: '',
  customerName: '',
  carrierName: '',
  minMiles: '',
  maxMiles: '',
  minRevenue: '',
  maxRevenue: '',
  minMarginPct: '',
  maxMarginPct: '',
  dateFrom: '',
  dateTo: '',
  sort: '-updatedAt',
};

const SEARCH_FIELD_OPTIONS = [
  { key: 'searchTerm', label: 'Search Terms' },
  { key: 'originState', label: 'Origin State' },
  { key: 'destinationState', label: 'Destination State' },
  { key: 'status', label: 'Load Status' },
  { key: 'includeDeleted', label: 'Include Deleted' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'carrierName', label: 'Carrier Name' },
  { key: 'minMiles', label: 'Min Miles' },
  { key: 'maxMiles', label: 'Max Miles' },
  { key: 'minRevenue', label: 'Min Revenue' },
  { key: 'maxRevenue', label: 'Max Revenue' },
  { key: 'minMarginPct', label: 'Min Margin %' },
  { key: 'maxMarginPct', label: 'Max Margin %' },
  { key: 'dateFrom', label: 'Pickup Date From' },
  { key: 'dateTo', label: 'Pickup Date To' },
  { key: 'sort', label: 'Sort' },
];

const DEFAULT_ACTIVE_FIELDS = [
  'searchTerm',
  'originState',
  'destinationState',
  'status',
  'includeDeleted',
  'equipment',
  'dateFrom',
  'dateTo',
  'sort',
];

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const parsed = toDate(value);
  return parsed ? parsed.toLocaleString() : '—';
}

function formatMoney(value) {
  return `$${toNumber(value).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function toMarginPresentation(load) {
  const revenue = toNumber(load?.revenue);
  const carrierCost = toNumber(load?.carrierCost);
  if (carrierCost <= 0 || revenue <= 0) {
    return { label: 'Pending cost', pct: null };
  }

  const marginPct = ((revenue - carrierCost) / revenue) * 100;
  return {
    label: `${marginPct.toFixed(1)}%`,
    pct: marginPct,
  };
}

export default function SearchLoads() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme || {};
  const [criteria, setCriteria] = useState(DEFAULT_CRITERIA);
  const [activeFields, setActiveFields] = useState(DEFAULT_ACTIVE_FIELDS);
  const [fieldToAdd, setFieldToAdd] = useState('customerName');
  const [searchState, setSearchState] = useState({ loading: false, error: '', items: [], searchedAt: '' });
  const [workingLoadId, setWorkingLoadId] = useState('');
  const [selectedLoadIds, setSelectedLoadIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  const isFieldActive = (fieldKey) => activeFields.includes(fieldKey);

  const addCriteriaField = () => {
    if (!fieldToAdd || activeFields.includes(fieldToAdd)) return;
    setActiveFields((prev) => [...prev, fieldToAdd]);
  };

  const removeCriteriaField = (fieldKey) => {
    if (fieldKey === 'sort') return;
    setActiveFields((prev) => prev.filter((entry) => entry !== fieldKey));
    setCriteria((prev) => ({ ...prev, [fieldKey]: DEFAULT_CRITERIA[fieldKey] ?? '' }));
  };

  const fetchAllLoads = async () => {
    const pageSize = 100;
    let page = 1;
    let total = 0;
    const items = [];

    while (true) {
      const result = await listLoads({
        tab: 'all',
        q: isFieldActive('searchTerm') ? criteria.searchTerm : '',
        status: isFieldActive('status') ? criteria.status : '',
        includeDeleted: isFieldActive('includeDeleted') ? criteria.includeDeleted : 'false',
        equipment: isFieldActive('equipment') ? criteria.equipment : '',
        sort: isFieldActive('sort') ? criteria.sort : '-updatedAt',
        page,
        pageSize,
      });

      if (result?.error) {
        return { error: result.error, items: [] };
      }

      const pageItems = Array.isArray(result?.items) ? result.items : [];
      total = Number(result?.total || pageItems.length || 0);
      items.push(...pageItems);

      if (pageItems.length === 0 || items.length >= total || page >= 50) {
        break;
      }

      page += 1;
    }

    return { error: '', items };
  };

  const updateCriteria = (field, value) => {
    setCriteria((prev) => ({ ...prev, [field]: value }));
  };

  const runSearch = async () => {
    setSearchState((prev) => ({ ...prev, loading: true, error: '' }));
    setSelectedLoadIds([]);

    const fetched = await fetchAllLoads();

    if (fetched.error) {
      setSearchState({ loading: false, error: fetched.error, items: [], searchedAt: '' });
      return;
    }

    const rows = fetched.items;
    const normalizedOriginState = isFieldActive('originState') ? String(criteria.originState || '').trim().toUpperCase() : '';
    const normalizedDestinationState = isFieldActive('destinationState') ? String(criteria.destinationState || '').trim().toUpperCase() : '';
    const normalizedCustomerName = isFieldActive('customerName') ? String(criteria.customerName || '').trim().toLowerCase() : '';
    const normalizedCarrierName = isFieldActive('carrierName') ? String(criteria.carrierName || '').trim().toLowerCase() : '';
    const minMiles = isFieldActive('minMiles') ? Number(criteria.minMiles) : null;
    const maxMiles = isFieldActive('maxMiles') ? Number(criteria.maxMiles) : null;
    const minRevenue = isFieldActive('minRevenue') ? Number(criteria.minRevenue) : null;
    const maxRevenue = isFieldActive('maxRevenue') ? Number(criteria.maxRevenue) : null;
    const minMarginPct = isFieldActive('minMarginPct') ? Number(criteria.minMarginPct) : null;
    const maxMarginPct = isFieldActive('maxMarginPct') ? Number(criteria.maxMarginPct) : null;
    const fromDate = isFieldActive('dateFrom') ? toDate(criteria.dateFrom) : null;
    const toDateValue = isFieldActive('dateTo') ? toDate(criteria.dateTo) : null;

    const filtered = rows.filter((load) => {
      if (normalizedOriginState && String(load?.origin?.state || '').trim().toUpperCase() !== normalizedOriginState) return false;
      if (normalizedDestinationState && String(load?.destination?.state || '').trim().toUpperCase() !== normalizedDestinationState) return false;
      if (normalizedCustomerName && !String(load?.customer?.name || '').toLowerCase().includes(normalizedCustomerName)) return false;
      if (normalizedCarrierName && !String(load?.carrier?.name || '').toLowerCase().includes(normalizedCarrierName)) return false;

      const miles = toNumber(load?.miles);
      if (Number.isFinite(minMiles) && miles < minMiles) return false;
      if (Number.isFinite(maxMiles) && miles > maxMiles) return false;

      const revenue = toNumber(load?.revenue);
      if (Number.isFinite(minRevenue) && revenue < minRevenue) return false;
      if (Number.isFinite(maxRevenue) && revenue > maxRevenue) return false;

      if (Number.isFinite(minMarginPct) || Number.isFinite(maxMarginPct)) {
        const margin = toMarginPresentation(load);
        const marginPct = Number(margin?.pct);
        if (!Number.isFinite(marginPct)) return false;
        if (Number.isFinite(minMarginPct) && marginPct < minMarginPct) return false;
        if (Number.isFinite(maxMarginPct) && marginPct > maxMarginPct) return false;
      }

      if (fromDate || toDateValue) {
        const pickupAt = toDate(load?.pickupAt);
        if (!pickupAt) return false;
        if (fromDate && pickupAt < fromDate) return false;
        if (toDateValue && pickupAt > new Date(toDateValue.getTime() + (24 * 60 * 60 * 1000) - 1)) return false;
      }

      return true;
    });

    setSearchState({
      loading: false,
      error: '',
      items: filtered,
      searchedAt: new Date().toISOString(),
    });
  };

  const resetCriteria = () => {
    setCriteria(DEFAULT_CRITERIA);
    setActiveFields(DEFAULT_ACTIVE_FIELDS);
    setFieldToAdd('customerName');
    setSearchState((prev) => ({ ...prev, error: '' }));
  };

  const openLoadContextMenu = (load, x, y) => {
    if (!load?.id) return;

    const menuWidth = 260;
    const menuHeight = 420;
    const viewportWidth = window.innerWidth || 1280;
    const viewportHeight = window.innerHeight || 720;

    const clampedX = Math.max(8, Math.min(x, viewportWidth - menuWidth - 8));
    const clampedY = Math.max(8, Math.min(y, viewportHeight - menuHeight - 8));

    setContextMenu({ load, x: clampedX, y: clampedY });
  };

  const runContextAction = async (action, load) => {
    if (!load?.id) return;
    setActionMessage('');

    if (action === 'view') {
      navigate(`/loads/${encodeURIComponent(load.id)}/load-basics`);
      return;
    }

    if (action === 'openTab') {
      window.open(`/loads/${encodeURIComponent(load.id)}/load-basics`, '_blank', 'noopener,noreferrer');
      return;
    }

    if (action === 'copyId') {
      navigator.clipboard?.writeText(load.id);
      setActionMessage(`Copied ${load.id}`);
      return;
    }

    setWorkingLoadId(load.id);
    let result;

    try {
      if (action === 'assign') {
        result = await dispatchLoad(load.id, {
          carrierId: load.carrier?.id || 'CR-18',
          carrierName: (load.carrier?.name && load.carrier.name !== '—') ? load.carrier.name : 'Prime Logistics',
        });
      } else if (action === 'post') {
        result = await sendToBidNetwork(load.id, { network: 'smart-auction-board' });
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
      } else if (action === 'void') {
        result = await voidLoad(load.id, { reason: 'Voided from Search Loads' });
      } else if (action === 'cancel') {
        result = await updateLoad(load.id, {
          status: 'TENDERED',
          carrierName: '—',
          carrierId: '',
          carrierAssigned: false,
        });
      } else if (action === 'restore') {
        result = await restoreLoad(load.id);
      } else if (action === 'delete') {
        const confirmed = window.confirm(`Archive load ${load.id}? It will be retained and searchable.`);
        if (!confirmed) {
          setWorkingLoadId('');
          return;
        }
        result = await deleteLoad(load.id);
      }

      if (result?.error) {
        setActionMessage(result.error);
      } else {
        const successByAction = {
          assign: `Assigned carrier for ${load.id}`,
          post: `Posted ${load.id} to board`,
          duplicate: `Duplicated ${load.id}`,
          void: `Voided ${load.id}`,
          cancel: `Moved ${load.id} back to tendered`,
          restore: `Restored ${load.id} to draft`,
          delete: `Archived ${load.id}`,
        };
        setActionMessage(successByAction[action] || 'Action completed');
        await runSearch();
      }
    } finally {
      setWorkingLoadId('');
    }
  };

  const handleDeleteLoad = async (loadId) => {
    const confirmed = window.confirm(`Archive load ${loadId}? It will be retained and searchable.`);
    if (!confirmed) return;

    setWorkingLoadId(loadId);
    const result = await deleteLoad(loadId);
    setWorkingLoadId('');

    if (result?.error) {
      setSearchState((prev) => ({ ...prev, error: result.error }));
      return;
    }

    setActionMessage(`Archived ${loadId}.`);
    await runSearch();
  };

  const toggleLoadSelection = (loadId, checked) => {
    setSelectedLoadIds((prev) => {
      if (checked) {
        if (prev.includes(loadId)) return prev;
        return [...prev, loadId];
      }
      return prev.filter((entry) => entry !== loadId);
    });
  };

  const toggleSelectAllVisible = (checked) => {
    if (!checked) {
      setSelectedLoadIds([]);
      return;
    }
    setSelectedLoadIds(searchState.items.map((row) => row.id));
  };

  const handleDeleteSelectedLoads = async () => {
    const ids = selectedLoadIds.slice();
    if (!ids.length) return;

    const confirmed = window.confirm(`Archive ${ids.length} selected load(s)? They will be retained and searchable.`);
    if (!confirmed) return;

    setBulkDeleting(true);
    setActionMessage('');

    const failedIds = [];
    for (const loadId of ids) {
      const result = await deleteLoad(loadId);
      if (result?.error) failedIds.push(loadId);
    }

    setBulkDeleting(false);

    const failedSet = new Set(failedIds);
    const deletedCount = ids.length - failedIds.length;

    await runSearch();
    setSelectedLoadIds(failedIds);

    if (failedIds.length > 0) {
      setActionMessage(`Archived ${deletedCount} load(s); ${failedIds.length} failed and remain selected.`);
    } else {
      setActionMessage(`Archived ${deletedCount} load(s).`);
    }
  };

  useEffect(() => {
    runSearch();
  }, []);

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

  const exportCsv = () => {
    const rows = searchState.items;
    if (!rows.length) return;

    const header = ['Load ID', 'Status', 'Customer', 'Origin', 'Destination', 'Pickup At', 'Miles', 'Revenue', 'Carrier Cost', 'Margin %'];
    const body = rows.map((load) => {
      const margin = toMarginPresentation(load);
      return [
        load.id,
        load.status,
        load.customer?.name || '',
        `${load.origin?.city || ''}, ${load.origin?.state || ''}`.trim(),
        `${load.destination?.city || ''}, ${load.destination?.state || ''}`.trim(),
        load.pickupAt || '',
        toNumber(load.miles),
        toNumber(load.revenue),
        toNumber(load.carrierCost),
        margin.label,
      ];
    });

    const lines = [header, ...body].map((columns) => columns.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','));
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `search-loads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const criteriaSummary = useMemo(() => {
    const segments = [];
    if (isFieldActive('searchTerm') && criteria.searchTerm) segments.push(`Term: ${criteria.searchTerm}`);
    if (isFieldActive('originState') && criteria.originState) segments.push(`Origin: ${criteria.originState.toUpperCase()}`);
    if (isFieldActive('destinationState') && criteria.destinationState) segments.push(`Destination: ${criteria.destinationState.toUpperCase()}`);
    if (isFieldActive('status') && criteria.status) segments.push(`Status: ${formatLoadStatusLabel(criteria.status)}`);
    if (isFieldActive('includeDeleted')) segments.push(`Include Deleted: ${criteria.includeDeleted === 'true' ? 'Yes' : 'No'}`);
    if (isFieldActive('equipment') && criteria.equipment) segments.push(`Equipment: ${criteria.equipment}`);
    if (isFieldActive('customerName') && criteria.customerName) segments.push(`Customer: ${criteria.customerName}`);
    if (isFieldActive('carrierName') && criteria.carrierName) segments.push(`Carrier: ${criteria.carrierName}`);
    if (isFieldActive('minMiles') && criteria.minMiles) segments.push(`Miles ≥ ${criteria.minMiles}`);
    if (isFieldActive('maxMiles') && criteria.maxMiles) segments.push(`Miles ≤ ${criteria.maxMiles}`);
    if (isFieldActive('minRevenue') && criteria.minRevenue) segments.push(`Revenue ≥ ${criteria.minRevenue}`);
    if (isFieldActive('maxRevenue') && criteria.maxRevenue) segments.push(`Revenue ≤ ${criteria.maxRevenue}`);
    if (isFieldActive('minMarginPct') && criteria.minMarginPct) segments.push(`Margin ≥ ${criteria.minMarginPct}%`);
    if (isFieldActive('maxMarginPct') && criteria.maxMarginPct) segments.push(`Margin ≤ ${criteria.maxMarginPct}%`);
    if ((isFieldActive('dateFrom') && criteria.dateFrom) || (isFieldActive('dateTo') && criteria.dateTo)) {
      segments.push(`Range: ${criteria.dateFrom || '—'} → ${criteria.dateTo || '—'}`);
    }
    return segments.join(' • ') || 'No criteria selected';
  }, [criteria, activeFields]);

  const availableFieldOptions = SEARCH_FIELD_OPTIONS.filter((entry) => !activeFields.includes(entry.key));
  const allVisibleSelected = searchState.items.length > 0 && searchState.items.every((row) => selectedLoadIds.includes(row.id));

  const criteriaControlStyle = { minHeight: 38, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '0 12px' };

  const renderCriteriaControl = (fieldKey) => {
    if (fieldKey === 'searchTerm') {
      return (
        <input
          value={criteria.searchTerm}
          onChange={(event) => updateCriteria('searchTerm', event.target.value)}
          placeholder="Search term"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'originState') {
      return (
        <input
          value={criteria.originState}
          onChange={(event) => updateCriteria('originState', event.target.value)}
          placeholder="Origin state (e.g. TX)"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'destinationState') {
      return (
        <input
          value={criteria.destinationState}
          onChange={(event) => updateCriteria('destinationState', event.target.value)}
          placeholder="Destination state (e.g. FL)"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'status') {
      return (
        <select
          value={criteria.status}
          onChange={(event) => updateCriteria('status', event.target.value)}
          style={criteriaControlStyle}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PRE_DISPATCH">Pre Dispatch</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="EXCEPTION">Exception</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      );
    }
    if (fieldKey === 'includeDeleted') {
      return (
        <select
          value={criteria.includeDeleted}
          onChange={(event) => updateCriteria('includeDeleted', event.target.value)}
          style={criteriaControlStyle}
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      );
    }
    if (fieldKey === 'equipment') {
      return (
        <select
          value={criteria.equipment}
          onChange={(event) => updateCriteria('equipment', event.target.value)}
          style={criteriaControlStyle}
        >
          <option value="">All Equipment</option>
          <option value="van">Van</option>
          <option value="reefer">Reefer</option>
          <option value="flatbed">Flatbed</option>
        </select>
      );
    }
    if (fieldKey === 'customerName') {
      return (
        <input
          value={criteria.customerName}
          onChange={(event) => updateCriteria('customerName', event.target.value)}
          placeholder="Customer name"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'carrierName') {
      return (
        <input
          value={criteria.carrierName}
          onChange={(event) => updateCriteria('carrierName', event.target.value)}
          placeholder="Carrier name"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'minMiles') {
      return (
        <input
          type="number"
          min="0"
          value={criteria.minMiles}
          onChange={(event) => updateCriteria('minMiles', event.target.value)}
          placeholder="Min miles"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'maxMiles') {
      return (
        <input
          type="number"
          min="0"
          value={criteria.maxMiles}
          onChange={(event) => updateCriteria('maxMiles', event.target.value)}
          placeholder="Max miles"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'minRevenue') {
      return (
        <input
          type="number"
          min="0"
          value={criteria.minRevenue}
          onChange={(event) => updateCriteria('minRevenue', event.target.value)}
          placeholder="Min revenue"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'maxRevenue') {
      return (
        <input
          type="number"
          min="0"
          value={criteria.maxRevenue}
          onChange={(event) => updateCriteria('maxRevenue', event.target.value)}
          placeholder="Max revenue"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'minMarginPct') {
      return (
        <input
          type="number"
          value={criteria.minMarginPct}
          onChange={(event) => updateCriteria('minMarginPct', event.target.value)}
          placeholder="Min margin %"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'maxMarginPct') {
      return (
        <input
          type="number"
          value={criteria.maxMarginPct}
          onChange={(event) => updateCriteria('maxMarginPct', event.target.value)}
          placeholder="Max margin %"
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'dateFrom') {
      return (
        <input
          type="date"
          value={criteria.dateFrom}
          onChange={(event) => updateCriteria('dateFrom', event.target.value)}
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'dateTo') {
      return (
        <input
          type="date"
          value={criteria.dateTo}
          onChange={(event) => updateCriteria('dateTo', event.target.value)}
          style={criteriaControlStyle}
        />
      );
    }
    if (fieldKey === 'sort') {
      return (
        <select
          value={criteria.sort}
          onChange={(event) => updateCriteria('sort', event.target.value)}
          style={criteriaControlStyle}
        >
          <option value="-updatedAt">Newest Updated</option>
          <option value="updatedAt">Oldest Updated</option>
          <option value="-pickupAt">Latest Pickup</option>
          <option value="pickupAt">Earliest Pickup</option>
          <option value="-marginPct">Highest Margin %</option>
          <option value="marginPct">Lowest Margin %</option>
        </select>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Search Loads</h1>
        <div style={{ fontSize: 12, color: t.textSecondary }}>
          {searchState.searchedAt ? `Last search: ${formatDate(searchState.searchedAt)}` : 'Run a search to load results'}
        </div>
      </div>

      <section style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, padding: 14, display: 'grid', gap: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.textSecondary }}>Search Criteria</div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            value={fieldToAdd}
            onChange={(event) => setFieldToAdd(event.target.value)}
            style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '0 10px', minWidth: 220 }}
            disabled={availableFieldOptions.length === 0}
          >
            {availableFieldOptions.length === 0 ? (
              <option value="">All fields already added</option>
            ) : (
              availableFieldOptions.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.label}</option>
              ))
            )}
          </select>
          <button
            type="button"
            onClick={addCriteriaField}
            disabled={!fieldToAdd || availableFieldOptions.length === 0}
            style={{ minHeight: 34, borderRadius: 8, border: `1px solid ${t.accent}`, background: t.bgAlt, color: t.text, padding: '0 12px', cursor: (!fieldToAdd || availableFieldOptions.length === 0) ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700 }}
          >
            + Add Another Search Field
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeFields.map((fieldKey) => {
            const fieldMeta = SEARCH_FIELD_OPTIONS.find((entry) => entry.key === fieldKey);
            const removable = fieldKey !== 'sort';
            return (
              <span
                key={fieldKey}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 999,
                  border: `1px solid ${t.border}`,
                  background: t.bgAlt,
                  color: t.textSecondary,
                  fontSize: 12,
                }}
              >
                {fieldMeta?.label || fieldKey}
                {removable ? (
                  <button
                    type="button"
                    onClick={() => removeCriteriaField(fieldKey)}
                    style={{ border: 'none', background: 'transparent', color: t.error, cursor: 'pointer', fontSize: 12, padding: 0, lineHeight: 1 }}
                    aria-label={`Remove ${fieldMeta?.label || fieldKey}`}
                  >
                    ×
                  </button>
                ) : null}
              </span>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(160px, 1fr))', gap: 10 }}>
          {activeFields.map((fieldKey) => {
            const fieldMeta = SEARCH_FIELD_OPTIONS.find((entry) => entry.key === fieldKey);
            return (
              <div key={fieldKey} style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 11, color: t.textSecondary }}>{fieldMeta?.label || fieldKey}</label>
                {renderCriteriaControl(fieldKey)}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 12, color: t.textSecondary }}>{criteriaSummary}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={handleDeleteSelectedLoads}
              disabled={!selectedLoadIds.length || bulkDeleting || searchState.loading}
              style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.error}`, background: 'transparent', color: t.error, padding: '0 14px', cursor: (!selectedLoadIds.length || bulkDeleting || searchState.loading) ? 'not-allowed' : 'pointer', fontWeight: 700 }}
            >
              {bulkDeleting ? 'Archiving Selected...' : `Archive Selected (${selectedLoadIds.length})`}
            </button>
            <button
              type="button"
              onClick={resetCriteria}
              style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.border}`, background: 'transparent', color: t.textSecondary, padding: '0 14px', cursor: 'pointer' }}
            >
              Reset Criteria
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!searchState.items.length}
              style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.accent}`, background: t.bgAlt, color: t.text, padding: '0 14px', cursor: searchState.items.length ? 'pointer' : 'not-allowed' }}
            >
              Export Report
            </button>
            <button
              type="button"
              onClick={runSearch}
              disabled={searchState.loading}
              style={{ minHeight: 36, borderRadius: 8, border: `1px solid ${t.accent}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, color: t.bg, padding: '0 14px', cursor: 'pointer', fontWeight: 700 }}
            >
              {searchState.loading ? 'Searching...' : 'Search Loads / Preview Report'}
            </button>
          </div>
        </div>
      </section>

      {searchState.error ? (
        <div style={{ fontSize: 12, color: t.error }}>{searchState.error}</div>
      ) : null}
      {actionMessage ? (
        <div style={{ fontSize: 12, color: t.textSecondary }}>{actionMessage}</div>
      ) : null}

      <section style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, padding: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1080, fontSize: '1rem' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${t.border}` }}>
              <th style={{ textAlign: 'center', padding: '8px 6px', fontSize: 12, width: 34 }}>
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) => toggleSelectAllVisible(event.target.checked)}
                  aria-label="Select all visible loads"
                />
              </th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12 }}>Load ID</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12 }}>Customer</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12 }}>Origin</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12 }}>Destination</th>
              <th style={{ textAlign: 'left', padding: '8px 10px', fontSize: 12 }}>Pickup</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12 }}>Miles</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12 }}>Revenue</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12 }}>Carrier Cost</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12 }}>Margin %</th>
              <th style={{ textAlign: 'right', padding: '8px 10px', fontSize: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {searchState.items.map((load) => {
              const margin = toMarginPresentation(load);
              return (
                <tr
                  key={load.id}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    openLoadContextMenu(load, event.clientX, event.clientY);
                  }}
                  style={{ borderBottom: `1px solid ${t.border}`, cursor: 'context-menu' }}
                >
                  <td style={{ padding: '8px 6px', fontSize: 12, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedLoadIds.includes(load.id)}
                      onChange={(event) => toggleLoadSelection(load.id, event.target.checked)}
                      aria-label={`Select load ${load.id}`}
                    />
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{load.id}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{formatLoadStatusLabel(normalizeLoadStatus(load.status))}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{load.customer?.name || '—'}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12 }}>{formatDate(load.pickupAt)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{toNumber(load.miles).toLocaleString()}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{formatMoney(load.revenue)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>{formatMoney(load.carrierCost)}</td>
                  <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right', color: margin.pct === null ? t.warning : (margin.pct >= 12 ? t.success : t.error) }}>
                    {margin.label}
                  </td>
                  <td style={{ padding: '8px 10px', fontSize: 12, textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteLoad(load.id)}
                      disabled={workingLoadId === load.id || bulkDeleting}
                      style={{
                        minHeight: 30,
                        borderRadius: 6,
                        border: `1px solid ${t.error}`,
                        background: 'transparent',
                        color: t.error,
                        padding: '0 10px',
                        fontSize: 12,
                        cursor: 'pointer',
                      }}
                    >
                      {workingLoadId === load.id ? 'Archiving...' : 'Archive'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {!searchState.loading && searchState.items.length === 0 && (
              <tr>
                <td colSpan={12} style={{ padding: '16px 10px', textAlign: 'center', fontSize: 12, color: t.textSecondary }}>
                  No loads matched the current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

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
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            background: t.surface,
            boxShadow: '0 14px 34px rgba(0,0,0,0.28)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 10px', borderBottom: `1px solid ${t.border}`, fontSize: 12, fontWeight: 700, color: t.textSecondary }}>
            Load {contextMenu.load.id} Shortcuts
          </div>
          {(() => {
            const isDeleted = normalizeLoadStatus(contextMenu.load?.status) === 'CANCELLED'
              || Boolean(contextMenu.load?.deletedAt)
              || Boolean(contextMenu.load?.archived);
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
              { label: 'Go to Load Management', key: 'view' },
              {
                label: 'Go to Customer in Load Management',
                key: 'goCustomer',
                onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/customer-info`),
              },
              {
                label: 'Go to Carrier in Load Management',
                key: 'goCarrier',
                onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/carrier-asset-info`),
              },
              {
                label: 'Go to Financials in Load Management',
                key: 'goFinancials',
                onClick: (load) => navigate(`/loads/${encodeURIComponent(load.id)}/financials`),
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
                    } else {
                      runContextAction(action.key, contextMenu.load);
                    }
                    setContextMenu(null);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    border: 'none',
                    borderBottom: `1px solid ${t.border}`,
                    background: 'transparent',
                    color: t.text,
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
    </div>
  );
}
