import React, { useEffect, useState } from 'react';
import { listLocations, createLocation } from '../src/api/locationsClient';

export default function StopsSection({ onComplete, setStopsData }) {
  const [locations, setLocations] = useState([]);
  const [selectedStops, setSelectedStops] = useState([]);
  const [newStop, setNewStop] = useState({ name: '', address: '', locationTypes: 'Pickup' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    listLocations().then((res) => {
      if (Array.isArray(res?.items)) setLocations(res.items);
      else setLocations([]);
      setLoading(false);
    });
  }, []);

  const handleSelect = (e) => {
    const value = e.target.value;
    if (!selectedStops.includes(value)) {
      const updated = [...selectedStops, value];
      setSelectedStops(updated);
      setStopsData && setStopsData(updated);
    }
  };

  const handleAddStop = async () => {
    if (!newStop.name || !newStop.address) {
      setError('Name and address required.');
      return;
    }
    setLoading(true);
    const res = await createLocation(newStop);
    if (res?.error) setError(res.error);
    else {
      setLocations([res.location, ...locations]);
      setNewStop({ name: '', address: '', locationTypes: 'Pickup' });
      setError('');
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Stops (Pickup/Delivery)</h3>
      {loading ? <div>Loading locations...</div> : null}
      <label>
        Select Existing Stop:
        <select onChange={handleSelect} value="">
          <option value="">-- Select --</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>{loc.name} - {loc.address}</option>
          ))}
        </select>
      </label>
      <div style={{ marginTop: 12, border: '1px solid #eee', padding: 12, borderRadius: 8 }}>
        <h4>Add New Stop</h4>
        <input
          placeholder="Name"
          value={newStop.name}
          onChange={e => setNewStop({ ...newStop, name: e.target.value })}
        />
        <input
          placeholder="Address"
          value={newStop.address}
          onChange={e => setNewStop({ ...newStop, address: e.target.value })}
          style={{ marginLeft: 8 }}
        />
        <select
          value={newStop.locationTypes}
          onChange={e => setNewStop({ ...newStop, locationTypes: e.target.value })}
          style={{ marginLeft: 8 }}
        >
          <option value="Pickup">Pickup</option>
          <option value="Delivery">Delivery</option>
        </select>
        <button style={{ marginLeft: 8 }} onClick={handleAddStop} disabled={loading}>Add Stop</button>
      </div>
      {selectedStops.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <strong>Selected Stops:</strong>
          <ul>
            {selectedStops.map((id) => {
              const loc = locations.find((l) => l.id === id);
              return <li key={id}>{loc ? `${loc.name} - ${loc.address}` : id}</li>;
            })}
          </ul>
        </div>
      )}
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button style={{ marginTop: 12 }} onClick={onComplete}>Mark Stops Complete</button>
    </div>
  );
}
