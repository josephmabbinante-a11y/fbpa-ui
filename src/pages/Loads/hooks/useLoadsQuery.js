import { useCallback, useEffect, useState } from 'react';
import { getLoadDetail, getLoadEvents, getLoadRiskSignals, listLoads } from '../../../api/loadsClient';

export default function useLoadsQuery(filters, selectedId) {
  const [listState, setListState] = useState({ loading: true, error: '', data: { items: [], total: 0 } });
  const [detailState, setDetailState] = useState({ loading: false, error: '', detail: null, risk: null, events: [] });

  const refreshList = useCallback(async () => {
    setListState((prev) => ({ ...prev, loading: true, error: '' }));
    const response = await listLoads(filters);
    if (response?.error) {
      setListState({ loading: false, error: response.error, data: { items: [], total: 0 } });
      return;
    }
    setListState({ loading: false, error: '', data: response });
  }, [filters]);

  const refreshDetail = useCallback(async (id) => {
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
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    refreshDetail(selectedId);
  }, [selectedId, refreshDetail]);

  return {
    listState,
    detailState,
    refreshList,
    refreshDetail,
  };
}
