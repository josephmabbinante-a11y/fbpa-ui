import React, { useMemo } from 'react';
import { formatLoadStatusLabel, normalizeLoadStatus } from '../../../utils/loadLifecycle';

const FREIGHT_CATEGORY_META = {
  adhoc: { label: 'Ad-Hoc', color: 'var(--text-secondary)', bg: 'var(--bg-alt)' },
  contracted: { label: 'Contracted', color: 'var(--accent)', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)' },
  spot_rate: { label: 'Spot Rate', color: 'var(--warning)', bg: 'color-mix(in srgb, var(--warning) 12%, transparent)' },
  capacity: { label: 'Capacity', color: 'var(--success)', bg: 'color-mix(in srgb, var(--success) 12%, transparent)' },
};

function stopRowClick(event) {
  event.stopPropagation();
}

function renderProfileLink(label, href) {
  if (!href) return label;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={stopRowClick}
      style={{ color: 'var(--accent)', textDecoration: 'underline' }}
      title="Open profile in a new tab"
    >
      {label}
    </a>
  );
}

function formatCurrency(amount) {
  const n = Number(amount || 0);
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function statusTone(status) {
  if (status === 'PRE_DISPATCH') return 'var(--accent)';
  if (status === 'IN_TRANSIT') return 'var(--success)';
  if (status === 'TENDERED') return 'var(--warning)';
  if (status === 'EXCEPTION') return 'var(--error)';
  if (status === 'CANCELLED') return 'var(--text-secondary)';
  if (status === 'DELIVERED') return 'var(--text-secondary)';
  return 'var(--text-secondary)';
}

function statusIcon(status) {
  if (status === 'IN_TRANSIT') return '🟢';
  if (status === 'PRE_DISPATCH') return '🔵';
  if (status === 'TENDERED') return '🟠';
  if (status === 'EXCEPTION') return '🔴';
  if (status === 'CANCELLED') return '⚫';
  return '⚪';
}

function computePickupCountdownMinutes(value) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  if (Number.isNaN(ts)) return null;
  return Math.max(0, Math.round((ts - Date.now()) / 60000));
}

