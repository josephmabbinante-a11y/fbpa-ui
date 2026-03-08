import React, { useState } from 'react';

export default function CustomerSection({ onComplete }) {
  const [customer, setCustomer] = useState('');
  const [equipmentType, setEquipmentType] = useState('');
  const [commodity, setCommodity] = useState('');
  const [serviceLevel, setServiceLevel] = useState('');
  const [customerRef, setCustomerRef] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  // Simulate autofill logic
  function handleCustomerSelect(value) {
    setCustomer(value);
    // TODO: autofill billing terms, contract rate, historical lane, margin target
    setIsComplete(true);
    if (onComplete) onComplete();
  }

  return (
    <form style={{ display: 'grid', gap: 12 }}>
      <label>
        Customer (autocomplete)
        <input value={customer} onChange={e => handleCustomerSelect(e.target.value)} placeholder="Search customer..." />
      </label>
      <label>
        Equipment Type
        <input value={equipmentType} onChange={e => setEquipmentType(e.target.value)} />
      </label>
      <label>
        Commodity
        <input value={commodity} onChange={e => setCommodity(e.target.value)} />
      </label>
      <label>
        Service Level
        <input value={serviceLevel} onChange={e => setServiceLevel(e.target.value)} />
      </label>
      <label>
        Customer Reference
        <input value={customerRef} onChange={e => setCustomerRef(e.target.value)} />
      </label>
      <label>
        PO Number
        <input value={poNumber} onChange={e => setPoNumber(e.target.value)} />
      </label>
      {isComplete && <div style={{ color: 'green', fontWeight: 600 }}>Customer section complete</div>}
    </form>
  );
}
