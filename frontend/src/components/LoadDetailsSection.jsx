import React, { useState, useMemo } from 'react';

const EQUIPMENT_OPTIONS = ['Van', 'Reefer', 'Flatbed', 'Step Deck', 'Power Only', 'Container', 'Tanker', 'Hopper', 'Lowboy'];
const EQUIPMENT_LENGTHS = ['20 ft', '28 ft', '40 ft', '45 ft', '48 ft', '53 ft'];
const SERVICE_LEVELS = ['Standard', 'Expedited', 'Guaranteed', 'Same Day', 'White Glove'];
const COMMODITIES = ['General Freight', 'Food & Beverage', 'Building Materials', 'Machinery', 'Automotive', 'Hazmat', 'Electronics', 'Pharmaceuticals', 'Chemicals', 'Other'];
const LOAD_STATUSES = ['Pending', 'Available', 'Covered', 'Dispatched', 'In Transit', 'Delivered', 'Cancelled'];
const TRUCK_STATUSES = ['Unassigned', 'Assigned', 'En Route to Pickup', 'At Pickup', 'Loaded', 'En Route to Delivery', 'At Delivery', 'Empty'];

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#667', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, appearance: 'auto' };
const sectionHeaderStyle = { fontSize: 12, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #e0e6ed', paddingBottom: 4, marginBottom: 10, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 };
const toggleBtnStyle = (active) => ({
  padding: '5px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #2f80ed', borderRadius: 4, cursor: 'pointer',
  background: active ? '#2f80ed' : '#fff', color: active ? '#fff' : '#2f80ed', transition: 'all 0.15s',
});

export default function LoadDetailsSection({ onComplete }) {
  const [details, setDetails] = useState({
    loadStatus: 'Pending',
    truckStatus: 'Unassigned',
    creationDate: new Date().toISOString().slice(0, 10),
    branch: '',
    referenceIds: '',
    commodity: 'General Freight',
    weight: '',
    weightUnit: 'lbs',
    pieces: '',
    declaredValue: '',
    loadSize: 'Full',
    goodsCondition: 'New',
    equipmentType: 'Van',
    equipmentLength: '53 ft',
    tempControlled: false,
    tempMin: '',
    tempMax: '',
    tempUnit: 'F',
    containerNumber: '',
    lastFreeDay: '',
    serviceLevel: 'Standard',
    publicNotes: '',
    privateNotes: '',
    postingNotes: '',
  });
  const [isComplete, setIsComplete] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});

  const set = (field, value) => setDetails(prev => ({ ...prev, [field]: value }));
  const toggle = (section) => setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));

  const isReeferOrTemp = details.equipmentType === 'Reefer' || details.tempControlled;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!details.equipmentType || !details.commodity) return;
    setIsComplete(true);
    if (onComplete) onComplete(details);
  };

  const SectionToggle = ({ label, section }) => (
    <div onClick={() => toggle(section)} style={{ ...sectionHeaderStyle, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
      <span style={{ fontSize: 10, transform: collapsedSections[section] ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.15s' }}>▼</span>
      {label}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {/* ── Status & Identification ── */}
      <SectionToggle label="Status & Identification" section="status" />
      {!collapsedSections.status && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Load Status</label>
            <select style={selectStyle} value={details.loadStatus} onChange={e => set('loadStatus', e.target.value)}>
              {LOAD_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Truck Status</label>
            <select style={selectStyle} value={details.truckStatus} onChange={e => set('truckStatus', e.target.value)}>
              {TRUCK_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Creation Date</label>
            <input type="date" style={inputStyle} value={details.creationDate} onChange={e => set('creationDate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Branch</label>
            <input style={inputStyle} value={details.branch} onChange={e => set('branch', e.target.value)} placeholder="Office / Branch" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Reference IDs (one per line)</label>
            <textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={details.referenceIds} onChange={e => set('referenceIds', e.target.value)} placeholder="PO#, BOL#, PRO#, etc." />
          </div>
        </div>
      )}

      {/* ── Commodity & Cargo ── */}
      <SectionToggle label="Commodity & Cargo" section="cargo" />
      {!collapsedSections.cargo && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Commodity</label>
            <select style={selectStyle} value={details.commodity} onChange={e => set('commodity', e.target.value)}>
              {COMMODITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Weight</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input type="number" style={{ ...inputStyle, flex: 1 }} value={details.weight} onChange={e => set('weight', e.target.value)} placeholder="0" />
              <select style={{ ...selectStyle, width: 60, flex: 'none' }} value={details.weightUnit} onChange={e => set('weightUnit', e.target.value)}>
                <option>lbs</option><option>kg</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Pieces</label>
            <input type="number" style={inputStyle} value={details.pieces} onChange={e => set('pieces', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label style={labelStyle}>Declared Value ($)</label>
            <input type="number" style={inputStyle} value={details.declaredValue} onChange={e => set('declaredValue', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label style={labelStyle}>Load Size</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" style={toggleBtnStyle(details.loadSize === 'Full')} onClick={() => set('loadSize', 'Full')}>Full</button>
              <button type="button" style={toggleBtnStyle(details.loadSize === 'Partial')} onClick={() => set('loadSize', 'Partial')}>Partial</button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Condition</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="button" style={toggleBtnStyle(details.goodsCondition === 'New')} onClick={() => set('goodsCondition', 'New')}>New</button>
              <button type="button" style={toggleBtnStyle(details.goodsCondition === 'Used')} onClick={() => set('goodsCondition', 'Used')}>Used</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Equipment ── */}
      <SectionToggle label="Equipment" section="equip" />
      {!collapsedSections.equip && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Equipment Type</label>
            <select style={selectStyle} value={details.equipmentType} onChange={e => set('equipmentType', e.target.value)}>
              {EQUIPMENT_OPTIONS.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Length</label>
            <select style={selectStyle} value={details.equipmentLength} onChange={e => set('equipmentLength', e.target.value)}>
              {EQUIPMENT_LENGTHS.map(l => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Service Level</label>
            <select style={selectStyle} value={details.serviceLevel} onChange={e => set('serviceLevel', e.target.value)}>
              {SERVICE_LEVELS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Container #</label>
            <input style={inputStyle} value={details.containerNumber} onChange={e => set('containerNumber', e.target.value)} placeholder="XXXX-XXXXXX" />
          </div>
          <div>
            <label style={labelStyle}>Last Free Day</label>
            <input type="date" style={inputStyle} value={details.lastFreeDay} onChange={e => set('lastFreeDay', e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <input type="checkbox" checked={details.tempControlled} onChange={e => set('tempControlled', e.target.checked)} />
              Temp Controlled
            </label>
          </div>
          {isReeferOrTemp && (
            <>
              <div>
                <label style={labelStyle}>Temp Min</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input type="number" style={{ ...inputStyle, flex: 1 }} value={details.tempMin} onChange={e => set('tempMin', e.target.value)} placeholder="Min" />
                  <select style={{ ...selectStyle, width: 50, flex: 'none' }} value={details.tempUnit} onChange={e => set('tempUnit', e.target.value)}>
                    <option>F</option><option>C</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Temp Max</label>
                <input type="number" style={inputStyle} value={details.tempMax} onChange={e => set('tempMax', e.target.value)} placeholder="Max" />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Notes ── */}
      <SectionToggle label="Notes" section="notes" />
      {!collapsedSections.notes && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Public Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={details.publicNotes} onChange={e => set('publicNotes', e.target.value)} placeholder="Visible to all parties" />
          </div>
          <div>
            <label style={labelStyle}>Private Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 48, resize: 'vertical' }} value={details.privateNotes} onChange={e => set('privateNotes', e.target.value)} placeholder="Internal only" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Posting Notes</label>
            <textarea style={{ ...inputStyle, minHeight: 36, resize: 'vertical' }} value={details.postingNotes} onChange={e => set('postingNotes', e.target.value)} placeholder="Notes shown on load boards" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button type="submit" style={{ padding: '8px 18px', fontWeight: 600, background: '#2f80ed', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Mark Load Details Complete
        </button>
        {isComplete && <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 13 }}>✓ Load details complete</span>}
      </div>
    </form>
  );
}
