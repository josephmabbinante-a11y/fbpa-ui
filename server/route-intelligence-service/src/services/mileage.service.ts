export interface MileageContext {
  volatilityIndex?: number;
  capacityScore?: number;
}

export function calculateBillableMiles(actualMiles: number, context: MileageContext = {}): number {
  const baseOperationalBuffer = 1.03;
  const volatilityMultiplier = 1 + Math.max(0, Number(context.volatilityIndex || 0)) * 0.001;
  const capacityMultiplier = 1 + Math.max(0, Number(context.capacityScore || 0)) * 0.0005;

  const billable = Number(actualMiles || 0) * baseOperationalBuffer * volatilityMultiplier * capacityMultiplier;
  return Math.max(1, Math.round(billable));
}
