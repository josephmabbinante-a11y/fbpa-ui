import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export type RateInputs = {
  origin: string
  destination: string
  equipment: 'DV' | 'REEFER' | 'FLATBED' | 'DRAY'
  miles: number
  marketRPM: number
  volatilityIndex: number
  capacityScore: number
  rejectionRate: number
  fuelCost: number
}

export type PricingState = {
  carrierBuy: number
  targetMarginPct: number
  sellRate: number
  winProbability: number
  predictedMarket: number
  grossMargin: number
}

interface PricingEngineStore {
  inputs: RateInputs
  setInputs: (inputs: Partial<RateInputs>) => void
  // All outputs are computed selectors below
  carrierBuy: number
  targetMarginPct: number
  sellRate: number
  winProbability: number
  predictedMarket: number
  grossMargin: number
  // Sensitivity toggles
  scenario: {
    marketSoftens: boolean
    rejectionsUp: boolean
    capacityTightens: boolean
  }
  setScenario: (scenario: Partial<PricingEngineStore['scenario']>) => void
}

const logistic = (x: number, k: number, x0: number) => 1 / (1 + Math.exp(k * (x - x0)))

export const usePricingEngineStore = create<PricingEngineStore>()(
  devtools((set, get) => ({
    inputs: {
      origin: '',
      destination: '',
      equipment: 'DV',
      miles: 1000,
      marketRPM: 2.5,
      volatilityIndex: 20,
      capacityScore: 50,
      rejectionRate: 7,
      fuelCost: 0.55,
    },
    setInputs: (inputs) => set((state) => ({ inputs: { ...state.inputs, ...inputs } })),
    scenario: {
      marketSoftens: false,
      rejectionsUp: false,
      capacityTightens: false,
    },
    setScenario: (scenario) => set((state) => ({ scenario: { ...state.scenario, ...scenario } })),
    // Computed selectors
    get carrierBuy() {
      const { miles, marketRPM, fuelCost } = get().inputs
      return miles * marketRPM + miles * fuelCost
    },
    get predictedMarket() {
      let base = get().inputs.marketRPM * get().inputs.miles
      if (get().scenario.marketSoftens) base *= 0.97
      if (get().scenario.capacityTightens) base *= 1.03
      if (get().scenario.rejectionsUp) base *= 1.02
      return base
    },
    get sellRate() {
      return get().predictedMarket * (1 + get().targetMarginPct / 100)
    },
    get targetMarginPct() {
      return 12 // default, can be made dynamic
    },
    get grossMargin() {
      return get().sellRate - get().carrierBuy
    },
    get winProbability() {
      const k = 0.02 + get().inputs.volatilityIndex / 1000
      return logistic(get().sellRate, k, get().predictedMarket)
    },
  }))
)
