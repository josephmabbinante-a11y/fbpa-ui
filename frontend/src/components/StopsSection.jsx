import React, { useState, useEffect } from 'react';
import { listLocations } from '../api/locationsClient';

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#667', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, appearance: 'auto' };
const sectionHeaderStyle = { fontSize: 12, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #e0e6ed', paddingBottom: 4, marginBottom: 10, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 };
const thStyle = { padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#667', textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '2px solid #e0e6ed', textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };

const STOP_ACTIONS = ['Pickup', 'Delivery', 'Cross Dock', 'Transload', 'Inspection', 'Fuel Stop', 'Layover'];
const TYPE_COLORS = { Pickup: '#2f80ed', Delivery: '#27ae60', 'Cross Dock': '#8e44ad', Transload: '#e67e22', Inspection: '#95a5a6', 'Fuel Stop': '#f39c12', Layover: '#7f8c8d' };

function emptyStop(type) {
  return {
    id: `stop-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: type || 'Pickup',
    locationId: '',
    location: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    contact: '',
    contactPhone: '',
    contactEmail: '',
    scheduledDate: '',
    scheduledTime: '',
    appointmentEnd: '',
    endDate: '',
    notes: '',
    cargoDescription: '',
    referenceNumbers: '',
    driverInstructions: '',
    actualArrival: '',
    actualDeparture: '',
    loadingMinutes: '',
    showOnCustomerDocs: true,
    appointmentRequired: false,
    liftgateRequired: false,
    hazmatCertified: false,
    operatingHours: '',
    facilityType: '',
    locationType: '',
  };
}

const formSectionTitle = { fontSize: 14, fontWeight: 700, color: '#1a3a5c', borderBottom: '2px solid #c0cfe0', paddingBottom: 6, marginBottom: 14, marginTop: 18 };
const helpText = { fontSize: 11, color: '#888', marginTop: 3, lineHeight: 1.4 };
const fieldRow = { display: 'grid', gridTemplateColumns: '180px 1fr', gap: 10, alignItems: 'start', marginBottom: 12 };
const fieldLabel = { fontSize: 12, fontWeight: 700, color: '#555', textAlign: 'right', paddingTop: 8 };
const requiredDot = { color: '#e74c3c', marginRight: 2 };

function StopDetailForm({ stop, onChange, locations, onClose, onAddAction, onSave }) {
  const [locQuery, setLocQuery] = useState(stop.location || '');
  const [locResults, setLocResults] = useState([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const [showDateWindow, setShowDateWindow] = useState(false);

  const handleLocSearch = async (q) => {
    setLocQuery(q);
    if (!q.trim()) { setLocResults([]); return; }
    try {
      const res = await listLocations({ q });
      setLocResults(res?.items || []);
    } catch {
      setLocResults([]);
    }
    setShowLocDropdown(true);
  };

  const selectLocation = (loc) => {
    onChange({
      ...stop,
      locationId: loc.id || '',
      location: loc.name || loc.address || '',
      address: loc.address || loc.formattedAddress || '',
      city: loc.city || '',
      state: loc.state || '',
      zip: loc.zip || '',
      contact: loc.primaryContact || loc.contactName || '',
      contactPhone: loc.primaryPhone || loc.contactPhone || '',
      contactEmail: loc.primaryEmail || loc.contactEmail || '',
      notes: loc.publicNotes || loc.notes || stop.notes,
      driverInstructions: loc.complianceNotes || stop.driverInstructions,
      appointmentRequired: Boolean(loc.appointmentRequired),
      liftgateRequired: Boolean(loc.liftgateRequired),
      hazmatCertified: Boolean(loc.hazmatCertified),
      operatingHours: loc.operatingHours || '',
      facilityType: loc.facilityType || '',
      locationType: loc.locationType || '',
    });
    setLocQuery(loc.name || loc.address || '');
    setShowLocDropdown(false);
  };

  const typeColor = TYPE_COLORS[stop.type] || '#95a5a6';

  return (
    <div style={{ background: '#fff', border: '1px solid #d0d5dd', borderRadius: 6, marginBottom: 14, overflow: 'hidden' }}>
      {/* ─── Tab header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f5f7fa', borderBottom: '1px solid #e0e6ed' }}>
        <span style={{ fontSize: 14 }}>🗺️</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1a3a5c' }}>Add new stop</span>
      </div>

      <div style={{ padding: '10px 20px 20px' }}>
        {/* ═══════════  LOCATION DETAILS  ═══════════ */}
        <div style={formSectionTitle}>Location details</div>

        <div style={fieldRow}>
          <div style={fieldLabel}><span style={requiredDot}>*</span> Stop Location</div>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={locQuery}
                onChange={e => handleLocSearch(e.target.value)}
                placeholder="Search locations"
              />
              <button type="button" style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, background: '#2f80ed', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                ✏️ Edit Location Profile
              </button>
              {showLocDropdown && locResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 80, zIndex: 50, background: '#fff', border: '1px solid #d0d5dd', borderRadius: 4, maxHeight: 240, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }}>
                  {locResults.map((l, i) => (
                    <div key={l.id || i} onClick={() => selectLocation(l)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ fontWeight: 600, color: '#1a3a5c' }}>{l.name}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{[l.address, l.city, l.state, l.zip].filter(Boolean).join(', ')}</div>
                      {l.primaryContact && <div style={{ fontSize: 10, color: '#aaa' }}>Contact: {l.primaryContact} {l.primaryPhone ? `• ${l.primaryPhone}` : ''}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={helpText}>🔍 Use the field above to search for an existing location to add to this load.</div>
            <div style={{ fontSize: 12, color: '#2f80ed', marginTop: 4, cursor: 'pointer', fontWeight: 600 }}>+ Click here to create a new location to add to this load.</div>

            {/* ── Linked Location Summary ── */}
            {stop.locationId && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#f0f8ff', border: '1px solid #b8d4f0', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: '#1a3a5c' }}>📍 Linked Location</span>
                  <button type="button" onClick={() => { onChange({ ...stop, locationId: '', location: '', address: '', city: '', state: '', zip: '', contact: '', contactPhone: '', contactEmail: '' }); setLocQuery(''); }} style={{ fontSize: 11, color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Unlink</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 12, color: '#555' }}>
                  <div><strong>Name:</strong> {stop.location}</div>
                  <div><strong>ID:</strong> {stop.locationId}</div>
                  <div style={{ gridColumn: '1 / -1' }}><strong>Address:</strong> {[stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ')}</div>
                  {stop.contact && <div><strong>Contact:</strong> {stop.contact}</div>}
                  {stop.contactPhone && <div><strong>Phone:</strong> {stop.contactPhone}</div>}
                  {stop.contactEmail && <div><strong>Email:</strong> {stop.contactEmail}</div>}
                  {stop.operatingHours && <div><strong>Hours:</strong> {stop.operatingHours}</div>}
                  {stop.facilityType && <div><strong>Facility:</strong> {stop.facilityType}</div>}
                  {(stop.appointmentRequired || stop.liftgateRequired || stop.hazmatCertified) && (
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                      {stop.appointmentRequired && <span style={{ fontSize: 10, padding: '2px 6px', background: '#fff3cd', borderRadius: 3, fontWeight: 600 }}>📅 Appt Required</span>}
                      {stop.liftgateRequired && <span style={{ fontSize: 10, padding: '2px 6px', background: '#d4edda', borderRadius: 3, fontWeight: 600 }}>🔧 Liftgate</span>}
                      {stop.hazmatCertified && <span style={{ fontSize: 10, padding: '2px 6px', background: '#f8d7da', borderRadius: 3, fontWeight: 600 }}>☣️ Hazmat</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════  STOP ACTION (Pickup/Delivery)  ═══════════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 3, background: typeColor, textAlign: 'center', lineHeight: '18px', color: '#fff', fontSize: 11, fontWeight: 700 }}>
              {stop.type === 'Pickup' ? '⬆' : stop.type === 'Delivery' ? '⬇' : '⬌'}
            </span>
            <span style={{ fontWeight: 700, fontSize: 14, color: typeColor }}>{stop.type}</span>
          </div>
          <button type="button" onClick={onClose} style={{ fontSize: 12, background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}>
            🗑️ Remove stop action
          </button>
        </div>
        <div style={{ borderBottom: `2px solid ${typeColor}`, marginBottom: 14, marginTop: 4 }} />

        <div style={fieldRow}>
          <div style={fieldLabel}><span style={requiredDot}>*</span> Stop Action</div>
          <div>
            <select style={{ ...selectStyle, maxWidth: 320 }} value={stop.type} onChange={e => onChange({ ...stop, type: e.target.value })}>
              {STOP_ACTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
            <div style={helpText}>Use the field above to select the type of action that will happen at this stop. For example, Pickup.</div>
          </div>
        </div>

        <div style={{ ...fieldRow, alignItems: 'center' }}>
          <div style={fieldLabel} />
          <div>
            <label style={{ fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={stop.showOnCustomerDocs} onChange={e => onChange({ ...stop, showOnCustomerDocs: e.target.checked })} style={{ accentColor: '#2f80ed' }} />
              <strong style={{ fontSize: 12 }}>Show on Customer Docs?</strong>
            </label>
            <div style={helpText}>If checked, the stop action will show on all customer docs, including customer invoice and confirmation.</div>
          </div>
        </div>

        {/* ═══════════  FREIGHT PICKUP DETAILS  ═══════════ */}
        <div style={formSectionTitle}>Freight {stop.type} Details</div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Cargo Description</div>
          <div>
            <textarea style={{ ...inputStyle, minHeight: 36, resize: 'vertical' }} value={stop.cargoDescription} onChange={e => onChange({ ...stop, cargoDescription: e.target.value })} />
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Reference Numbers</div>
          <div>
            <textarea style={{ ...inputStyle, minHeight: 36, resize: 'vertical' }} value={stop.referenceNumbers} onChange={e => onChange({ ...stop, referenceNumbers: e.target.value })} placeholder="PO#, BOL#, etc." />
          </div>
        </div>

        {/* ═══════════  SCHEDULE DETAILS  ═══════════ */}
        <div style={formSectionTitle}>Schedule Details</div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Date/Time</div>
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" style={{ ...inputStyle, maxWidth: 170 }} value={stop.scheduledDate} onChange={e => onChange({ ...stop, scheduledDate: e.target.value })} />
              <input type="time" style={{ ...inputStyle, maxWidth: 130 }} value={stop.scheduledTime} onChange={e => onChange({ ...stop, scheduledTime: e.target.value })} placeholder="--:--" />
            </div>
            <div style={{ fontSize: 12, color: '#2f80ed', marginTop: 4, cursor: 'pointer', fontWeight: 600 }} onClick={() => setShowDateWindow(!showDateWindow)}>
              Set a date/time window
            </div>
            {showDateWindow && (
              <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>End:</span>
                <input type="date" style={{ ...inputStyle, maxWidth: 170 }} value={stop.endDate || ''} onChange={e => onChange({ ...stop, endDate: e.target.value })} />
                <input type="time" style={{ ...inputStyle, maxWidth: 130 }} value={stop.appointmentEnd} onChange={e => onChange({ ...stop, appointmentEnd: e.target.value })} />
              </div>
            )}
            <div style={helpText}>Enter the date/time range of the scheduled appointment, and, optionally, an end date/time for a scheduled appointment window. Enter time using a 24-hour clock (e.g. 6:00 PM would be 18:00).</div>
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Driver Instructions</div>
          <div>
            <textarea style={{ ...inputStyle, minHeight: 36, resize: 'vertical' }} value={stop.driverInstructions} onChange={e => onChange({ ...stop, driverInstructions: e.target.value })} />
          </div>
        </div>

        {/* ═══════════  ACTUAL DATE/TIME DETAILS  ═══════════ */}
        <div style={formSectionTitle}>Actual Date/Time Details</div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Actual Arrival Date/Time</div>
          <div>
            <input type="datetime-local" style={{ ...inputStyle, maxWidth: 260 }} value={stop.actualArrival} onChange={e => onChange({ ...stop, actualArrival: e.target.value })} />
            <div style={helpText}>Enter the Actual Date/Time of arrival at the {stop.type}/Delivery location.</div>
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Actual Departure Date/Time</div>
          <div>
            <input type="datetime-local" style={{ ...inputStyle, maxWidth: 260 }} value={stop.actualDeparture} onChange={e => onChange({ ...stop, actualDeparture: e.target.value })} />
            <div style={helpText}>The Actual Date/Time of departure at the {stop.type}/Delivery location.</div>
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Total Unloading Time</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="number" style={{ ...inputStyle, maxWidth: 200 }} value={stop.loadingMinutes} onChange={e => onChange({ ...stop, loadingMinutes: e.target.value })} />
            <span style={{ fontSize: 12, color: '#667', fontWeight: 600 }}>minutes</span>
          </div>
        </div>

        {/* ═══════════  CONTACT & NOTES  ═══════════ */}
        <div style={formSectionTitle}>Additional Info</div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Contact</div>
          <div>
            <input style={{ ...inputStyle, maxWidth: 320 }} value={stop.contact} onChange={e => onChange({ ...stop, contact: e.target.value })} placeholder="Name or phone" />
          </div>
        </div>

        <div style={fieldRow}>
          <div style={fieldLabel}>Notes</div>
          <div>
            <textarea style={{ ...inputStyle, minHeight: 36, resize: 'vertical' }} value={stop.notes} onChange={e => onChange({ ...stop, notes: e.target.value })} />
          </div>
        </div>

        {/* ═══════════  BOTTOM ACTIONS  ═══════════ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 14, borderTop: '1px solid #e0e6ed' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
            ✕ Cancel
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {onAddAction && (
              <button type="button" onClick={onAddAction} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                + Add Another Action
              </button>
            )}
            <button type="button" onClick={onSave || onClose} style={{ padding: '8px 18px', fontSize: 12, fontWeight: 700, background: '#2f80ed', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              📋 Save Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StopsSection({ onComplete, setStopsData }) {
  const [stops, setStops] = useState([]);
  const [expandedStopId, setExpandedStopId] = useState(null);
  const [isComplete, setIsComplete] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    listLocations().then(res => {
      if (res?.items) setLocations(res.items);
    }).catch(() => {});
  }, []);

  const addStop = (type) => {
    const newStop = emptyStop(type);
    const newStops = [...stops, newStop];
    setStops(newStops);
    setExpandedStopId(newStop.id);
    if (setStopsData) setStopsData(newStops);
  };

  const updateStop = (idx, updated) => {
    const newStops = stops.slice();
    newStops[idx] = updated;
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
    checkComplete(newStops);
  };

  const removeStop = (idx) => {
    const newStops = stops.filter((_, i) => i !== idx);
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
    if (stops[idx]?.id === expandedStopId) setExpandedStopId(null);
    checkComplete(newStops);
  };

  const moveStop = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= stops.length) return;
    const newStops = stops.slice();
    const [moved] = newStops.splice(fromIdx, 1);
    newStops.splice(toIdx, 0, moved);
    setStops(newStops);
    if (setStopsData) setStopsData(newStops);
  };

  const checkComplete = (arr) => {
    const valid = arr.length >= 2 && arr.every(s => s.address && s.scheduledDate);
    setIsComplete(valid);
    if (valid && onComplete) onComplete();
  };

  // Drag and drop
  const handleDragStart = (e, idx) => e.dataTransfer.setData('stopIdx', String(idx));
  const handleDrop = (e, idx) => {
    e.preventDefault();
    const fromIdx = Number(e.dataTransfer.getData('stopIdx'));
    if (fromIdx === idx) return;
    moveStop(fromIdx, idx);
  };

  return (
    <div>
      {/* ── Add Stop Buttons ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button type="button" onClick={() => addStop('Pickup')} style={{ padding: '6px 14px', fontWeight: 600, fontSize: 13, border: '1px solid #2f80ed', borderRadius: 4, background: '#eaf2ff', color: '#2f80ed', cursor: 'pointer' }}>
          + Add Pickup
        </button>
        <button type="button" onClick={() => addStop('Delivery')} style={{ padding: '6px 14px', fontWeight: 600, fontSize: 13, border: '1px solid #27ae60', borderRadius: 4, background: '#eafaf1', color: '#27ae60', cursor: 'pointer' }}>
          + Add Delivery
        </button>
        <button type="button" onClick={() => addStop('Cross Dock')} style={{ padding: '6px 14px', fontWeight: 600, fontSize: 13, border: '1px solid #8e44ad', borderRadius: 4, background: '#f5eef8', color: '#8e44ad', cursor: 'pointer' }}>
          + Add Other Stop
        </button>
      </div>

      {/* ── Stops Table ── */}
      {stops.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: 14 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Location</th>
                <th style={thStyle}>Address</th>
                <th style={thStyle}>Scheduled</th>
                <th style={thStyle}>Cargo</th>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stops.map((stop, idx) => (
                <tr key={stop.id} draggable onDragStart={e => handleDragStart(e, idx)} onDrop={e => handleDrop(e, idx)} onDragOver={e => e.preventDefault()}
                  style={{ background: expandedStopId === stop.id ? '#f0f6ff' : idx % 2 === 0 ? '#fff' : '#fafbfc', cursor: 'grab' }}>
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={tdStyle}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 3, fontSize: 11, fontWeight: 700, color: '#fff', background: TYPE_COLORS[stop.type] || '#95a5a6' }}>{stop.type}</span>
                  </td>
                  <td style={tdStyle}>
                    {stop.locationId ? <span title={`Linked: ${stop.locationId}`}>📍 </span> : ''}
                    {stop.location || '—'}
                  </td>
                  <td style={{ ...tdStyle, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td style={tdStyle}>{stop.scheduledDate ? `${stop.scheduledDate} ${stop.scheduledTime || ''}` : '—'}</td>
                  <td style={{ ...tdStyle, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stop.cargoDescription || '—'}</td>
                  <td style={tdStyle}>{stop.referenceNumbers || '—'}</td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button type="button" onClick={() => setExpandedStopId(expandedStopId === stop.id ? null : stop.id)} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #2f80ed', borderRadius: 3, background: '#fff', color: '#2f80ed', cursor: 'pointer', fontWeight: 600 }}>
                        {expandedStopId === stop.id ? 'Close' : 'Edit'}
                      </button>
                      <button type="button" onClick={() => moveStop(idx, idx - 1)} disabled={idx === 0} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #d0d5dd', borderRadius: 3, background: '#fff', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                      <button type="button" onClick={() => moveStop(idx, idx + 1)} disabled={idx === stops.length - 1} style={{ fontSize: 11, padding: '2px 6px', border: '1px solid #d0d5dd', borderRadius: 3, background: '#fff', cursor: idx === stops.length - 1 ? 'default' : 'pointer', opacity: idx === stops.length - 1 ? 0.4 : 1 }}>↓</button>
                      <button type="button" onClick={() => removeStop(idx)} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #e74c3c', borderRadius: 3, background: '#fff', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Expanded Stop Detail ── */}
      {stops.map((stop, idx) =>
        expandedStopId === stop.id ? (
          <StopDetailForm
            key={stop.id}
            stop={stop}
            onChange={(updated) => updateStop(idx, updated)}
            locations={locations}
            onClose={() => { setExpandedStopId(null); removeStop(idx); }}
            onAddAction={() => addStop(stop.type)}
            onSave={() => { checkComplete(stops); setExpandedStopId(null); }}
          />
        ) : null
      )}

      {stops.length === 0 && (
        <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: 13, padding: '12px 0' }}>No stops added yet. Use the buttons above to add pickup, delivery, or other stops.</div>
      )}

      {isComplete && (
        <div style={{ color: '#27ae60', fontWeight: 600, fontSize: 13, marginTop: 8 }}>✓ Stops section complete</div>
      )}
    </div>
  );
}
