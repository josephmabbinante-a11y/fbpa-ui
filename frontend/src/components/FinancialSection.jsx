import React, { useState } from 'react';

export default function FinancialSection({ enabled, laneData, onComplete }) {
  // Derived values from laneData
  const miles = laneData?.totalMiles || 0;
  const suggestedSell = laneData?.suggestedSellRate || 0;
  const suggestedBuy = laneData?.suggestedBuyRate || 0;
  const [sellRate, setSellRate] = useState(suggestedSell);
  const [buyRate, setBuyRate] = useState(suggestedBuy);
  const [accessorials, setAccessorials] = useState([]);
  const grossMargin = sellRate - buyRate;
  const marginPct = sellRate ? ((sellRate - buyRate) / sellRate * 100).toFixed(1) : 0;
  const marginPerMile = miles ? (grossMargin / miles).toFixed(2) : 0;
  const [isComplete, setIsComplete] = useState(false);

  function handleComplete() {
    setIsComplete(true);
    if (onComplete) onComplete();
  }

  if (!enabled) {
    return <div style={{ color: '#aaa', fontWeight: 600 }}>Financial section locked until stops valid and carrier selected.</div>;
  }

  return (
    <>
      <div style={{ marginBottom: 16, background: '#f4f8ff', padding: 12, borderRadius: 6, color: '#234', fontSize: 15 }}>
        <strong>Financials Section</strong><br />
        Review and enter all financial details related to this load, including rates, accessorials, and margin calculations. Accurate financial data is critical for billing, profitability analysis, and customer transparency.
      </div>
      <form style={{ display: 'grid', gap: 12 }}>
      <label>
        Sell Rate (editable)
        <input type="number" value={sellRate} onChange={e => setSellRate(Number(e.target.value))} />
      </label>
      <label>
        Buy Rate (editable)
        <input type="number" value={buyRate} onChange={e => setBuyRate(Number(e.target.value))} />
      </label>
      <label>
        Accessorial Quick Add
        <input value={accessorials.join(', ')} onChange={e => setAccessorials(e.target.value.split(','))} placeholder="Comma separated" />
      </label>
      <div><strong>Gross Margin $:</strong> {grossMargin}</div>
      <div><strong>Margin %:</strong> {marginPct}%</div>
      <div><strong>Margin per Mile:</strong> {marginPerMile}</div>
      <button type="button" onClick={handleComplete} style={{ marginTop: 8, fontWeight: 600 }}>Mark Financials Complete</button>
      {isComplete && <div style={{ color: 'green', fontWeight: 600 }}>Financial section complete</div>}
    </form>
    </>
  );
}
