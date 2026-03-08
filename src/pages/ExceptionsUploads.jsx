import { useTheme, themes } from '../contexts/ThemeContext';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import CollapsibleSection from '../components/CollapsibleSection';
import logo from '../assets/opscale-logo.svg';
import mockExceptions from '../mock/exceptions';
import uploadHistory from '../mock/uploads';

export default function ExceptionsUploads() {
  const { theme } = useTheme();
  const t = theme;

  return (
    <div className="page-shell section" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
      {/* Exceptions Panel */}
      <div className="card-surface card-elevated" style={{ gridColumn: 'span 7', minHeight: 420 }}>
        <h2 className="card-header" style={{ color: t.text, marginBottom: 16 }}>
          <img src={logo} alt="Opscale Audit IQ" style={{ height: 32, width: 'auto', marginRight: 12, verticalAlign: 'middle' }} />
          Exceptions Overview
        </h2>
        <ExceptionBreakdownChart data={mockExceptions.trend} />
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
