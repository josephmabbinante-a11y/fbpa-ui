import React, { useState } from 'react';
import { updateLoad } from '../src/api/loadsClient';
import { uploadInvoiceImage } from '../src/api/client';

export default function LaneIntelligencePanel({ load, setLoad, onComplete }) {
  const [delivered, setDelivered] = useState(false);
  const [podFile, setPodFile] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDelivery = async () => {
    if (!load.id) {
      setError('Missing load ID');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('');
    const res = await updateLoad(load.id, { status: 'DELIVERED', delivered: true });
    if (res?.error) setError(res.error);
    else {
      setDelivered(true);
      setStatus('Delivery marked complete!');
      setLoad(prev => ({ ...prev, status: 'DELIVERED' }));
    }
    setLoading(false);
  };

  const handlePodUpload = (e) => {
    setPodFile(e.target.files[0]);
    setStatus('');
    setError('');
  };

  // Actual upload logic for POD
  const handlePodSubmit = async () => {
    if (!podFile) {
      setError('Select a file to upload.');
      return;
    }
    if (!load.id) {
      setError('Missing load ID');
      return;
    }
    setLoading(true);
    setError('');
    setStatus('');
    const res = await uploadInvoiceImage({ file: podFile, invoiceId: load.id, notes: 'POD' });
    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }
    setStatus('POD uploaded!');
    setPodFile(null);
    // Optionally mark as delivered after POD upload
    const deliveredRes = await updateLoad(load.id, { status: 'DELIVERED', delivered: true, pod_received: true });
    if (deliveredRes?.error) setError(deliveredRes.error);
    else {
      setDelivered(true);
      setLoad(prev => ({ ...prev, status: 'DELIVERED', pod_received: true }));
    }
    setLoading(false);
  };

  return (
    <div>
      <h3>Lane Intelligence & Delivery</h3>
      {/* Lane intelligence UI could go here */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={handleDelivery} disabled={loading || delivered}>
          {delivered ? 'Delivered' : 'Mark as Delivered'}
        </button>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>
          Upload Proof of Delivery (POD):
          <input type="file" onChange={handlePodUpload} style={{ marginLeft: 8 }} />
        </label>
        <button style={{ marginLeft: 8 }} onClick={handlePodSubmit} disabled={!podFile}>Upload POD</button>
      </div>
      {status && <div style={{ color: 'green', marginBottom: 8 }}>{status}</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <button onClick={() => { setLoad(prev => ({ ...prev, lane: { ...prev.lane, miles: prev.lane?.miles || 0 } })); onComplete(); }}>Mark Lane Intelligence Complete</button>
    </div>
  );
}
