import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  dispatchLoad,
  getLoadDetail,
  getLoadEvents,
  getLoadRiskSignals,
  listLoads,
  markLoadDelivered,
  reassignLoad,
  sendToBidNetwork,
} from '../../api/loadsClient';
import PrimaryTabs from './components/PrimaryTabs';
import SubTabs from './components/SubTabs';
import FilterBar from './components/FilterBar';
import LoadsGrid from './components/LoadsGrid';
import LoadDetailPanel from './components/LoadDetailPanel';

const DEFAULT_FILTERS = {
  tab: 'all',
  q: '',
  status: '',
  equipment: '',
  page: '1',
  pageSize: '50',
};

function readFilters(params) {
  return {
    tab: params.get('tab') || DEFAULT_FILTERS.tab,
    q: params.get('q') || DEFAULT_FILTERS.q,
    status: params.get('status') || DEFAULT_FILTERS.status,
    equipment: params.get('equipment') || DEFAULT_FILTERS.equipment,
    page: params.get('page') || DEFAULT_FILTERS.page,
    pageSize: params.get('pageSize') || DEFAULT_FILTERS.pageSize,
  };
}

function writeFilters(nextFilters) {
  const params = new URLSearchParams();
  Object.entries(nextFilters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  return params;
}

export default function LoadCommandPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const selectedId = searchParams.get('selected') || '';

  const [listState, setListState] = useState({ loading: true, error: '', data: { items: [], total: 0 } });
  const [detailState, setDetailState] = useState({ loading: false, error: '', detail: null, risk: null, events: [] });
  const [actionState, setActionState] = useState({ busy: false, error: '', success: '' });

  const refreshList = async () => {
    setListState((prev) => ({ ...prev, loading: true, error: '' }));
    const response = await listLoads(filters);
    if (response?.error) {
      setListState({ loading: false, error: response.error, data: { items: [], total: 0 } });
      return;
    }
    setListState({ loading: false, error: '', data: response });
  };

  const refreshDetail = async (id) => {
    if (!id) {
      setDetailState({ loading: false, error: '', detail: null, risk: null, events: [] });
      return;
    }

    setDetailState((prev) => ({ ...prev, loading: true, error: '' }));
    const [detail, risk, events] = await Promise.all([
      getLoadDetail(id),
      getLoadRiskSignals(id),
      getLoadEvents(id),
    ]);

    if (detail?.error) {
      setDetailState({ loading: false, error: detail.error, detail: null, risk: null, events: [] });
      return;
    }

    setDetailState({
      loading: false,
      error: '',
      detail,
      risk: risk?.risk || null,
      events: events?.items || [],
    });
  };

  useEffect(() => {
    refreshList();
  }, [filters.tab, filters.q, filters.status, filters.equipment, filters.page, filters.pageSize]);

  useEffect(() => {
    refreshDetail(selectedId);
  }, [selectedId]);

  const updateFilters = (patch) => {
    const next = { ...filters, ...patch, page: '1' };
    if (selectedId) {
      const withSelection = writeFilters(next);
      withSelection.set('selected', selectedId);
      setSearchParams(withSelection);
      return;
    }
    setSearchParams(writeFilters(next));
  };

  const resetFilters = () => {
    const next = writeFilters(DEFAULT_FILTERS);
    if (selectedId) next.set('selected', selectedId);
    setSearchParams(next);
  };

  const handleSelect = (load) => {
    const next = writeFilters(filters);
    next.set('selected', load.id);
    setSearchParams(next);
  };

  const runAction = async (actionFn, successMessage) => {
    if (!selectedId) return;

    setActionState({ busy: true, error: '', success: '' });
    const response = await actionFn();

    if (response?.error) {
      setActionState({ busy: false, error: response.error, success: '' });
      return;
    }

    setActionState({ busy: false, error: '', success: successMessage });
    await Promise.all([refreshList(), refreshDetail(selectedId)]);
  };

  const selectedDetail = detailState.detail;

  return (
    <div className="ui-page" style={{ display: 'grid', gap: 12 }}>
      <PrimaryTabs active="loads" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 12, minHeight: '70vh' }}>
        <section style={{ minWidth: 0 }}>
          <SubTabs activeTab={filters.tab} onChange={(tab) => updateFilters({ tab })} />
          <FilterBar filters={filters} onChange={updateFilters} onReset={resetFilters} />

          {listState.loading && <div style={{ padding: 12, color: 'var(--text-secondary)' }}>Loading loads...</div>}
          {listState.error && <div style={{ padding: 12, color: 'var(--error)' }}>{listState.error}</div>}

          {!listState.loading && !listState.error && (
            <>
              <LoadsGrid items={listState.data?.items || []} selectedId={selectedId} onSelect={handleSelect} />
              <div style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 12 }}>
                {Number(listState.data?.total || 0).toLocaleString()} total loads
              </div>
            </>
          )}
        </section>

        <LoadDetailPanel
          detail={selectedDetail}
          risk={detailState.risk}
          events={detailState.events}
          actionState={actionState}
          onDispatch={() => runAction(() => dispatchLoad(selectedId, { carrierId: 'CR-18', carrierName: 'Prime Logistics', lockStatus: true }), 'Load dispatched')}
          onReassign={() => runAction(() => reassignLoad(selectedId, { carrierId: 'CR-27', carrierName: 'Reassigned Carrier', reason: 'Capacity adjustment' }), 'Carrier reassigned')}
          onBidNetwork={() => runAction(() => sendToBidNetwork(selectedId, { network: 'internal' }), 'Sent to bid network')}
          onDelivered={() => runAction(() => markLoadDelivered(selectedId, { deliveredAt: new Date().toISOString(), podReceived: true }), 'Load marked delivered')}
        />
      </div>

      {detailState.loading && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Loading selected load details...</div>}
      {detailState.error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{detailState.error}</div>}
    </div>
  );
}
