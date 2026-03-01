import { useState } from 'react';
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
  const TabComponent = tabs[activeTab].component;

  return (
    <div className="combined-page">
      <div className="tabs" style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={activeTab === idx ? 'active' : ''}
            style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ccc', background: activeTab === idx ? '#e0eaff' : '#fff', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setActiveTab(idx)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tab-content">
        <TabComponent />
      </div>
    </div>
  );
}
