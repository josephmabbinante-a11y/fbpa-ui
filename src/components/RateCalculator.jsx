
import React, { useState } from 'react';
import LoadInputs from './LoadInputs';
import RateBreakdown from './RateBreakdown';
import MarketTrends from './MarketTrends';
import SummaryBar from './SummaryBar';
import { useDemo } from '../demo/DemoContext';
import styles from './RateCalculator.module.css';
import { mockRateData } from '../mock/mockRateData';

const EMPTY_RATE_DATA = {
  shipmentOptions: { origins: [''], destinations: [''] },
  marketIntelligence: { rpm: 0, volatility: 0, capacity: 0, predictedSwing: 0 },
  laneData: [],
  bookedLoads: [],
  kpis: { winProb: 0 },
  forecast: {},
  topCarriers: [],
};

const RateCalculator = () => {
  const { demoMode } = useDemo();
  const rateData = demoMode ? mockRateData : EMPTY_RATE_DATA;

  const [origin, setOrigin] = useState(rateData.shipmentOptions.origins[0]);
  const [destination, setDestination] = useState(rateData.shipmentOptions.destinations[0]);
  const [rpm, setRpm] = useState(rateData.marketIntelligence.rpm);
  const [volatility, setVolatility] = useState(rateData.marketIntelligence.volatility);
  const [capacity, setCapacity] = useState(rateData.marketIntelligence.capacity);

  const [winProb, setWinProb] = useState(rateData.kpis.winProb);
  const [forecast, setForecast] = useState({ ...rateData.forecast });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Truckload Rate Calculator</h1>
        <div className={styles.headerIcons}>
          {/* Placeholder for lock/settings/profile icons */}
        </div>
      </header>
      <main className={styles.main}>
        <section className={styles.leftPanel}>
          <LoadInputs
            shipmentOptions={rateData.shipmentOptions}
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            rpm={rpm}
            setRpm={setRpm}
            volatility={volatility}
            setVolatility={setVolatility}
            capacity={capacity}
            setCapacity={setCapacity}
            predictedSwing={rateData.marketIntelligence.predictedSwing}
            laneData={rateData.laneData}
            bookedLoads={rateData.bookedLoads}
          />
        </section>
        <section className={styles.centerPanel}>
          <RateBreakdown
            kpis={rateData.kpis}
            winProb={winProb}
            setWinProb={setWinProb}
          />
        </section>
        <section className={styles.rightPanel}>
          <MarketTrends
            forecast={forecast}
            setForecast={setForecast}
            topCarriers={rateData.topCarriers}
          />
        </section>
      </main>
      <footer className={styles.footer}>
        <SummaryBar />
      </footer>
    </div>
  );
};

export default RateCalculator;
