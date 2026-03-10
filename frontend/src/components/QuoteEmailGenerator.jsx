import { useMemo, useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default function QuoteEmailGenerator() {
  const { theme } = useTheme();
  const t = theme || {};

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [origin, setOrigin] = useState('Chicago, IL');
  const [destination, setDestination] = useState('Dallas, TX');
  const [equipment, setEquipment] = useState('Dry Van');
  const [miles, setMiles] = useState('925');
  const [marketRate, setMarketRate] = useState('2450');
  const [targetMarginPct, setTargetMarginPct] = useState('9');
  const [fuelSurcharge, setFuelSurcharge] = useState('180');
  const [leadTime, setLeadTime] = useState('24');
  const [notes, setNotes] = useState('Rate includes standard pickup and delivery window.');
  const [copyStatus, setCopyStatus] = useState('');

  const computed = useMemo(() => {
    const parsedMiles = Math.max(1, Number(miles) || 0);
    const parsedMarket = Math.max(0, Number(marketRate) || 0);
    const parsedMargin = Number(targetMarginPct) || 0;
    const parsedFuel = Math.max(0, Number(fuelSurcharge) || 0);

    const quoteTotal = Math.round((parsedMarket * (1 + (parsedMargin / 100))) + parsedFuel);
    const quoteRatePerMile = parsedMiles > 0 ? quoteTotal / parsedMiles : 0;
    const marketPerMile = parsedMiles > 0 ? parsedMarket / parsedMiles : 0;
    const deltaVsMarket = parsedMarket > 0 ? (quoteTotal - parsedMarket) / parsedMarket : 0;

    const trendLabel = deltaVsMarket > 0.1
      ? 'Market is tightening and coverage risk is elevated.'
      : deltaVsMarket < -0.05
        ? 'Market is soft with room to stay aggressive on price.'
        : 'Market is stable with normal pricing pressure.';

    const recommendation = deltaVsMarket > 0.1
      ? 'Recommend proactive booking to lock capacity.'
      : 'Recommend standard tender cycle with preferred carrier outreach.';

    return {
      parsedMiles,
      parsedMarket,
      parsedMargin,
      parsedFuel,
      quoteTotal,
      quoteRatePerMile,
      marketPerMile,
      deltaVsMarket,
      trendLabel,
      recommendation,
    };
  }, [fuelSurcharge, marketRate, miles, targetMarginPct]);

  const subject = useMemo(() => {
    return `Pricing Quote: ${origin} to ${destination}`;
  }, [destination, origin]);

  const emailBody = useMemo(() => {
    const salutation = customerName ? `Hi ${customerName},` : 'Hi,';
    const leadHours = Math.max(1, Number(leadTime) || 24);

    return [
      salutation,
      '',
      `Here is your pricing quote for ${origin} to ${destination} (${equipment}).`,
      '',
      `Quote Total: ${usdFormatter.format(computed.quoteTotal)}`,
      `Quote Rate/Mile: ${usdFormatter.format(computed.quoteRatePerMile)}`,
      `Market Benchmark: ${usdFormatter.format(computed.parsedMarket)} (${usdFormatter.format(computed.marketPerMile)}/mile)`,
      `Delta vs Market: ${percentFormatter.format(computed.deltaVsMarket)}`,
      '',
      'Market Analysis:',
      `- ${computed.trendLabel}`,
      `- ${computed.recommendation}`,
      `- Capacity lead time assumption: ${leadHours} hours`,
      '',
      notes || 'No additional notes.',
      '',
      'Please let us know if you would like us to secure coverage at this price.',
      '',
      'Thank you,',
      'FBPA Pricing Team',
    ].join('\n');
  }, [computed.deltaVsMarket, computed.marketPerMile, computed.parsedMarket, computed.quoteRatePerMile, computed.quoteTotal, computed.recommendation, computed.trendLabel, customerName, destination, equipment, leadTime, notes, origin]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${emailBody}`);
      setCopyStatus('Copied email draft to clipboard.');
      window.setTimeout(() => setCopyStatus(''), 1800);
    } catch {
      setCopyStatus('Clipboard blocked. Use Open Email Draft instead.');
      window.setTimeout(() => setCopyStatus(''), 2200);
    }
  };

  const mailToHref = `mailto:${encodeURIComponent(customerEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  const cardStyle = {
    border: `1px solid ${t.border}`,
    borderRadius: 10,
    background: t.surface,
    padding: 14,
    display: 'grid',
    gap: 12,
  };

  const inputStyle = {
    minHeight: 34,
    borderRadius: 8,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    padding: '7px 10px',
    fontSize: 12,
    outline: 'none',
  };

  const labelStyle = {
    fontSize: 11,
    color: t.textSecondary,
    fontWeight: 700,
    letterSpacing: 0.2,
  };

  return (
    <section style={cardStyle}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Quote Email Generator</div>
        <div style={{ fontSize: 12, color: t.textSecondary }}>
          Auto-generates a customer email with pricing quote and market analysis.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Customer Name</span>
          <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} style={inputStyle} placeholder="Acme Logistics" />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Customer Email</span>
          <input value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} style={inputStyle} placeholder="ops@customer.com" />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Origin</span>
          <input value={origin} onChange={(event) => setOrigin(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Destination</span>
          <input value={destination} onChange={(event) => setDestination(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Equipment</span>
          <input value={equipment} onChange={(event) => setEquipment(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Miles</span>
          <input type="number" min="1" value={miles} onChange={(event) => setMiles(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Market Rate ($)</span>
          <input type="number" min="0" value={marketRate} onChange={(event) => setMarketRate(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Target Margin (%)</span>
          <input type="number" value={targetMarginPct} onChange={(event) => setTargetMarginPct(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Fuel Surcharge ($)</span>
          <input type="number" min="0" value={fuelSurcharge} onChange={(event) => setFuelSurcharge(event.target.value)} style={inputStyle} />
        </label>
        <label style={{ display: 'grid', gap: 5 }}>
          <span style={labelStyle}>Lead Time (hrs)</span>
          <input type="number" min="1" value={leadTime} onChange={(event) => setLeadTime(event.target.value)} style={inputStyle} />
        </label>
      </div>

      <label style={{ display: 'grid', gap: 5 }}>
        <span style={labelStyle}>Extra Notes</span>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={3}
          style={{ ...inputStyle, minHeight: 78, resize: 'vertical' }}
          placeholder="Any service notes, exclusions, or assumptions"
        />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, fontSize: 12 }}>
        <div style={{ ...cardStyle, padding: 10, gap: 4 }}>
          <span style={labelStyle}>Quoted Total</span>
          <strong>{usdFormatter.format(computed.quoteTotal)}</strong>
        </div>
        <div style={{ ...cardStyle, padding: 10, gap: 4 }}>
          <span style={labelStyle}>Rate / Mile</span>
          <strong>{usdFormatter.format(computed.quoteRatePerMile)}</strong>
        </div>
        <div style={{ ...cardStyle, padding: 10, gap: 4 }}>
          <span style={labelStyle}>Delta vs Market</span>
          <strong>{percentFormatter.format(computed.deltaVsMarket)}</strong>
        </div>
      </div>

      <label style={{ display: 'grid', gap: 5 }}>
        <span style={labelStyle}>Email Draft Preview</span>
        <textarea
          readOnly
          value={`Subject: ${subject}\n\n${emailBody}`}
          rows={16}
          style={{ ...inputStyle, minHeight: 260, resize: 'vertical' }}
        />
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <a
          href={mailToHref}
          style={{
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            background: t.bgAlt,
            color: t.text,
            textDecoration: 'none',
            fontSize: 12,
            fontWeight: 700,
            padding: '7px 12px',
          }}
        >
          Open Email Draft
        </a>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            background: t.surfaceStrong,
            color: t.text,
            fontSize: 12,
            fontWeight: 700,
            padding: '7px 12px',
            cursor: 'pointer',
          }}
        >
          Copy Email Text
        </button>
        {copyStatus ? <span style={{ fontSize: 12, color: t.textSecondary }}>{copyStatus}</span> : null}
      </div>
    </section>
  );
}