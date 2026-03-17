import React, { useState } from 'react';

export default function CarrierSection({ enabled, onComplete }) {
  const [carrier, setCarrier] = useState('');
  const [complianceStatus, setComplianceStatus] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [safetyScore, setSafetyScore] = useState('');
  const [lastRunDate, setLastRunDate] = useState('');
  const [onTimePct, setOnTimePct] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  function handleCarrierSelect(value) {
    setCarrier(value);
    // Simulate auto-calc logic
    setComplianceStatus('Compliant');
    setInsuranceExpiry('2026-12-31');
    setSafetyScore('A');
    setLastRunDate('2026-02-01');
    setOnTimePct('98%');
    setIsComplete(true);
    if (onComplete) onComplete();
  }

  if (!enabled) {
    return <div style={{ color: '#aaa', fontWeight: 600 }}>Carrier section locked until lane exists.</div>;
  }

  return (
    <>
      <div style={{ marginBottom: 16, background: '#f4f8ff', padding: 12, borderRadius: 6, color: '#234', fontSize: 15 }}>
        <strong>Carrier Information Section</strong><br />
        Enter and verify carrier details here, including compliance status, insurance, and safety records. Accurate carrier information is essential for regulatory compliance and ensuring the safe, timely delivery of your load.
      </div>
      <form style={{ display: 'grid', gap: 12 }}>
      <label>
        Carrier Search (MC, DOT, Name)
        <input value={carrier} onChange={e => handleCarrierSelect(e.target.value)} placeholder="Search carrier..." />
      </label>
      <label>
        Compliance Status
        <input value={complianceStatus} readOnly />
      </label>
      <label>
        Insurance Expiry
        <input value={insuranceExpiry} readOnly />
      </label>
      <label>
        Safety Score
        <input value={safetyScore} readOnly />
      </label>
      <label>
        Last Run Date (this lane)
        <input value={lastRunDate} readOnly />
      </label>
      <label>
        On-Time %
        <input value={onTimePct} readOnly />
      </label>
      {isComplete && <div style={{ color: 'green', fontWeight: 600 }}>Carrier section complete</div>}
    </form>
    </>
  );
}
