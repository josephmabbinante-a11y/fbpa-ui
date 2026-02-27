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
  { label: 'Load Workflow', component: LoadWorkflow },
  { label: 'Active Loads', component: ActiveLoads },
  { label: 'Planning Loads', component: PlanningLoads },
  { label: 'Ready for Accounting Loads', component: ReadyForAccountingLoads },
  { label: 'Misc. Loads', component: MiscLoads },
  { label: 'All Loads', component: AllLoads },
  { label: 'AscendLTL Loads', component: AscendLTLLoads },
  { label: 'My Loads', component: MyLoads },
  { label: 'Externally Posted Loads', component: ExternallyPostedLoads },
];

function LoadWorkflow() {
  const [loadData, setLoadData] = useState({});
  const [verified, setVerified] = useState(false);
  const [distribution, setDistribution] = useState({
    private: false,
    internal: false,
    dat: false,
    truckstop: false,
  });
  const [postingControls, setPostingControls] = useState({
    visibility: 'private',
    rateVisible: true,
    expiration: '',
  });
  const [fmcaStatus, setFmcaStatus] = useState('pending');
  const [businessStatus, setBusinessStatus] = useState('pending');

  // Placeholder verification logic
  function verifyCarrierCustomer() {
    setFmcaStatus('verified');
    setBusinessStatus('verified');
    setVerified(true);
  }

  function handleDistributionChange(channel) {
    setDistribution((prev) => ({ ...prev, [channel]: !prev[channel] }));
  }

  function handlePostingControlChange(e) {
    const { name, value, type, checked } = e.target;
    setPostingControls((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit() {
    // Placeholder for posting logic
    alert('Load posted to selected channels!');
  }

  return (
    <div className="load-workflow">
      <h2>Create & Verify Load</h2>
      <div>
        <label>Carrier FMCSA Status: <b>{fmcaStatus}</b></label>
        <br />
        <label>Business Verification: <b>{businessStatus}</b></label>
        <br />
        <button disabled={verified} onClick={verifyCarrierCustomer}>Verify Carrier & Customer</button>
      </div>
      <hr />
      <h3>Distribution Channels</h3>
      <div>
        <label><input type="checkbox" checked={distribution.private} onChange={() => handleDistributionChange('private')} /> Private Carrier Group</label>
        <label><input type="checkbox" checked={distribution.internal} onChange={() => handleDistributionChange('internal')} /> Internal Network</label>
        <label><input type="checkbox" checked={distribution.dat} onChange={() => handleDistributionChange('dat')} /> DAT Freight & Analytics</label>
        <label><input type="checkbox" checked={distribution.truckstop} onChange={() => handleDistributionChange('truckstop')} /> Truckstop</label>
      </div>
      <hr />
      <h3>Posting Controls</h3>
      <div>
        <label>Visibility:
          <select name="visibility" value={postingControls.visibility} onChange={handlePostingControlChange}>
            <option value="private">Private</option>
            <option value="internal">Internal</option>
            <option value="public">Public</option>
          </select>
        </label>
        <label>Rate Visible:
          <input type="checkbox" name="rateVisible" checked={postingControls.rateVisible} onChange={handlePostingControlChange} />
        </label>
        <label>Expiration:
          <input type="datetime-local" name="expiration" value={postingControls.expiration} onChange={handlePostingControlChange} />
        </label>
      </div>
      <hr />
      <button disabled={!verified} onClick={handleSubmit}>Post Load</button>
    </div>
  );
}

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
