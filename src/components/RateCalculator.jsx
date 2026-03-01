
import React, { useState } from 'react';
import LoadInputs from './LoadInputs';
import RateBreakdown from './RateBreakdown';
import MarketTrends from './MarketTrends';
import SummaryBar from './SummaryBar';
import styles from './RateCalculator.module.css';
import { mockRateData } from '../mock/mockRateData';

const RateCalculator = () => {
  // Centralized state for mock data linkage
  const [origin, setOrigin] = useState(mockRateData.shipmentOptions.origins[0]);
  const [destination, setDestination] = useState(mockRateData.shipmentOptions.destinations[0]);
  const [rpm, setRpm] = useState(mockRateData.marketIntelligence.rpm);
  const [volatility, setVolatility] = useState(mockRateData.marketIntelligence.volatility);
  const [capacity, setCapacity] = useState(mockRateData.marketIntelligence.capacity);

  const [winProb, setWinProb] = useState(mockRateData.kpis.winProb);
  const [forecast, setForecast] = useState({ ...mockRateData.forecast });

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
            shipmentOptions={mockRateData.shipmentOptions}
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
            predictedSwing={mockRateData.marketIntelligence.predictedSwing}
            laneData={mockRateData.laneData}
            bookedLoads={mockRateData.bookedLoads}
          />
        </section>
        <section className={styles.centerPanel}>
          <RateBreakdown
            kpis={mockRateData.kpis}
            winProb={winProb}
            setWinProb={setWinProb}
          />
        </section>
        <section className={styles.rightPanel}>
          <MarketTrends
            forecast={forecast}
            setForecast={setForecast}
            topCarriers={mockRateData.topCarriers}
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
