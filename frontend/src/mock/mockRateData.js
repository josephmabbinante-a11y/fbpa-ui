// Centralized mock data for RateCalculator UI
export const mockRateData = {
  shipmentOptions: {
    origins: ['Los Angeles, CA', 'Chicago, IL', 'Atlanta, GA'],
    destinations: ['Dallas, TX', 'Houston, TX', 'Miami, FL'],
  },
  marketIntelligence: {
    rpm: 2.37,
    volatility: 18,
    capacity: 72,
    predictedSwing: 185,
  },
  laneData: [
    { source: 'Greenscreens.ai', rate: 2966 },
    { source: 'DAT', rate: 2968 },
    { source: 'Internal Historical', rate: 2910 },
  ],
  bookedLoads: [
    { carrier: 'SUPER TRUCKING INC', avgRate: 2989, riskScore: 445 },
    { carrier: 'NEW WAVE CARRIER', avgRate: 2958, riskScore: 254 },
    { carrier: 'FASTLANE LOGISTICS', avgRate: 5940, riskScore: 974 },
  ],
  kpis: {
    carrierCost: 2.37,
    predictedMarket: 3180,
    recommendedSell: 3445,
    winProb: 76,
    winProbHistory: [30, 35, 40, 45, 50, 55, 60, 65, 70, 76],
    swing: 185,
  },
  topCarriers: [
    { carrier: 'SUPER TRUCKING INC', avgRate: 2989, onTime: 96, riskScore: 0.76, margin: 435 },
    { carrier: 'NEW WAVE CARRIER', avgRate: 2958, onTime: 91, riskScore: 0.68, margin: 454 },
    { carrier: 'FASTLANE LOGISTICS', avgRate: 5940, onTime: 97, riskScore: 0.92, margin: 874 },
  ],
  summary: {
    totalLoads: 3203,
    avgRate: 2.92,
    onTime: 96,
    riskScore: 0.76,
  },
  forecast: {
    frontEvents: true,
    fiveNDR: true,
    marketSoftening: true,
    rejectionSpikes: true,
    addDetention: false,
  },
};
