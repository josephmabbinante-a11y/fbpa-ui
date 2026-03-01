import React from 'react';
import PrimaryTabs from './components/PrimaryTabs';
import SubTabs from './components/SubTabs';
import FilterBar from './components/FilterBar';
import LoadsGrid from './components/LoadsGrid';
import LoadDetailPanel from './components/LoadDetailPanel';
import FacetsBar from './components/FacetsBar';
import PaginationBar from './components/PaginationBar';
import useLoadFilters from './hooks/useLoadFilters';
import useLoadsQuery from './hooks/useLoadsQuery';
import useLoadActions from './hooks/useLoadActions';
import useLoadSelection from './hooks/useLoadSelection';

export default function LoadCommandPage({ pageTitle = 'Load Command' }) {
  const { filters, selectedId, updateFilters, resetFilters, selectLoad } = useLoadFilters();
  const { listState, detailState, refreshList, refreshDetail } = useLoadsQuery(filters, selectedId);
  const { actionState, dispatch, reassign, sendToBidNetwork, markDelivered } = useLoadActions({ selectedId, refreshList, refreshDetail });
  const { selectedDetail } = useLoadSelection({ selectedId, listState, detailState });

  return (
    <div className="ui-page" style={{ display: 'grid', gap: 12 }}>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)' }}>{pageTitle}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Operational execution console</div>
      </div>
      <PrimaryTabs active="loads" />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 12, minHeight: '70vh' }}>
        <section style={{ minWidth: 0 }}>
          <SubTabs activeTab={filters.tab} onChange={(tab) => updateFilters({ tab })} />
          <FilterBar filters={filters} onChange={updateFilters} onReset={resetFilters} />
          <FacetsBar facets={listState.data?.facets} />

          {listState.loading && <div style={{ padding: 12, color: 'var(--text-secondary)' }}>Loading loads...</div>}
          {listState.error && <div style={{ padding: 12, color: 'var(--error)' }}>{listState.error}</div>}

          {!listState.loading && !listState.error && (
            <>
              <LoadsGrid items={listState.data?.items || []} selectedId={selectedId} onSelect={(load) => selectLoad(load.id)} />
              <PaginationBar
                page={filters.page}
                pageSize={filters.pageSize}
                total={listState.data?.total || 0}
                onPageChange={(page) => updateFilters({ page }, { resetPage: false })}
                onPageSizeChange={(pageSize) => updateFilters({ pageSize }, { resetPage: true })}
              />
            </>
          )}
        </section>

        <LoadDetailPanel
          detail={selectedDetail}
          risk={detailState.risk}
          events={detailState.events}
          actionState={actionState}
          onDispatch={dispatch}
          onReassign={reassign}
          onBidNetwork={sendToBidNetwork}
          onDelivered={markDelivered}
        />
      </div>

      {detailState.loading && <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Loading selected load details...</div>}
      {detailState.error && <div style={{ color: 'var(--error)', fontSize: 12 }}>{detailState.error}</div>}
    </div>
  );
}
