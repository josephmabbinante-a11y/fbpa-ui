import React, { useState, useMemo } from 'react';

const labelStyle = { fontSize: 11, fontWeight: 600, color: '#667', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: 0.3 };
const inputStyle = { width: '100%', padding: '7px 10px', border: '1px solid #d0d5dd', borderRadius: 4, fontSize: 13, background: '#fff', boxSizing: 'border-box' };
const selectStyle = { ...inputStyle, appearance: 'auto' };
const sectionHeaderStyle = { fontSize: 12, fontWeight: 700, color: '#1a3a5c', borderBottom: '1px solid #e0e6ed', paddingBottom: 4, marginBottom: 10, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.5 };
const thStyle = { padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#667', textTransform: 'uppercase', letterSpacing: 0.3, borderBottom: '2px solid #e0e6ed', textAlign: 'left', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' };
const tdStyle = { padding: '6px 10px', fontSize: 13, borderBottom: '1px solid #f0f0f0', verticalAlign: 'middle' };
const toggleBtnStyle = (active) => ({
  padding: '5px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #2f80ed', borderRadius: 4, cursor: 'pointer',
  background: active ? '#2f80ed' : '#fff', color: active ? '#fff' : '#2f80ed', transition: 'all 0.15s',
});
const cardStyle = { background: '#f8fafd', border: '1px solid #d0d5dd', borderRadius: 6, padding: 14, marginBottom: 14 };
const statBoxStyle = { textAlign: 'center', padding: '8px 4px' };
const statLabelStyle = { fontSize: 11, color: '#667', fontWeight: 600, textTransform: 'uppercase' };
const warningBadgeStyle = { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 };

const RATE_TYPES = ['Flat Rate', 'Per Mile', 'Per CWT', 'Per Piece', 'Percentage', 'Hourly'];
const ACCESSORIAL_OPTIONS = ['Detention', 'Lumper', 'Fuel Surcharge', 'Layover', 'TONU', 'Inside Delivery', 'Liftgate', 'Residential', 'Reweigh', 'Reconsignment', 'Driver Assist', 'Hazmat Surcharge'];
const PAYMENT_TERM_OPTIONS = ['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Quick Pay', 'Upon Delivery', 'Upon Receipt of Invoice'];
const AR_STATUS_OPTIONS = ['Not Invoiced', 'Invoiced', 'Payment Pending', 'Partial Payment', 'Paid', 'Past Due', 'Disputed', 'Written Off'];
const AP_STATUS_OPTIONS = ['Not Submitted', 'Submitted', 'Approved', 'Partial Payment', 'Paid', 'On Hold', 'Disputed'];

let lineIdCounter = 1;
function newLineItem(type) {
  return { id: `line-${Date.now()}-${lineIdCounter++}`, company: '', description: '', rateType: 'Flat Rate', rate: '', quantity: 1, total: 0, type };
}

function calcLineTotal(item) {
  const r = Number(item.rate) || 0;
  const q = Number(item.quantity) || 1;
  return r * q;
}

function sortItems(items, sortKey, sortDir) {
  return [...items].sort((a, b) => {
    const av = String(a[sortKey] || '').toLowerCase();
    const bv = String(b[sortKey] || '').toLowerCase();
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });
}

function LineItemTable({ items, setItems, sortKey, sortDir, onSort, label }) {
  const sorted = sortItems(items, sortKey, sortDir);

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value, total: calcLineTotal({ ...it, [field]: value }) } : it));
  };

  const removeItem = (id) => setItems(prev => prev.filter(it => it.id !== id));

  const total = items.reduce((sum, it) => sum + calcLineTotal(it), 0);

  const SortTh = ({ col, children }) => (
    <th style={thStyle} onClick={() => onSort(col)}>
      {children} {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <SortTh col="company">Company</SortTh>
              <SortTh col="description">Description</SortTh>
              <SortTh col="rateType">Rate Type</SortTh>
              <th style={thStyle}>Rate</th>
              <th style={thStyle}>Qty</th>
              <th style={thStyle}>Total</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(item => (
              <tr key={item.id}>
                <td style={tdStyle}><input style={{ ...inputStyle, minWidth: 100 }} value={item.company} onChange={e => updateItem(item.id, 'company', e.target.value)} /></td>
                <td style={tdStyle}><input style={{ ...inputStyle, minWidth: 120 }} value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></td>
                <td style={tdStyle}>
                  <select style={{ ...selectStyle, minWidth: 100 }} value={item.rateType} onChange={e => updateItem(item.id, 'rateType', e.target.value)}>
                    {RATE_TYPES.map(rt => <option key={rt}>{rt}</option>)}
                  </select>
                </td>
                <td style={tdStyle}><input type="number" style={{ ...inputStyle, width: 80 }} value={item.rate} onChange={e => updateItem(item.id, 'rate', e.target.value)} /></td>
                <td style={tdStyle}><input type="number" style={{ ...inputStyle, width: 60 }} value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} /></td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>${calcLineTotal(item).toFixed(2)}</td>
                <td style={tdStyle}>
                  <button type="button" onClick={() => removeItem(item.id)} style={{ fontSize: 11, padding: '2px 8px', border: '1px solid #e74c3c', borderRadius: 3, background: '#fff', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}>✕</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={7} style={{ ...tdStyle, color: '#aaa', fontStyle: 'italic', textAlign: 'center' }}>No {label.toLowerCase()} items yet</td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ ...tdStyle, fontWeight: 700, textAlign: 'right', borderTop: '2px solid #e0e6ed' }}>Total {label}:</td>
              <td style={{ ...tdStyle, fontWeight: 700, borderTop: '2px solid #e0e6ed' }}>${total.toFixed(2)}</td>
              <td style={{ ...tdStyle, borderTop: '2px solid #e0e6ed' }}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function FinancialSection({ enabled, laneData, onComplete }) {
  const miles = laneData?.totalMiles || 0;
  const marketRate = laneData?.averageRate || 0;
  const [freightChargeTerms, setFreightChargeTerms] = useState('prepaid');
  const [targetRates, setTargetRates] = useState({ high: '', target: '', low: '' });
  const [incomeItems, setIncomeItems] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [incomeSort, setIncomeSort] = useState({ key: 'company', dir: 'asc' });
  const [expenseSort, setExpenseSort] = useState({ key: 'company', dir: 'asc' });
  const [accessorialType, setAccessorialType] = useState(ACCESSORIAL_OPTIONS[0]);
  const [accessorialTarget, setAccessorialTarget] = useState('income');
  const [isComplete, setIsComplete] = useState(false);

  // Customer Rate / Shipper Quote
  const [customerRateType, setCustomerRateType] = useState('Flat Rate');
  const [customerRate, setCustomerRate] = useState('');
  const [customerFuelSurcharge, setCustomerFuelSurcharge] = useState('');

  // Carrier Cost / Carrier Pay
  const [carrierRateType, setCarrierRateType] = useState('Flat Rate');
  const [carrierRate, setCarrierRate] = useState('');
  const [carrierFuelSurcharge, setCarrierFuelSurcharge] = useState('');

  // Advance & Quick Pay
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceMethod, setAdvanceMethod] = useState('ACH');
  const [quickPayEnabled, setQuickPayEnabled] = useState(false);
  const [quickPayPct, setQuickPayPct] = useState('3');

  // Payment Terms
  const [customerPaymentTerms, setCustomerPaymentTerms] = useState('Net 30');
  const [carrierPaymentTerms, setCarrierPaymentTerms] = useState('Net 30');
  const [billingRef, setBillingRef] = useState('');

  // AR / AP Tracking
  const [arStatus, setArStatus] = useState('Not Invoiced');
  const [arInvoiceNumber, setArInvoiceNumber] = useState('');
  const [arInvoiceDate, setArInvoiceDate] = useState('');
  const [arDueDate, setArDueDate] = useState('');
  const [arAmountPaid, setArAmountPaid] = useState('');
  const [apStatus, setApStatus] = useState('Not Submitted');
  const [apInvoiceNumber, setApInvoiceNumber] = useState('');
  const [apInvoiceDate, setApInvoiceDate] = useState('');
  const [apDueDate, setApDueDate] = useState('');
  const [apAmountPaid, setApAmountPaid] = useState('');

  // Computed — customer total
  const customerRateNum = Number(customerRate) || 0;
  const customerFuelNum = Number(customerFuelSurcharge) || 0;
  const customerTotal = customerRateType === 'Per Mile' ? (customerRateNum * miles) + customerFuelNum : customerRateNum + customerFuelNum;
  const customerRPM = miles ? (customerTotal / miles).toFixed(2) : '0.00';

  // Computed — carrier total
  const carrierRateNum = Number(carrierRate) || 0;
  const carrierFuelNum = Number(carrierFuelSurcharge) || 0;
  const carrierTotal = carrierRateType === 'Per Mile' ? (carrierRateNum * miles) + carrierFuelNum : carrierRateNum + carrierFuelNum;
  const carrierCPM = miles ? (carrierTotal / miles).toFixed(2) : '0.00';

  // Advance quick pay fee
  const advanceNum = Number(advanceAmount) || 0;
  const quickPayFee = quickPayEnabled ? (carrierTotal * (Number(quickPayPct) || 0) / 100) : 0;

  const totalIncome = useMemo(() => incomeItems.reduce((s, it) => s + calcLineTotal(it), 0) + customerTotal, [incomeItems, customerTotal]);
  const totalExpense = useMemo(() => expenseItems.reduce((s, it) => s + calcLineTotal(it), 0) + carrierTotal + quickPayFee, [expenseItems, carrierTotal, quickPayFee]);
  const grossMargin = totalIncome - totalExpense;
  const marginPct = totalIncome ? ((grossMargin / totalIncome) * 100).toFixed(1) : '0.0';
  const marginPerMile = miles ? (grossMargin / miles).toFixed(2) : '0.00';

  // Margin alerts
  const marginAlerts = useMemo(() => {
    const alerts = [];
    if (totalIncome > 0 && grossMargin < 0) alerts.push({ level: 'critical', text: 'Negative margin — load is losing money' });
    else if (totalIncome > 0 && Number(marginPct) < 10) alerts.push({ level: 'warning', text: `Low margin: ${marginPct}% (below 10% threshold)` });
    if (marketRate > 0 && carrierTotal > 0 && carrierTotal > marketRate * 1.15) alerts.push({ level: 'warning', text: `Carrier cost exceeds market rate by ${(((carrierTotal / marketRate) - 1) * 100).toFixed(0)}%` });
    if (advanceNum > 0 && carrierTotal > 0 && advanceNum > carrierTotal * 0.5) alerts.push({ level: 'warning', text: 'Advance exceeds 50% of carrier pay' });
    return alerts;
  }, [totalIncome, grossMargin, marginPct, marketRate, carrierTotal, advanceNum]);

  // AR balance
  const arBalance = customerTotal - (Number(arAmountPaid) || 0);
  const apBalance = carrierTotal - (Number(apAmountPaid) || 0);

  const addIncomeLine = () => setIncomeItems(prev => [...prev, newLineItem('income')]);
  const addExpenseLine = () => setExpenseItems(prev => [...prev, newLineItem('expense')]);

  const addAccessorial = () => {
    const item = newLineItem(accessorialTarget);
    item.description = accessorialType;
    if (accessorialTarget === 'income') setIncomeItems(prev => [...prev, item]);
    else setExpenseItems(prev => [...prev, item]);
  };

  const handleComplete = () => {
    setIsComplete(true);
    if (onComplete) onComplete();
  };

  if (!enabled) {
    return <div style={{ color: '#aaa', fontWeight: 600, fontSize: 13 }}>Financial section locked until stops and carrier are complete.</div>;
  }

  return (
    <div>
      {/* ── Margin Alerts ── */}
      {marginAlerts.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          {marginAlerts.map((a, i) => (
            <div key={i} style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 4, background: a.level === 'critical' ? '#ffeaea' : '#fff8e6', border: `1px solid ${a.level === 'critical' ? '#e74c3c' : '#f0ad4e'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ ...warningBadgeStyle, background: a.level === 'critical' ? '#e74c3c' : '#f0ad4e', color: '#fff' }}>
                {a.level === 'critical' ? '🚨 ALERT' : '⚠ WARNING'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: a.level === 'critical' ? '#c0392b' : '#856404' }}>{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Customer Rate & Carrier Cost — side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Customer Rate / Shipper Quote */}
        <div style={cardStyle}>
          <div style={{ ...sectionHeaderStyle, marginTop: 0, color: '#27ae60', borderColor: '#27ae60' }}>Customer Rate / Shipper Quote</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Rate Type</label>
              <select style={selectStyle} value={customerRateType} onChange={e => setCustomerRateType(e.target.value)}>
                {RATE_TYPES.map(rt => <option key={rt}>{rt}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{customerRateType === 'Per Mile' ? 'Rate / Mile ($)' : 'Rate ($)'}</label>
              <input type="number" style={inputStyle} value={customerRate} onChange={e => setCustomerRate(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Fuel Surcharge ($)</label>
              <input type="number" style={inputStyle} value={customerFuelSurcharge} onChange={e => setCustomerFuelSurcharge(e.target.value)} placeholder="0.00" />
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Customer Total</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#27ae60' }}>${customerTotal.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#667' }}>{customerRPM} RPM</div>
            </div>
          </div>
        </div>

        {/* Carrier Cost / Carrier Pay */}
        <div style={cardStyle}>
          <div style={{ ...sectionHeaderStyle, marginTop: 0, color: '#e74c3c', borderColor: '#e74c3c' }}>Carrier Cost / Carrier Pay</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Rate Type</label>
              <select style={selectStyle} value={carrierRateType} onChange={e => setCarrierRateType(e.target.value)}>
                {RATE_TYPES.map(rt => <option key={rt}>{rt}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{carrierRateType === 'Per Mile' ? 'Rate / Mile ($)' : 'Rate ($)'}</label>
              <input type="number" style={inputStyle} value={carrierRate} onChange={e => setCarrierRate(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label style={labelStyle}>Fuel Surcharge ($)</label>
              <input type="number" style={inputStyle} value={carrierFuelSurcharge} onChange={e => setCarrierFuelSurcharge(e.target.value)} placeholder="0.00" />
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Carrier Total</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#e74c3c' }}>${carrierTotal.toFixed(2)}</div>
              <div style={{ fontSize: 11, color: '#667' }}>{carrierCPM} CPM</div>
            </div>
          </div>
          {marketRate > 0 && (
            <div style={{ marginTop: 8, fontSize: 11, color: '#667', background: '#f0f6ff', padding: '4px 8px', borderRadius: 4 }}>
              Market avg: <b>${marketRate.toFixed(2)}</b> — Carrier vs market: <b style={{ color: carrierTotal <= marketRate ? '#27ae60' : '#e74c3c' }}>{carrierTotal > 0 ? ((carrierTotal / marketRate * 100) - 100).toFixed(1) : '0.0'}%</b>
            </div>
          )}
        </div>
      </div>

      {/* ── Freight Charge Terms & Payment Terms — side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={cardStyle}>
          <div style={{ ...sectionHeaderStyle, marginTop: 0 }}>Freight Charge Terms</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['prepaid', 'collect', 'third-party'].map(term => (
              <button key={term} type="button" style={toggleBtnStyle(freightChargeTerms === term)} onClick={() => setFreightChargeTerms(term)}>
                {term.charAt(0).toUpperCase() + term.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
          <div>
            <label style={labelStyle}>Billing Reference</label>
            <input style={inputStyle} value={billingRef} onChange={e => setBillingRef(e.target.value)} placeholder="PO#, Ref#, BOL#" />
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ ...sectionHeaderStyle, marginTop: 0 }}>Payment Terms</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Customer Terms</label>
              <select style={selectStyle} value={customerPaymentTerms} onChange={e => setCustomerPaymentTerms(e.target.value)}>
                {PAYMENT_TERM_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Carrier Terms</label>
              <select style={selectStyle} value={carrierPaymentTerms} onChange={e => setCarrierPaymentTerms(e.target.value)}>
                {PAYMENT_TERM_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Advance & Quick Pay ── */}
      <div style={cardStyle}>
        <div style={{ ...sectionHeaderStyle, marginTop: 0 }}>Advance & Quick Pay</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <label style={labelStyle}>Advance Amount ($)</label>
            <input type="number" style={inputStyle} value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label style={labelStyle}>Advance Method</label>
            <select style={selectStyle} value={advanceMethod} onChange={e => setAdvanceMethod(e.target.value)}>
              <option>ACH</option>
              <option>Wire</option>
              <option>Check</option>
              <option>Comchek</option>
              <option>T-Chek</option>
              <option>EFS</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Quick Pay</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <button type="button" style={toggleBtnStyle(quickPayEnabled)} onClick={() => setQuickPayEnabled(!quickPayEnabled)}>
                {quickPayEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Quick Pay Fee (%)</label>
            <input type="number" style={inputStyle} value={quickPayPct} onChange={e => setQuickPayPct(e.target.value)} disabled={!quickPayEnabled} placeholder="3" />
            {quickPayEnabled && quickPayFee > 0 && (
              <div style={{ fontSize: 11, color: '#667', marginTop: 2 }}>Fee: ${quickPayFee.toFixed(2)}</div>
            )}
          </div>
        </div>
        {advanceNum > 0 && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#1a3a5c', background: '#f0f6ff', padding: '6px 10px', borderRadius: 4 }}>
            Carrier net after advance: <b>${(carrierTotal - advanceNum - quickPayFee).toFixed(2)}</b>
            {quickPayEnabled && <span> (Quick Pay fee: ${quickPayFee.toFixed(2)})</span>}
          </div>
        )}
      </div>

      {/* ── Target Rate Matrix ── */}
      <div style={sectionHeaderStyle}>Target Rate</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>High ($)</label>
          <input type="number" style={inputStyle} value={targetRates.high} onChange={e => setTargetRates(p => ({ ...p, high: e.target.value }))} placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Target ($)</label>
          <input type="number" style={inputStyle} value={targetRates.target} onChange={e => setTargetRates(p => ({ ...p, target: e.target.value }))} placeholder="0.00" />
        </div>
        <div>
          <label style={labelStyle}>Low ($)</label>
          <input type="number" style={inputStyle} value={targetRates.low} onChange={e => setTargetRates(p => ({ ...p, low: e.target.value }))} placeholder="0.00" />
        </div>
      </div>

      {/* ── Income Line Items ── */}
      <div style={{ ...sectionHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Additional Income</span>
        <button type="button" onClick={addIncomeLine} style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #27ae60', borderRadius: 3, background: '#eafaf1', color: '#27ae60', cursor: 'pointer', fontWeight: 600 }}>+ Add Line</button>
      </div>
      <LineItemTable items={incomeItems} setItems={setIncomeItems} sortKey={incomeSort.key} sortDir={incomeSort.dir}
        onSort={col => setIncomeSort(p => ({ key: col, dir: p.key === col && p.dir === 'asc' ? 'desc' : 'asc' }))} label="Income" />

      {/* ── Expense Line Items ── */}
      <div style={{ ...sectionHeaderStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Additional Expenses</span>
        <button type="button" onClick={addExpenseLine} style={{ fontSize: 11, padding: '3px 10px', border: '1px solid #e74c3c', borderRadius: 3, background: '#fdf0ef', color: '#e74c3c', cursor: 'pointer', fontWeight: 600 }}>+ Add Line</button>
      </div>
      <LineItemTable items={expenseItems} setItems={setExpenseItems} sortKey={expenseSort.key} sortDir={expenseSort.dir}
        onSort={col => setExpenseSort(p => ({ key: col, dir: p.key === col && p.dir === 'asc' ? 'desc' : 'asc' }))} label="Expense" />

      {/* ── Accessorial Quick Add ── */}
      <div style={sectionHeaderStyle}>Accessorial Quick Add</div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <label style={labelStyle}>Accessorial</label>
          <select style={{ ...selectStyle, minWidth: 180 }} value={accessorialType} onChange={e => setAccessorialType(e.target.value)}>
            {ACCESSORIAL_OPTIONS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Apply To</label>
          <select style={{ ...selectStyle, minWidth: 100 }} value={accessorialTarget} onChange={e => setAccessorialTarget(e.target.value)}>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <button type="button" onClick={addAccessorial} style={{ padding: '7px 14px', fontWeight: 600, fontSize: 12, border: '1px solid #2f80ed', borderRadius: 4, background: '#eaf2ff', color: '#2f80ed', cursor: 'pointer' }}>
          Add Accessorial
        </button>
      </div>

      {/* ── AR / AP Tracking — side by side ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        {/* Accounts Receivable */}
        <div style={{ ...cardStyle, borderLeft: '3px solid #27ae60' }}>
          <div style={{ ...sectionHeaderStyle, marginTop: 0, color: '#27ae60', borderColor: '#27ae60' }}>Accounts Receivable (AR)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={arStatus} onChange={e => setArStatus(e.target.value)}>
                {AR_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Invoice #</label>
              <input style={inputStyle} value={arInvoiceNumber} onChange={e => setArInvoiceNumber(e.target.value)} placeholder="INV-" />
            </div>
            <div>
              <label style={labelStyle}>Invoice Date</label>
              <input type="date" style={inputStyle} value={arInvoiceDate} onChange={e => setArInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" style={inputStyle} value={arDueDate} onChange={e => setArDueDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Amount Paid ($)</label>
              <input type="number" style={inputStyle} value={arAmountPaid} onChange={e => setArAmountPaid(e.target.value)} placeholder="0.00" />
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Balance Due</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: arBalance > 0 ? '#e74c3c' : '#27ae60' }}>${arBalance.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Accounts Payable */}
        <div style={{ ...cardStyle, borderLeft: '3px solid #e74c3c' }}>
          <div style={{ ...sectionHeaderStyle, marginTop: 0, color: '#e74c3c', borderColor: '#e74c3c' }}>Accounts Payable (AP)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={selectStyle} value={apStatus} onChange={e => setApStatus(e.target.value)}>
                {AP_STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Invoice #</label>
              <input style={inputStyle} value={apInvoiceNumber} onChange={e => setApInvoiceNumber(e.target.value)} placeholder="CP-" />
            </div>
            <div>
              <label style={labelStyle}>Invoice Date</label>
              <input type="date" style={inputStyle} value={apInvoiceDate} onChange={e => setApInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Due Date</label>
              <input type="date" style={inputStyle} value={apDueDate} onChange={e => setApDueDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Amount Paid ($)</label>
              <input type="number" style={inputStyle} value={apAmountPaid} onChange={e => setApAmountPaid(e.target.value)} placeholder="0.00" />
            </div>
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Balance Owed</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: apBalance > 0 ? '#e74c3c' : '#27ae60' }}>${apBalance.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Financial Summary Panel ── */}
      <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #f8fafd 0%, #eaf6ff 100%)', border: '2px solid #2980b9' }}>
        <div style={{ ...sectionHeaderStyle, marginTop: 0, color: '#2980b9', borderColor: '#2980b9' }}>Financial Summary</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Customer Total</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#27ae60' }}>${customerTotal.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#667' }}>{customerRPM} RPM</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Addl Income</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#27ae60' }}>${incomeItems.reduce((s, it) => s + calcLineTotal(it), 0).toFixed(2)}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Total Income</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#27ae60' }}>${totalIncome.toFixed(2)}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Total Expense</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e74c3c' }}>${totalExpense.toFixed(2)}</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Gross Margin</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: grossMargin >= 0 ? '#27ae60' : '#e74c3c' }}>${grossMargin.toFixed(2)}</div>
            <div style={{ fontSize: 10, color: '#667' }}>{marginPct}%</div>
          </div>
          <div style={statBoxStyle}>
            <div style={statLabelStyle}>Margin / Mile</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a3a5c' }}>${marginPerMile}</div>
            <div style={{ fontSize: 10, color: '#667' }}>{miles} mi</div>
          </div>
        </div>

        {/* Margin progress bar */}
        <div style={{ marginTop: 10, background: '#e0e6ed', borderRadius: 4, height: 8, overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(Math.max(Number(marginPct), 0), 100)}%`,
            height: '100%',
            background: Number(marginPct) >= 15 ? '#27ae60' : Number(marginPct) >= 10 ? '#f0ad4e' : '#e74c3c',
            borderRadius: 4,
            transition: 'width 0.3s',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#667', marginTop: 2 }}>
          <span>0%</span>
          <span style={{ color: Number(marginPct) < 10 ? '#e74c3c' : '#667' }}>10% min</span>
          <span style={{ color: '#27ae60' }}>15%+ target</span>
          <span>50%</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        <button type="button" onClick={handleComplete} style={{ padding: '8px 18px', fontWeight: 600, background: '#2f80ed', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Mark Financials Complete
        </button>
        {isComplete && <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 13 }}>✓ Financial section complete</span>}
      </div>
    </div>
  );
}
