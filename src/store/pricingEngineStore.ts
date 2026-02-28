import create from 'zustand';
import { devtools } from 'zustand/middleware';

export type RateInputs = {
  origin: string;
  destination: string;
  equipment: 'DV' | 'REEFER' | 'FLATBED' | 'DRAY';
  miles: number;
  marketRPM: number;
  volatilityIndex: number;
  capacityScore: number;
  rejectionRate: number;
  fuelCost: number;
};

export type PricingState = {
  carrierBuy: number;
  targetMarginPct: number;
  sellRate: number;
  winProbability: number;
  predictedMarket: number;
  grossMargin: number;
};

interface PricingEngineStore {
  inputs: RateInputs;
  setInputs: (inputs: Partial<RateInputs>) => void;
  targetMarginPct: number;
  setTargetMarginPct: (pct: number) => void;
  sellRate: number;
  setSellRate: (rate: number) => void;
  // Derived selectors
  carrierBuy: number;
  predictedMarket: number;
  winProbability: number;
  grossMargin: number;
  marginPct: number;
  // Sensitivity toggles
  scenario: {
    marketSoftens: boolean;
    rejectionsUp: boolean;
    capacityTightens: boolean;
  };
  setScenario: (s: Partial<PricingEngineStore['scenario']>) => void;
}

export const usePricingEngineStore = create<PricingEngineStore>()(
  devtools((set, get) => ({
    inputs: {
      origin: '',
      destination: '',
      equipment: 'DV',
      miles: 1000,
      marketRPM: 2.5,
      volatilityIndex: 15,
      capacityScore: 50,
      rejectionRate: 7,
      fuelCost: 0.45,
    },
    setInputs: (inputs) => set((state) => ({ inputs: { ...state.inputs, ...inputs } })),
    targetMarginPct: 12,
    setTargetMarginPct: (pct) => set({ targetMarginPct: pct }),
    sellRate: 3000,
    setSellRate: (rate) => set({ sellRate: rate }),
    // Sensitivity toggles
    scenario: {
      marketSoftens: false,
      rejectionsUp: false,
      capacityTightens: false,
    },
    setScenario: (s) => set((state) => ({ scenario: { ...state.scenario, ...s } })),
    // Derived selectors (computed in components via useMemo for perf)
    get carrierBuy() {
      const { miles, marketRPM, fuelCost } = get().inputs;
      return Math.round(miles * marketRPM + miles * fuelCost);
    },
    get predictedMarket() {
      let base = get().carrierBuy * 1.08;
      if (get().scenario.marketSoftens) base *= 0.97;
      if (get().scenario.capacityTightens) base *= 1.03;
      if (get().scenario.rejectionsUp) base *= 1.02;
      return Math.round(base);
    },
    get winProbability() {
      const k = 0.01 * get().inputs.volatilityIndex + 0.05;
      const x = get().sellRate - get().predictedMarket;
      return Math.round(100 / (1 + Math.exp(k * x)));
    },
    get grossMargin() {
      return get().sellRate - get().carrierBuy;
    },
    get marginPct() {
      return Math.round((get().grossMargin / get().sellRate) * 1000) / 10;
    },
  }))
);
