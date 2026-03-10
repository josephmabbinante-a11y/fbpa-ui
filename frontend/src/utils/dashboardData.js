import dashboardEnhanced from '../mock/dashboardEnhanced';

function hasUsableSeries(series) {
  return (
    Array.isArray(series) &&
    series.length > 0 &&
    series.some((point) =>
      Object.entries(point || {}).some(([key, value]) => {
        if (key === 'day' || key === 'date' || key === 'month' || key === 'period' || key === 'label') {
          return false;
        }
        return Number.isFinite(Number(value));
      }),
    )
  );
}

function hasUsableBreakdown(items) {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.some((item) => Number(item?.value ?? item?.count ?? item?.total ?? 0) > 0)
  );
}

function hasUsableSavings(items) {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.some((item) => Number(item?.savings ?? item?.total ?? item?.value ?? 0) > 0)
  );
}

export function mergeDashboardData(incoming) {
  if (!incoming || typeof incoming !== 'object') return dashboardEnhanced;

  const fallbackTrends = dashboardEnhanced.trends || {};
  const incomingTrends = incoming.trends || {};
  const mergedTrends = {};

  Object.keys(fallbackTrends).forEach((key) => {
    const nextSeries = incomingTrends[key];
    mergedTrends[key] = hasUsableSeries(nextSeries) ? nextSeries : fallbackTrends[key];
  });

  return {
    ...dashboardEnhanced,
    ...incoming,
    summary: { ...dashboardEnhanced.summary, ...(incoming.summary || {}) },
    trends: mergedTrends,
    exceptionBreakdown: hasUsableBreakdown(incoming.exceptionBreakdown)
      ? incoming.exceptionBreakdown
      : dashboardEnhanced.exceptionBreakdown,
    claimsBreakdown: hasUsableBreakdown(incoming.claimsBreakdown)
      ? incoming.claimsBreakdown
      : dashboardEnhanced.exceptionBreakdown,
    savingsByCarrier: hasUsableSavings(incoming.savingsByCarrier)
      ? incoming.savingsByCarrier
      : dashboardEnhanced.savingsByCarrier,
    volumeByLane: hasUsableSavings(incoming.volumeByLane)
      ? incoming.volumeByLane
      : dashboardEnhanced.savingsByCarrier,
    recentActivity: incoming.recentActivity?.length ? incoming.recentActivity : dashboardEnhanced.recentActivity,
  };
}
