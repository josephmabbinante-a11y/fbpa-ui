import React, { useState } from 'react';

// Compact, 3-column grid Customer Section with floating labels
export default function CustomerSection({ onComplete }) {
  const [fields, setFields] = useState({
    customer: '',
  });
  const [isComplete, setIsComplete] = useState(false);

  function handleChange(field, value) {
    setFields(f => ({ ...f, [field]: value }));
    if (field === 'customer' && value) {
      setIsComplete(true);
      if (onComplete) onComplete();
    }
  }

  return (
    <>
      <div style={{ marginBottom: 16, background: '#f4f8ff', padding: 12, borderRadius: 6, color: '#234', fontSize: 15 }}>
        <strong>Customer Information Section</strong><br />
        This section collects all relevant customer details for the load, including contact information, reference numbers, and any special notes. Please ensure all fields are accurate to facilitate smooth communication and documentation throughout the shipment lifecycle.
      </div>
      <form style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(1, minmax(260px, 420px))',
        gap: 16,
        marginBottom: 8,
        alignItems: 'end',
      }}>
      <div className="form-group">
        <input
          type="text"
          value={fields.customer}
          onChange={e => handleChange('customer', e.target.value)}
          className="input-dense"
          placeholder=" "
          autoComplete="off"
        />
        <label className="floating-label">Customer</label>
      </div>
      {isComplete && (
        <div style={{ color: 'green', fontWeight: 600, marginTop: 8 }}>
          Customer section complete
        </div>
      )}
    </form>
    </>
  );
}
