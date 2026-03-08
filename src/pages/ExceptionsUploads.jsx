import { useTheme } from '../contexts/ThemeContext';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import CollapsibleSection from '../components/CollapsibleSection';
import logo from '../assets/opscale-logo.svg';
import { useDemo } from '../demo/DemoContext';
import mockExceptions from '../mock/exceptions';
import uploadHistory from '../mock/uploads';

export default function ExceptionsUploads() {
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme;
  const chartData = demoMode && Array.isArray(mockExceptions?.trend) ? mockExceptions.trend : [];
  const historyItems = demoMode && Array.isArray(uploadHistory) ? uploadHistory : [];

  return (
    <div className="page-shell section" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
      {/* Exceptions Panel */}
      <div className="card-surface card-elevated" style={{ gridColumn: 'span 7', minHeight: 420 }}>
        <h2 className="card-header" style={{ color: t.text, marginBottom: 16 }}>
          <img src={logo} alt="Opscale Audit IQ" style={{ height: 32, width: 'auto', marginRight: 12, verticalAlign: 'middle' }} />
          Exceptions Overview
        </h2>
        <ExceptionBreakdownChart data={chartData} />
        <CollapsibleSection title="Exception Details">
          {chartData.length ? null : <div style={{ fontSize: 13, color: t.textSecondary }}>No exception data available.</div>}
        </CollapsibleSection>
      </div>

      {/* Uploads Panel */}
      <div className="card-surface card-elevated" style={{ gridColumn: 'span 5', minHeight: 420 }}>
        <h2 className="card-header" style={{ color: t.text, marginBottom: 16 }}>
          Uploads & History
        </h2>
        <CollapsibleSection title="Upload History">
          {historyItems.length ? (
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {historyItems.slice(0, 5).map((item) => (
                <li key={item.id} style={{ fontSize: 13, color: t.textSecondary, marginBottom: 6 }}>
                  {item.fileName || item.id} • {item.status || 'Processed'}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 13, color: t.textSecondary }}>No upload history available.</div>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
