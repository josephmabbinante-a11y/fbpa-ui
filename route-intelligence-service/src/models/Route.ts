export interface RouteRecord {
  id?: number;
  laneId: string;
  origin: string;
  destination: string;
  actualMiles: number;
  billableMiles: number;
  durationHours: number;
  polyline: string;
  method: 'here-truck';
  cached: boolean;
  createdAt?: string;
}
