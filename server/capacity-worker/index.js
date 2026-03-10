// Capacity Heat Index Model
function calculateCapacityHeat({
  inboundTrucks,
  outboundLoads,
  avgAcceptanceRate,
  rejectionVelocity
}) {
  const supplyDemandRatio = inboundTrucks / outboundLoads;
  const pressure = (1 - avgAcceptanceRate) + rejectionVelocity;
  const rawIndex = supplyDemandRatio * pressure;
  return Math.min(Math.max(rawIndex, 0), 2);
}

module.exports = { calculateCapacityHeat };
