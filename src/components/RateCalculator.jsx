import React from 'react';
import LoadInputs from './LoadInputs';
import RateBreakdown from './RateBreakdown';
import MarketTrends from './MarketTrends';
import SummaryBar from './SummaryBar';
import styles from './RateCalculator.module.css';

const RateCalculator = () => {
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
          <LoadInputs />
        </section>
        <section className={styles.centerPanel}>
          <RateBreakdown />
        </section>
        <section className={styles.rightPanel}>
          <MarketTrends />
        </section>
      </main>
      <footer className={styles.footer}>
        <SummaryBar />
      </footer>
    </div>
  );
};

export default RateCalculator;
