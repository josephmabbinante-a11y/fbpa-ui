import { useCallback, useEffect, useState } from 'react';
import { getLoadDetail, getLoadEvents, getLoadRiskSignals, listLoads } from '../../../api/loadsClient';
import { normalizeLoadStatus } from '../../../utils/loadLifecycle';

const LOAD_LIST_POLL_MS = 12000;

function toCountdownMinutes(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;
  return Math.max(0, Math.round((timestamp - Date.now()) / 60000));
}

function normalizeRiskSignals(load, risk) {
  if (!load && !risk) return null;

  const normalizedStatus = normalizeLoadStatus(load?.status);
  const source = risk || {};
  const pickupCountdownMinutes = Number(source.pickupCountdownMinutes ?? toCountdownMinutes(load?.pickupAt) ?? 0);

  const derivedLaneVolatility = load
    ? Math.max(12, Math.min(94,
      24
      + (normalizedStatus === 'TENDERED' ? 26 : 0)
      + (normalizedStatus === 'EXCEPTION' ? 18 : 0)
      + (Number(load.marginPct || 0) < 12 ? 12 : 0)
      + (Number(load.miles || 0) > 1200 ? 8 : 0)
    ))
    : 42;

  const derivedCapacityHeat = load
    ? Math.max(20, Math.min(96,
      40
      + (load.carrier?.assigned ? -8 : 14)
      + (normalizedStatus === 'TENDERED' ? 15 : 0)
      + (normalizedStatus === 'IN_TRANSIT' ? -6 : 0)
      + (pickupCountdownMinutes > 300 ? 5 : 0)
    ))
    : 50;

  const fallbackWarnings = [
    ...(pickupCountdownMinutes > 0 && pickupCountdownMinutes < 240 && !load?.carrier?.assigned ? ['sla_risk_high'] : []),
    ...(Number(load?.marginPct || 0) < 12 ? ['margin_below_target'] : []),
    ...(!load?.carrier?.assigned ? ['carrier_unassigned'] : []),
  ];

  return {
    laneVolatilityScore: Number(source.laneVolatilityScore ?? derivedLaneVolatility),
    capacityHeatIndex: Number(source.capacityHeatIndex ?? derivedCapacityHeat),
    complianceStatus: String(source.complianceStatus || 'valid'),
    pickupCountdownMinutes,
    warnings: Array.isArray(source.warnings) && source.warnings.length > 0
      ? source.warnings
      : fallbackWarnings,
  };
}

export default function useLoadsQuery(filters, selectedId) {
  const [listState, setListState] = useState({ loading: true, refreshing: false, error: '', data: { items: [], total: 0 } });
  const [detailState, setDetailState] = useState({ loading: false, error: '', detail: null, risk: null, events: [] });

  const refreshList = useCallback(async () => {
    setListState((prev) => {
      const hasItems = Array.isArray(prev?.data?.items) && prev.data.items.length > 0;
      return {
        ...prev,
        loading: !hasItems,
        refreshing: hasItems,
        error: '',
      };
    });
    const response = await listLoads(filters);
    if (response?.error) {
      setListState((prev) => {
        const hasItems = Array.isArray(prev?.data?.items) && prev.data.items.length > 0;
        return {
          loading: false,
          refreshing: false,
          error: response.error,
          data: hasItems ? prev.data : { items: [], total: 0 },
        };
      });
      return;
    }
    setListState({ loading: false, refreshing: false, error: '', data: response });
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
      risk: normalizeRiskSignals(detail?.load, risk?.risk || null),
      events: events?.items || [],
    });
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshList();
        if (selectedId) refreshDetail(selectedId);
      }
    }, LOAD_LIST_POLL_MS);

    return () => window.clearInterval(timer);
  }, [refreshList, refreshDetail, selectedId]);

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
