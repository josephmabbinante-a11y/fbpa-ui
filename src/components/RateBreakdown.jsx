import React, { useState } from 'react';
import KPIWithTrend from './KPIWithTrend';
import LineChart from './LineChart';
import Button from './Button';
import { useTheme, themes } from '../contexts/ThemeContext';

const RateBreakdown = ({
  kpis,
  winProb,
  setWinProb,
  ruleRate,
  confidence,
  recommendedBand,
  onLogQuoteOutcome,
  predicting,
  loggingOutcome,
  actionMessage,
  outcomeAccepted,
  setOutcomeAccepted,
  outcomeBookedRate,
  setOutcomeBookedRate,
  outcomeTimeToCover,
  setOutcomeTimeToCover,
  outcomeErrors,
  sensitivity,
  setSensitivity,
  recommendedSellRate,
  deltaVsMarketPct,
  marginPerMile,
  riskBadge,
  onPushToLoadBoard,
  onSendToBidNetwork,
  onSendToCarrierList,
  onLockQuote,
  onSimulateMarginImpact,
  quoteLocked,
  confidenceMeta,
  driftWarning,
  onAutoFillOutcome,
  sendingToBidNetwork,
  rateIndexBreakdown,
  quoteTelemetry,
}) => {
  const { theme } = useTheme();
  const t = theme || {};
  const [showRateIndexBreakdown, setShowRateIndexBreakdown] = useState(false);

  const deltaPositive = Number(deltaVsMarketPct || 0) >= 0;
  const deltaColor = deltaPositive ? t.positive : t.negative;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
          padding: 16,
          display: 'grid',
          gap: 6,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 12, letterSpacing: 0.4, fontWeight: 700, color: t.textSecondary }}>RECOMMENDED SELL PRICE</div>
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>${Number(kpis.recommendedSell || 0).toLocaleString()}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: deltaColor }}>
          {deltaPositive ? '+' : ''}{Number(deltaVsMarketPct || 0).toFixed(1)}% {deltaPositive ? 'above' : 'below'} market
        </div>
        <div style={{ fontSize: 13, color: t.textSecondary }}>
          Win Prob: {Math.round(Number(winProb || 0))}% &nbsp; | &nbsp; Margin: ${Math.round(Number((marginPerMile || 0) * (kpis.predictedMarket / Math.max(Number(ruleRate || 0.01), 0.01)) || 0)).toLocaleString()}
        </div>
        <div style={{ marginTop: 6 }}>
          <button
            type="button"
            onClick={() => setShowRateIndexBreakdown((prev) => !prev)}
            style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, color: t.text, fontSize: 12, fontWeight: 700, padding: '6px 10px', cursor: 'pointer' }}
          >
            {showRateIndexBreakdown ? 'Hide Rate Index Breakdown' : 'View Rate Index Breakdown'}
          </button>
        </div>
        {showRateIndexBreakdown && rateIndexBreakdown ? (
          <div style={{ marginTop: 8, border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 10, textAlign: 'left', fontSize: 12, display: 'grid', gap: 4 }}>
            <div>Base Market RPM: {Number(rateIndexBreakdown.baseMarketRpm || 0).toFixed(2)}</div>
            <div>Lane Volatility Multiplier: {Number(rateIndexBreakdown.volatilityMultiplier || 1).toFixed(2)}</div>
            <div>Capacity Multiplier: {Number(rateIndexBreakdown.capacityMultiplier || 1).toFixed(2)}</div>
            <div>Fuel Index Adjustment: {Number(rateIndexBreakdown.fuelIndexAdjustment || 0) >= 0 ? '+' : ''}{Number(rateIndexBreakdown.fuelIndexAdjustment || 0).toFixed(2)}</div>
            <div>Risk Adjustment: {Number(rateIndexBreakdown.riskAdjustment || 0) >= 0 ? '+' : ''}{Number(rateIndexBreakdown.riskAdjustment || 0).toFixed(2)}</div>
            <div style={{ borderTop: `1px solid ${t.border}`, marginTop: 4, paddingTop: 6, fontWeight: 700 }}>
              Final Rate Index: {Number(rateIndexBreakdown.baseMarketRpm || 0).toFixed(2)} x {Number(rateIndexBreakdown.totalMultiplier || 1).toFixed(2)} = {Number(rateIndexBreakdown.finalRateIndex || 0).toFixed(2)} RPM
            </div>
          </div>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 12 }}>
        <KPIWithTrend label="Carrier Cost" value={kpis.carrierCost} format="currency" trendData={[2.2, 2.3, 2.35, 2.37]} trendColor={t.accent} />
        <KPIWithTrend label="Predicted Market" value={kpis.predictedMarket} format="currency" trendData={[3100, 3120, 3150, 3180]} trendColor={t.success} />
        <KPIWithTrend label="Recommended Sell" value={kpis.recommendedSell} format="currency" trendData={[3400, 3420, 3430, 3445]} trendColor={t.warning} />
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Price Sensitivity Curve</div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            Rule: {Number(ruleRate || 0).toFixed(4)} RPM &nbsp; | &nbsp; Sell: {Number(recommendedSellRate || 0).toFixed(4)} RPM
          </div>
        </div>
        <input
          type="range"
          min={-12}
          max={12}
          step={0.5}
          value={sensitivity}
          onChange={(e) => {
            const next = Number(e.target.value);
            setSensitivity(next);
            setWinProb(Math.max(5, Math.min(99, Math.round((confidence || 0.76) * 100 - (next * 1.8)))));
          }}
          style={{ width: '100%' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: t.textSecondary }}>
          <span>Conservative</span>
          <span>{sensitivity > 0 ? '+' : ''}{Number(sensitivity).toFixed(1)}%</span>
          <span>Aggressive</span>
        </div>
        <LineChart data={kpis.winProbHistory} label="Win Probability vs. Price" />
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div
          style={{
            border: `1px solid ${riskBadge.color}`,
            color: riskBadge.color,
            borderRadius: 999,
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 700,
            background: t.surface,
          }}
        >
          {riskBadge.icon} {riskBadge.label}
        </div>
        {quoteLocked ? (
          <div style={{ fontSize: 12, color: t.warning, fontWeight: 700 }}>Quote locked</div>
        ) : (
          <div style={{ fontSize: 12, color: t.textSecondary }}>Quote editable</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onLogQuoteOutcome} disabled={Boolean(loggingOutcome)}>
          {loggingOutcome ? 'Logging...' : 'Log Quote Outcome'}
        </Button>
        <Button variant="secondary" onClick={onPushToLoadBoard}>Push to Load Board</Button>
        <Button variant="secondary" onClick={onSendToBidNetwork} disabled={Boolean(sendingToBidNetwork)}>
          {sendingToBidNetwork ? 'Sending to Bid Network...' : 'Send to Bid Network'}
        </Button>
        <Button variant="secondary" onClick={onSendToCarrierList}>Send to Carrier List</Button>
        <Button variant="secondary" onClick={onLockQuote}>{quoteLocked ? 'Unlock Quote' : 'Lock Quote'}</Button>
        <Button variant="secondary" onClick={onSimulateMarginImpact}>Simulate Margin Impact</Button>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.bgAlt, padding: 8, display: 'grid', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>Outcome Fields</div>
          <button
            type="button"
            onClick={onAutoFillOutcome}
            disabled={quoteLocked}
            style={{
              border: `1px solid ${quoteLocked ? t.border : t.accent2}`,
              background: quoteLocked ? t.surface : t.bgAlt,
              color: quoteLocked ? t.textSecondary : t.text,
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 8px',
              cursor: quoteLocked ? 'not-allowed' : 'pointer',
            }}
          >
            Auto-fill
          </button>
        </div>
        {quoteLocked ? <div style={{ fontSize: 11, color: t.warning }}>Quote is locked. Unlock to edit fields.</div> : null}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
            <span>Accepted</span>
            <select
              value={outcomeAccepted}
              onChange={(event) => setOutcomeAccepted(event.target.value)}
              disabled={quoteLocked}
              style={{ minHeight: 32, borderRadius: 8, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '4px 8px' }}
            >
              <option value="unknown">Unknown</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
            <span>Booked Rate</span>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={outcomeBookedRate}
              onChange={(event) => setOutcomeBookedRate(event.target.value)}
              disabled={quoteLocked}
              placeholder="2.4800"
              style={{
                minHeight: 32,
                borderRadius: 8,
                border: outcomeErrors?.bookedRate ? `1.5px solid ${t.error}` : `1px solid ${t.border}`,
                background: t.surface,
                color: t.text,
                padding: '4px 8px'
              }}
            />
            {outcomeErrors?.bookedRate ? <span style={{ color: t.error, fontSize: 11 }}>{outcomeErrors.bookedRate}</span> : null}
          </label>
          <label style={{ display: 'grid', gap: 4, fontSize: 12 }}>
            <span>Time to Cover (min)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={outcomeTimeToCover}
              onChange={(event) => setOutcomeTimeToCover(event.target.value)}
              disabled={quoteLocked}
              placeholder="37"
              style={{
                minHeight: 32,
                borderRadius: 8,
                border: outcomeErrors?.timeToCover ? `1.5px solid ${t.error}` : `1px solid ${t.border}`,
                background: t.surface,
                color: t.text,
                padding: '4px 8px'
              }}
            />
            {outcomeErrors?.timeToCover ? <span style={{ color: t.error, fontSize: 11 }}>{outcomeErrors.timeToCover}</span> : null}
          </label>
        </div>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, background: t.surface, padding: 10, display: 'grid', gap: 4, fontSize: 12 }}>
        <div><strong>Confidence:</strong> {confidenceMeta.level} ({Number(confidenceMeta.value || 0).toFixed(2)})</div>
        <div><strong>Sample Size:</strong> {confidenceMeta.sampleSize} loads</div>
        <div><strong>Volatility:</strong> {confidenceMeta.volatilityLabel}</div>
        <div><strong>Engine:</strong> {confidenceMeta.engineVersion}</div>
        <div><strong>Data Updated:</strong> {confidenceMeta.dataFreshness}</div>
        <div><strong>Fuel Index:</strong> {confidenceMeta.fuelSource}</div>
        <div><strong>Market Source:</strong> {confidenceMeta.marketSource}</div>
        {driftWarning ? <div style={{ color: t.warning, fontWeight: 700 }}>⚠ {driftWarning}</div> : null}
        {recommendedBand ? (
          <div><strong>Recommended Band:</strong> {Number(recommendedBand.low || 0).toFixed(4)} - {Number(recommendedBand.high || 0).toFixed(4)} RPM</div>
        ) : null}
        {Array.isArray(quoteTelemetry) && quoteTelemetry.length > 0 ? (
          <div><strong>Telemetry:</strong> {quoteTelemetry[0]?.label || quoteTelemetry[0]?.event || 'Recent interaction recorded'}</div>
        ) : null}
        {actionMessage ? <div style={{ color: t.textSecondary }}>{actionMessage}</div> : null}
      </div>
    </div>
  );
};

export default RateBreakdown;