function formatCountdown(minutes) {
  if (minutes === null) return '—';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

export default function LoadRow({ load, selected, onSelect, onContextMenuAction, onQuickAction }) {
  const expanded = Boolean(selected);
  const normalizedStatus = normalizeLoadStatus(load.status);

  const countdownMinutes = useMemo(() => computePickupCountdownMinutes(load.pickupAt), [load.pickupAt]);
  const urgentUncovered = normalizedStatus === 'TENDERED' && countdownMinutes !== null && countdownMinutes < 240;
  const marketRate = Number(load.revenue || 0) + 650;
  const opportunityGap = marketRate - Number(load.revenue || 0);
  const marginBelowTarget = Number(load.marginPct || 0) < Number(load.targetMarginPct || 12);
  const revenuePerMile = Number(load.miles) ? Number(load.revenue || 0) / Number(load.miles) : 0;
  const costPerMile = Number(load.miles) ? Number(load.carrierCost || 0) / Number(load.miles) : 0;
  const customerId = String(load?.customer?.id || '').trim();
  const carrierId = String(load?.carrier?.id || '').trim();
  const customerHref = customerId ? `/customers/${encodeURIComponent(customerId)}` : '';
  const carrierHref = carrierId
    ? `/carriers/profile/${encodeURIComponent(carrierId)}`
    : (String(load?.carrier?.name || '').trim() ? `/carriers/profile/${encodeURIComponent(String(load.carrier.name).trim())}` : '');

  return (
    <>
      <tr
        onClick={() => {
          onSelect?.(load);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          onContextMenuAction?.({
            load,
            x: event.clientX,
            y: event.clientY,
          });
        }}
        style={{
          background: selected ? 'rgba(var(--glow),0.12)' : 'transparent',
          boxShadow: urgentUncovered ? 'inset 0 0 0 1px rgba(255, 130, 72, 0.55), inset 0 0 20px rgba(255, 162, 72, 0.18)' : 'none',
          cursor: 'pointer',
          height: 36,
        }}
        title="Click row to expand • Left click previews • Right click for shortcuts"
      >
        <td style={{ padding: '0 10px' }}>
          <div style={{ fontWeight: 700, fontSize: 12 }}>
            <a
              href={`/loadcenter/command-center/${encodeURIComponent(load.id)}`}
              onClick={stopRowClick}
              style={{ color: 'var(--accent)', textDecoration: 'underline' }}
              title="Open in Load Command Center"
            >
              {load.id || '—'}
            </a>
          </div>
          {load.referenceNumber && <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Ref: {load.referenceNumber}</div>}
        </td>
        <td style={{ padding: '0 10px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: statusTone(normalizedStatus),
              color: 'var(--bg)',
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: 0.2,
            }}
          >
            <span>{statusIcon(normalizedStatus)}</span>
            <span>{formatLoadStatusLabel(normalizedStatus)}</span>
          </span>
        </td>
        <td style={{ padding: '0 10px' }}>
          {(() => {
            const cat = FREIGHT_CATEGORY_META[load.freightCategory] || FREIGHT_CATEGORY_META.adhoc;
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', border: `1px solid ${cat.color}`, borderRadius: 999, padding: '2px 8px', background: cat.bg, color: cat.color, fontSize: 9, fontWeight: 700, letterSpacing: 0.2 }}>
                {cat.label}
              </span>
            );
          })()}
        </td>
        <td style={{ padding: '0 10px' }}>
          <div>{customerHref ? renderProfileLink(load.customer?.name || '—', customerHref) : (load.customer?.name || '—')}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {customerId ? renderProfileLink(customerId, customerHref) : 'No customer ID'}
          </div>
        </td>
        <td style={{ padding: '0 10px' }}>
          <div>{carrierHref ? renderProfileLink(load.carrier?.name || '—', carrierHref) : (load.carrier?.name || '—')}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {carrierId ? renderProfileLink(carrierId, carrierHref) : (carrierHref ? renderProfileLink('Open profile', carrierHref) : 'No carrier ID')}
          </div>
        </td>
        <td style={{ padding: '0 10px' }}>{load.origin?.locationId ? <a href={`/locations`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/locations'; }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</a> : <>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</>}</td>
        <td style={{ padding: '0 10px' }}>{load.destination?.locationId ? <a href={`/locations`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/locations'; }} style={{ color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer' }}>{load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</a> : <>{load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</>}</td>
        <td style={{ padding: '0 10px', textAlign: 'right' }}>{Number(load.miles || 0).toLocaleString()}</td>
        <td style={{ padding: '0 10px', textAlign: 'right' }}>{formatCurrency(load.revenue)}</td>
        <td style={{ padding: '0 10px', textAlign: 'right' }}>{formatCurrency(load.carrierCost)}</td>
        <td style={{ padding: '0 10px', textAlign: 'right' }}>{formatCurrency(load.margin)}</td>
        <td style={{ padding: '0 10px', textAlign: 'right' }}>{Number(load.marginPct || 0).toFixed(1)}%</td>
      </tr>

      {expanded && (
        <tr style={{ background: 'var(--surface)' }}>
          <td colSpan={12} style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr 1fr', gap: 16 }}>

              {/* ── Route & Schedule ── */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontSize: 13 }}>Route & Schedule</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>Origin</div>
                    <div style={{ fontWeight: 600 }}>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}{load.origin?.zip ? ` ${load.origin.zip}` : ''}</div>
                    {load.origin?.address && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{load.origin.address}</div>}
                    {load.origin?.facility && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{load.origin.facility}</div>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.3 }}>Destination</div>
                    <div style={{ fontWeight: 600 }}>{load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}{load.destination?.zip ? ` ${load.destination.zip}` : ''}</div>
                    {load.destination?.address && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{load.destination.address}</div>}
                    {load.destination?.facility && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{load.destination.facility}</div>}
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Pickup</div>
                        <div>{load.pickupAt ? new Date(load.pickupAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
                        {load.pickupAt && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{new Date(load.pickupAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Delivery</div>
                        <div>{load.deliveryAt ? new Date(load.deliveryAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</div>
                        {load.deliveryAt && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{new Date(load.deliveryAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Miles:</span> <strong>{Number(load.miles || 0).toLocaleString()}</strong></div>
                    {load.equipment && <div><span style={{ color: 'var(--text-secondary)' }}>Equip:</span> <strong>{load.equipment}</strong></div>}
                    {load.weight && <div><span style={{ color: 'var(--text-secondary)' }}>Wt:</span> <strong>{Number(load.weight).toLocaleString()} lbs</strong></div>}
                  </div>
                  {countdownMinutes !== null && (
                    <div style={{ background: countdownMinutes < 240 ? 'color-mix(in srgb, var(--error) 12%, transparent)' : 'color-mix(in srgb, var(--accent) 12%, transparent)', padding: '4px 8px', borderRadius: 4, fontWeight: 600, color: countdownMinutes < 240 ? 'var(--error)' : 'var(--accent)' }}>
                      ⏳ Pickup in {formatCountdown(countdownMinutes)}
                    </div>
                  )}
                  {load.stops?.length > 2 && (
                    <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{load.stops.length - 2} intermediate stop{load.stops.length - 2 > 1 ? 's' : ''}</div>
                  )}
                </div>
              </div>

              {/* ── Margin Breakdown ── */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontSize: 13 }}>Margin Breakdown</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ background: 'color-mix(in srgb, var(--success) 8%, transparent)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Revenue</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(load.revenue)}</div>
                    </div>
                    <div style={{ background: 'color-mix(in srgb, var(--error) 8%, transparent)', padding: '8px', borderRadius: 6, textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Carrier Cost</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--error)' }}>{formatCurrency(load.carrierCost)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Revenue/Mile</div>
                      <div style={{ fontWeight: 600 }}>${revenuePerMile.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Cost/Mile</div>
                      <div style={{ fontWeight: 600 }}>${costPerMile.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Gross Margin</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: Number(load.margin || 0) >= 0 ? 'var(--success)' : 'var(--error)' }}>{formatCurrency(load.margin)}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Margin %</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: marginBelowTarget ? 'var(--error)' : 'var(--success)' }}>{Number(load.marginPct || 0).toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ background: marginBelowTarget ? 'color-mix(in srgb, var(--error) 10%, transparent)' : 'color-mix(in srgb, var(--success) 10%, transparent)', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{marginBelowTarget ? '📉' : '✅'}</span>
                    <span style={{ fontWeight: 600, color: marginBelowTarget ? 'var(--error)' : 'var(--success)' }}>
                      {marginBelowTarget ? `Below ${Number(load.targetMarginPct || 12)}% target` : 'Healthy margin'}
                    </span>
                  </div>
                  {load.marginPerMile != null && (
                    <div><span style={{ color: 'var(--text-secondary)' }}>Margin/Mile:</span> <strong>${Number(load.marginPerMile || ((Number(load.margin || 0)) / Math.max(Number(load.miles || 1), 1))).toFixed(2)}</strong></div>
                  )}
                  {load.freightChargeTerms && <div><span style={{ color: 'var(--text-secondary)' }}>Terms:</span> {load.freightChargeTerms}</div>}
                </div>
              </div>

              {/* ── Carrier & Bids ── */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontSize: 13 }}>Carrier & Bids</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {/* Assigned carrier */}
                  {load.carrier?.name && (
                    <div style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', padding: '8px', borderRadius: 6, borderLeft: '3px solid var(--accent)' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Assigned Carrier</div>
                      <div style={{ fontWeight: 700 }}>{load.carrier.name}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                        {load.carrier.mcNumber && <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>MC# {load.carrier.mcNumber}</span>}
                        {load.carrier.usdotNumber && <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>DOT# {load.carrier.usdotNumber}</span>}
                      </div>
                      {load.carrier.phone && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{load.carrier.phone}</div>}
                      {carrierHref && <div style={{ marginTop: 2 }}>{renderProfileLink('View Profile →', carrierHref)}</div>}
                    </div>
                  )}
                  {!load.carrier?.name && (
                    <div style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', padding: '6px 8px', borderRadius: 4, color: 'var(--warning)', fontWeight: 600, fontSize: 11 }}>
                      ⚠ No carrier assigned
                    </div>
                  )}

                  {/* Driver info */}
                  {load.driver?.name && (
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Driver</div>
                      <div>{load.driver.name}{load.driver.phone ? ` • ${load.driver.phone}` : ''}</div>
                    </div>
                  )}

                  {/* Bids */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Carrier Bids</div>
                    {Array.isArray(load.bids) && load.bids.length > 0 ? (
                      load.bids.map((bid, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: i < load.bids.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          <span style={{ fontWeight: 600 }}>{bid.carrierName || bid.name || `Carrier ${i + 1}`}</span>
                          <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{formatCurrency(bid.amount || bid.rate)}</span>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No bids received</div>
                    )}
                  </div>

                  {/* Equipment & commodity */}
                  {(load.equipment || load.commodity) && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {load.equipment && <div><span style={{ color: 'var(--text-secondary)' }}>Equip:</span> <strong>{load.equipment}</strong></div>}
                      {load.commodity && <div><span style={{ color: 'var(--text-secondary)' }}>Commodity:</span> <strong>{load.commodity}</strong></div>}
                    </div>
                  )}
                </div>
              </div>

              {/* ── AI Suggestions ── */}
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 8, fontSize: 13 }}>AI Suggestions</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {/* Recommended action */}
                  <div style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', padding: '8px', borderRadius: 6 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Best Action</div>
                    <div style={{ fontWeight: 700 }}>
                      {!load.carrier?.name
                        ? 'Assign carrier now'
                        : marginBelowTarget
                          ? 'Renegotiate rate — margin below target'
                          : normalizedStatus === 'TENDERED' && countdownMinutes !== null && countdownMinutes < 240
                            ? 'Urgent: Confirm pickup — under 4 hours'
                            : normalizedStatus === 'PRE_DISPATCH'
                              ? 'Dispatch load to carrier'
                              : 'Optimize margin'}
                    </div>
                  </div>

                  {/* Market comparison */}
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Market Rate</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{formatCurrency(marketRate)}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Opportunity Gap</div>
                      <div style={{ fontWeight: 700, color: opportunityGap >= 0 ? 'var(--success)' : 'var(--error)' }}>{opportunityGap >= 0 ? '+' : ''}{formatCurrency(opportunityGap)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Target Margin</div>
                      <div style={{ fontWeight: 600 }}>{Number(load.targetMarginPct || 12)}%</div>
                    </div>
                  </div>

                  {/* Risk signals */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Risk Signals</div>
                    {(() => {
                      const risks = [];
                      if (marginBelowTarget) risks.push({ icon: '📉', text: 'Margin below target' });
                      if (urgentUncovered) risks.push({ icon: '⏰', text: 'Pickup under 4 hours' });
                      if (!load.carrier?.name) risks.push({ icon: '🚛', text: 'No carrier assigned' });
                      if (Number(load.carrierCost || 0) > marketRate) risks.push({ icon: '💰', text: 'Cost above market' });
                      if (load.exceptions?.length > 0) risks.push({ icon: '🚨', text: `${load.exceptions.length} exception${load.exceptions.length > 1 ? 's' : ''} flagged` });
                      if (risks.length === 0) risks.push({ icon: '✅', text: 'No risks detected' });
                      return risks.map((r, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 0' }}>
                          <span>{r.icon}</span>
                          <span style={{ fontWeight: r.icon === '✅' ? 400 : 600, color: r.icon === '✅' ? 'var(--success)' : 'var(--error)' }}>{r.text}</span>
                        </div>
                      ));
                    })()}
                  </div>

                  {/* Customer info snapshot */}
                  {load.customer?.name && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 2 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 10, textTransform: 'uppercase' }}>Customer</div>
                      <div style={{ fontWeight: 600 }}>{load.customer.name}</div>
                      {load.customer.creditLimit && <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Credit limit: {formatCurrency(load.customer.creditLimit)}</div>}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </td>
        </tr>
      )}
    </>
  );
}
