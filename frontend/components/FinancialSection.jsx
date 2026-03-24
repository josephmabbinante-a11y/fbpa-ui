import React, { useCallback, useEffect, useRef, useState } from 'react';
import { calculateRateLogic, createInvoice, estimateMileage } from '../src/api/client';


export default function FinancialSection({ load, setLoad, onComplete }) {
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    equipment: 'Van',
    laneType: 'Line Haul',
    miles: '',
    baseRate: '',
    fuelSurcharge: '',
    accessorials: '',
    customer: '',
    carrier: '',
    marginTarget: '15',
    overrideRate: ''
  });
  const [rateResult, setRateResult] = useState(null);
  const [invoiceType, setInvoiceType] = useState('AR');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mileageInfo, setMileageInfo] = useState(null);
  const mileageTimerRef = useRef(null);

  // Auto-estimate mileage when origin + destination are both filled
  const fetchMileage = useCallback(async (origin, destination) => {
    if (!origin || !destination) return;
    try {
      const res = await estimateMileage({ origin, destination, equipmentType: form.equipment });
      if (res && !res.error && res.miles > 0) {
        setMileageInfo(res);
        setForm((prev) => ({ ...prev, miles: String(res.miles) }));
        setLoad((prev) => ({
          ...prev,
          financials: { ...prev.financials, miles: String(res.miles) },
        }));
      }
    } catch {
      // Mileage estimation is best-effort
    }
  }, [form.equipment, setLoad]);

  // Debounce mileage lookup when origin/destination change
  useEffect(() => {
    if (mileageTimerRef.current) clearTimeout(mileageTimerRef.current);
    if (form.origin.length >= 3 && form.destination.length >= 3) {
      mileageTimerRef.current = setTimeout(() => fetchMileage(form.origin, form.destination), 600);
    }
    return () => { if (mileageTimerRef.current) clearTimeout(mileageTimerRef.current); };
  }, [form.origin, form.destination, fetchMileage]);

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    // Update load.financials as user types
    setLoad(prev => ({
      ...prev,
      financials: {
        ...prev.financials,
        [e.target.name]: e.target.value
      }
    }));
  };

  const handleRate = async () => {
    setLoading(true);
    setError('');
    setRateResult(null);
    const payload = {
      origin: form.origin,
      destination: form.destination,
      equipment: form.equipment,
      laneType: form.laneType,
      mileage: Number(form.miles),
      baseRate: Number(form.baseRate),
      fuelSurcharge: Number(form.fuelSurcharge),
      accessorials: Number(form.accessorials),
      marginTarget: Number(form.marginTarget),
      overrideRate: form.overrideRate ? Number(form.overrideRate) : undefined,
    };
    const res = await calculateRateLogic(payload);
    if (res?.error) setError(res.error);
    else setRateResult(res);
    setLoading(false);
  };

  const handleInvoice = async () => {
    setLoading(true);
    setInvoiceStatus('');
    setError('');
    const payload = {
      type: invoiceType,
      amount: Number(invoiceAmount),
      customer: form.customer,
      carrier: form.carrier,
    };
    const res = await createInvoice(payload);
    if (res?.error) setError(res.error);
    else setInvoiceStatus('Invoice created!');
    setLoading(false);
  };

  return (
    <div>
      <h3>Financials</h3>
      <div style={{ marginBottom: 12 }}>
        <label>
          Origin: <input name="origin" value={form.origin} onChange={handleInput} />
        </label>
        <label style={{ marginLeft: 8 }}>
          Destination: <input name="destination" value={form.destination} onChange={handleInput} />
        </label>
        {mileageInfo && (
          <span style={{ marginLeft: 12, fontSize: 13, color: '#555' }}>
            ~{mileageInfo.miles} mi
            {mileageInfo.durationMinutes ? ` (${Math.round(mileageInfo.durationMinutes / 60)}h ${mileageInfo.durationMinutes % 60}m)` : ''}
            <span style={{ marginLeft: 4, fontSize: 11, opacity: 0.7 }}>
              [{mileageInfo.method}, {Math.round((mileageInfo.confidence || 0) * 100)}%]
            </span>
          </span>
        )}
        {/* Equipment, lane type, miles, etc. now belong in Load Details section above */}
        <label style={{ marginLeft: 8 }}>
          Base Rate: <input name="baseRate" value={form.baseRate} onChange={handleInput} type="number" />
        </label>
        <label style={{ marginLeft: 8 }}>
          Fuel Surcharge: <input name="fuelSurcharge" value={form.fuelSurcharge} onChange={handleInput} type="number" />
        </label>
        <label style={{ marginLeft: 8 }}>
          Accessorials: <input name="accessorials" value={form.accessorials} onChange={handleInput} type="number" />
        </label>
        <label style={{ marginLeft: 8 }}>
          Margin Target (%): <input name="marginTarget" value={form.marginTarget} onChange={handleInput} type="number" min="0" max="100" />
        </label>
        <label style={{ marginLeft: 8 }}>
          Override Rate ($): <input name="overrideRate" value={form.overrideRate} onChange={handleInput} type="number" min="0" />
        </label>
        <button style={{ marginLeft: 8 }} onClick={handleRate} disabled={loading}>Calculate Rate</button>
      </div>
      {rateResult && (
        <div style={{ marginBottom: 12, color: 'green', background: '#f6fff6', padding: 10, borderRadius: 8 }}>
          <strong>Rate Result:</strong> {typeof rateResult.quote !== 'undefined' ? `$${rateResult.quote}` : JSON.stringify(rateResult)}
          {rateResult.confidence && <span style={{ marginLeft: 8 }}>(Confidence: {rateResult.confidence}%)</span>}
          {rateResult.marketPosition && <span style={{ marginLeft: 8 }}>Market: {rateResult.marketPosition}</span>}
          {rateResult.rule_rate && <div>Rule Rate: ${rateResult.rule_rate}</div>}
          {rateResult.ml_rate && <div>ML Rate: ${rateResult.ml_rate}</div>}
          {rateResult.base_rate && <div>Base Rate: ${rateResult.base_rate}</div>}
          {rateResult.margin && <div>Margin: {rateResult.margin}%</div>}
          {rateResult.adjustments && (
            <div style={{ marginTop: 6 }}>
              <b>Adjustments:</b>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {Object.entries(rateResult.adjustments).map(([k, v]) => (
                  <li key={k}>{k}: {v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <label>
          Invoice Type:
          <select value={invoiceType} onChange={e => setInvoiceType(e.target.value)} style={{ marginLeft: 8 }}>
            <option value="AR">Accounts Receivable</option>
            <option value="AP">Accounts Payable</option>
          </select>
        </label>
        <label style={{ marginLeft: 8 }}>
          Amount: <input value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} type="number" />
        </label>
        <label style={{ marginLeft: 8 }}>
          Customer: <input name="customer" value={form.customer} onChange={handleInput} />
        </label>
        <label style={{ marginLeft: 8 }}>
          Carrier: <input name="carrier" value={form.carrier} onChange={handleInput} />
        </label>
        <button style={{ marginLeft: 8 }} onClick={handleInvoice} disabled={loading}>Create Invoice</button>
      </div>
      {invoiceStatus && <div style={{ color: 'green', marginBottom: 8 }}>{invoiceStatus}</div>}
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      <button onClick={() => { setLoad(prev => ({ ...prev, financials: { ...prev.financials, ...form } })); onComplete(); }}>Mark Financials Complete</button>
    </div>
  );
}
