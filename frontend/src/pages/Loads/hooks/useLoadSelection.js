import { useMemo } from 'react';

export default function useLoadSelection({ selectedId, listState, detailState }) {
  const selectedFromList = useMemo(
    () => (listState?.data?.items || []).find((item) => item.id === selectedId) || null,
    [listState?.data?.items, selectedId],
  );

  const selectedDetail = detailState?.detail || null;

  return {
    selectedId,
    selectedFromList,
    selectedDetail,
  };
}
