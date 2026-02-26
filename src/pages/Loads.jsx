import React, { useState } from 'react';
import ActiveLoads from './Loads/ActiveLoads';
import PlanningLoads from './Loads/PlanningLoads';
import ReadyForAccountingLoads from './Loads/ReadyForAccountingLoads';
import MiscLoads from './Loads/MiscLoads';
import AllLoads from './Loads/AllLoads';
import AscendLTLLoads from './Loads/AscendLTLLoads';
import MyLoads from './Loads/MyLoads';
import ExternallyPostedLoads from './Loads/ExternallyPostedLoads';

const tabs = [
  { label: 'Active Loads', component: ActiveLoads },
  { label: 'Planning Loads', component: PlanningLoads },
  { label: 'Ready for Accounting Loads', component: ReadyForAccountingLoads },
  { label: 'Misc. Loads', component: MiscLoads },
  { label: 'All Loads', component: AllLoads },
  { label: 'AscendLTL Loads', component: AscendLTLLoads },
  { label: 'My Loads', component: MyLoads },
  { label: 'Externally Posted Loads', component: ExternallyPostedLoads },
];

export default function Loads() {
  const [activeTab, setActiveTab] = useState(0);
  const TabComponent = tabs[activeTab].component;

  return (
    <div className="loads-page">
      <h1>Load Management</h1>
      <div className="tabs">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            className={activeTab === idx ? 'active' : ''}
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
