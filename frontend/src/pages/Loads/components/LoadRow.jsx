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
          <div>{load.customer?.name || '—'}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {customerId ? renderProfileLink(customerId, customerHref) : 'No customer ID'}
          </div>
        </td>
        <td style={{ padding: '0 10px' }}>
          <div>{load.carrier?.name || '—'}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>
            {carrierId ? renderProfileLink(carrierId, carrierHref) : (carrierHref ? renderProfileLink('Open profile', carrierHref) : 'No carrier ID')}
          </div>
        </td>
        <td style={{ padding: '0 10px' }}>{load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</td>
        <td style={{ padding: '0 10px' }}>{load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</td>
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
              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Route</div>
                <div><strong>Origin:</strong> {load.origin?.city || '—'}{load.origin?.state ? `, ${load.origin.state}` : ''}</div>
                <div><strong>Destination:</strong> {load.destination?.city || '—'}{load.destination?.state ? `, ${load.destination.state}` : ''}</div>
                {normalizedStatus === 'PRE_DISPATCH' && <div><strong>Pickup Countdown:</strong> ⏳ {formatCountdown(countdownMinutes)}</div>}
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Margin Breakdown</div>
                <div><strong>Revenue/Mile:</strong> ${Number(load.miles ? Number(load.revenue || 0) / Number(load.miles || 1) : 0).toFixed(2)}</div>
                <div><strong>Cost/Mile:</strong> ${Number(load.miles ? Number(load.carrierCost || 0) / Number(load.miles || 1) : 0).toFixed(2)}</div>
                <div><strong>Margin Flag:</strong> {marginBelowTarget ? '📉 Below target' : '✅ Healthy'}</div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>Carrier Bids</div>
                <div>Prime Logistics • ${Number(load.carrierCost || 0).toLocaleString()}</div>
                <div>Velocity Van • ${Math.max(0, Number(load.carrierCost || 0) + 220).toLocaleString()}</div>
                <div>Polar Freight • ${Math.max(0, Number(load.carrierCost || 0) + 390).toLocaleString()}</div>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-alt)', padding: 16, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>AI Suggestions</div>
                <div>Best Action: {load.carrier?.assigned ? 'Optimize margin' : 'Assign carrier now'}</div>
                <div>Market Rate: ${marketRate.toLocaleString()}</div>
                <div>Opportunity Gap: {opportunityGap >= 0 ? '+' : ''}${opportunityGap.toLocaleString()}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
