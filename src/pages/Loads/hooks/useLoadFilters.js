import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export const DEFAULT_LOAD_FILTERS = {
  tab: 'all',
  q: '',
  status: '',
  equipment: '',
  sort: '-updatedAt',
  page: '1',
  pageSize: '25',
};

function readFilters(params) {
  return {
    tab: params.get('tab') || DEFAULT_LOAD_FILTERS.tab,
    q: params.get('q') || DEFAULT_LOAD_FILTERS.q,
    status: params.get('status') || DEFAULT_LOAD_FILTERS.status,
    equipment: params.get('equipment') || DEFAULT_LOAD_FILTERS.equipment,
    sort: params.get('sort') || DEFAULT_LOAD_FILTERS.sort,
    page: params.get('page') || DEFAULT_LOAD_FILTERS.page,
    pageSize: params.get('pageSize') || DEFAULT_LOAD_FILTERS.pageSize,
  };
}

function writeFilters(filters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  return params;
}

export default function useLoadFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const selectedId = searchParams.get('selected') || '';

  const updateFilters = (patch, options = { resetPage: true }) => {
    const next = {
      ...filters,
      ...patch,
      ...(options.resetPage ? { page: '1' } : {}),
    };
    const params = writeFilters(next);
    if (selectedId) params.set('selected', selectedId);
    setSearchParams(params);
  };

  const resetFilters = () => {
    const params = writeFilters(DEFAULT_LOAD_FILTERS);
    if (selectedId) params.set('selected', selectedId);
    setSearchParams(params);
  };

  const selectLoad = (loadId) => {
    const params = writeFilters(filters);
    if (loadId) params.set('selected', loadId);
    else params.delete('selected');
    setSearchParams(params);
  };

  return {
    filters,
    selectedId,
    updateFilters,
    resetFilters,
    selectLoad,
  };
}
