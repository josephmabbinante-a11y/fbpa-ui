import { useMemo } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import CollapsibleSection from '../components/CollapsibleSection';
import logo from '../assets/opscale-logo.svg';
import mockExceptions from '../mock/exceptions';

const REASON_COLORS = {
  RATE_MISMATCH: '#8884d8',
  DUPLICATE: '#ff8042',
  INVALID_ACCESSORIALS: '#82ca9d',
};

const DEFAULT_COLORS = ['#ffc658', '#0099cc', '#b0b0b0'];

function buildBreakdownFromExceptions(exceptions) {
  const counts = {};
  for (const exc of exceptions) {
    const key = exc.reasonCode || exc.status || 'Other';
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.entries(counts).map(([name, value], index) => ({
    name,
    value,
    fill: REASON_COLORS[name] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));
}

export default function ExceptionsUploads() {
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = themes[theme];

  const breakdownData = useMemo(
    () => (demoMode ? buildBreakdownFromExceptions(mockExceptions) : []),
    [demoMode]
  );

  return (
    <div className="page-shell section" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
      {/* Exceptions Panel */}
      <div className="card-surface card-elevated" style={{ gridColumn: 'span 7', minHeight: 420 }}>
        <h2 className="card-header" style={{ color: t.text, marginBottom: 16 }}>
          <img src={logo} alt="Opscale Audit IQ" style={{ height: 32, width: 'auto', marginRight: 12, verticalAlign: 'middle' }} />
          Exceptions Overview
        </h2>
        <ExceptionBreakdownChart data={breakdownData} />
        <CollapsibleSection title="Exception Details">
          {/* Render exception details here */}
        </CollapsibleSection>
      </div>

      {/* Uploads Panel */}
      <div className="card-surface card-elevated" style={{ gridColumn: 'span 5', minHeight: 420 }}>
        <h2 className="card-header" style={{ color: t.text, marginBottom: 16 }}>
          Uploads & History
        </h2>
        <CollapsibleSection title="Upload History">
          {/* Render upload history here */}
        </CollapsibleSection>
      </div>
    </div>
  );
}
