export interface Lane {
  id: string;
  origin: string;
  destination: string;
  avgActualMiles: number;
  avgBillableMiles: number;
  volatilityIndex: number;
  capacityScore: number;
  createdAt?: string;
}
