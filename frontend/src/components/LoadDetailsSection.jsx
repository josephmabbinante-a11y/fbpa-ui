import React, { useState } from 'react';

const equipmentOptions = ['Van', 'Reefer', 'Flatbed', 'Step Deck', 'Power Only'];
const serviceLevelOptions = ['Standard', 'Expedited', 'Guaranteed', 'Same Day'];
const commodityOptions = [
  'General Freight',
  'Food & Beverage',
  'Building Materials',
  'Machinery',
  'Automotive',
  'Hazmat',
  'Other',
];

export default function LoadDetailsSection({ onComplete }) {
  const [details, setDetails] = useState({
    equipmentType: 'Van',
    serviceLevel: 'Standard',
    commodity: 'General Freight',
    poNumber: '',
    refNumber: '',
  });
  const [isComplete, setIsComplete] = useState(false);

  const handleChange = (field, value) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const markComplete = () => {
    const complete = Boolean(details.equipmentType && details.serviceLevel && details.commodity);
    if (!complete) return;
    setIsComplete(true);
    if (onComplete) onComplete(details);
  };

  return (
    <>
      <div style={{ marginBottom: 16, background: '#f4f8ff', padding: 12, borderRadius: 6, color: '#234', fontSize: 15 }}>
        <strong>Load Details Section</strong><br />
        Enter shipment-level details including equipment, service level, and commodity before moving to customer and dispatch steps.
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          markComplete();
        }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 8,
          alignItems: 'end',
        }}
      >
        <div className="form-group">
          <label className="floating-label" style={{ position: 'static', transform: 'none', marginBottom: 6, display: 'block' }}>
            Equipment Type
          </label>
          <select
            className="input-dense"
            value={details.equipmentType}
            onChange={(event) => handleChange('equipmentType', event.target.value)}
          >
            {equipmentOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="floating-label" style={{ position: 'static', transform: 'none', marginBottom: 6, display: 'block' }}>
            Service Level
          </label>
          <select
            className="input-dense"
            value={details.serviceLevel}
            onChange={(event) => handleChange('serviceLevel', event.target.value)}
          >
            {serviceLevelOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="floating-label" style={{ position: 'static', transform: 'none', marginBottom: 6, display: 'block' }}>
            Commodity
          </label>
          <select
            className="input-dense"
            value={details.commodity}
            onChange={(event) => handleChange('commodity', event.target.value)}
          >
            {commodityOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <input
            type="text"
            className="input-dense"
            value={details.poNumber}
            onChange={(event) => handleChange('poNumber', event.target.value)}
            placeholder=" "
          />
          <label className="floating-label">PO Number</label>
        </div>

        <div className="form-group">
          <input
            type="text"
            className="input-dense"
            value={details.refNumber}
            onChange={(event) => handleChange('refNumber', event.target.value)}
            placeholder=" "
          />
          <label className="floating-label">Ref Number</label>
        </div>

        <div>
          <button type="submit" style={{ padding: '8px 12px', fontWeight: 600 }}>Mark Load Details Complete</button>
        </div>

        {isComplete && (
          <div style={{ gridColumn: '1 / span 3', color: 'green', fontWeight: 600, marginTop: 8 }}>
            Load details section complete
          </div>
        )}
      </form>
    </>
  );
}
