import React, { useState } from 'react';

// Compact, 3-column grid Customer Section with floating labels
export default function CustomerSection({ onComplete }) {
  const [fields, setFields] = useState({
    customer: '',
    equipmentType: '',
    serviceLevel: '',
    commodity: '',
    poNumber: '',
    refNumber: '',
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
    <form style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 16,
      marginBottom: 8,
      alignItems: 'end',
    }}>
      {/* Row 1 */}
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
      <div className="form-group">
        <input
          type="text"
          value={fields.equipmentType}
          onChange={e => handleChange('equipmentType', e.target.value)}
          className="input-dense"
          placeholder=" "
        />
        <label className="floating-label">Equipment Type</label>
      </div>
      <div className="form-group">
        <input
          type="text"
          value={fields.serviceLevel}
          onChange={e => handleChange('serviceLevel', e.target.value)}
          className="input-dense"
          placeholder=" "
        />
        <label className="floating-label">Service Level</label>
      </div>
      {/* Row 2 */}
      <div className="form-group">
        <input
          type="text"
          value={fields.commodity}
          onChange={e => handleChange('commodity', e.target.value)}
          className="input-dense"
          placeholder=" "
        />
        <label className="floating-label">Commodity</label>
      </div>
      <div className="form-group">
        <input
          type="text"
          value={fields.poNumber}
          onChange={e => handleChange('poNumber', e.target.value)}
          className="input-dense"
          placeholder=" "
        />
        <label className="floating-label">PO Number</label>
      </div>
      <div className="form-group">
        <input
          type="text"
          value={fields.refNumber}
          onChange={e => handleChange('refNumber', e.target.value)}
          className="input-dense"
          placeholder=" "
        />
        <label className="floating-label">Ref Number</label>
      </div>
      {isComplete && (
        <div style={{ gridColumn: '1 / span 3', color: 'green', fontWeight: 600, marginTop: 8 }}>
          Customer section complete
        </div>
      )}
    </form>
  );
}
