import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Invoices from './Invoices';
import Exceptions from './Exceptions';
import Uploads from './Uploads';

const tabs = [
  { label: 'Invoices', component: Invoices },
  { label: 'Exceptions', component: Exceptions },
  { label: 'Uploads', component: Uploads },
];

export default function CombinedPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { theme } = useTheme();
  const t = theme;
  const TabComponent = tabs[activeTab].component;

  return (
    <div style={{ padding: 24, backgroundColor: t.bg, color: t.text, minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            style={{
              padding: '8px 18px',
              borderRadius: 6,
              border: `1px solid ${activeTab === idx ? t.accent : t.border}`,
              background: activeTab === idx ? t.accent : 'transparent',
              color: activeTab === idx ? '#fff' : t.text,
              fontWeight: activeTab === idx ? 700 : 400,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <TabComponent />
    </div>
  );
}
