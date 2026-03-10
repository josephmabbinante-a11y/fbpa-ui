import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const SAMPLE_ROUTES = [
  {
    id: 'RT-001',
    origin: 'Chicago, IL',
    destination: 'Miami, FL',
    miles: 1380,
    estimatedHours: 21.5,
    fuelStops: ['Nashville, TN (Pilot)', 'Gainesville, FL (Love\'s)'],
    tollCost: 48,
    fuelCost: 512,
    totalCost: 560,
    hosCompliant: true,
    alerts: [],
    restStops: ['Nashville, TN (8h sleeper)'],
    weather: 'Clear',
  },
  {
    id: 'RT-002',
    origin: 'Los Angeles, CA',
    destination: 'Dallas, TX',
    miles: 1430,
    estimatedHours: 22,
    fuelStops: ['Barstow, CA (TA)', 'Tucson, AZ (Pilot)', 'El Paso, TX (Flying J)'],
    tollCost: 12,
    fuelCost: 530,
    totalCost: 542,
    hosCompliant: true,
    alerts: ['Heat advisory: AZ/NM corridor (check coolant)', 'I-10 construction delay near Tucson +45min'],
    restStops: ['Tucson, AZ (10h sleeper)'],
    weather: 'Heat Advisory',
  },
  {
    id: 'RT-003',
    origin: 'Atlanta, GA',
    destination: 'New York, NY',
    miles: 880,
    estimatedHours: 14,
    fuelStops: ['Charlotte, NC (Flying J)'],
    tollCost: 87,
    fuelCost: 326,
    totalCost: 413,
    hosCompliant: true,
    alerts: ['Heavy congestion expected: I-95 NJ (add 1.5hr)'],
    restStops: [],
    weather: 'Clear',
  },
];

const HOS_RULES = [
  { rule: '11-Hour Driving Limit', detail: 'Drivers may drive a max of 11 hours after 10 consecutive hours off duty.', icon: '⏱️' },
  { rule: '14-Hour Duty Window', detail: 'Drivers cannot drive beyond the 14th consecutive hour after coming on duty.', icon: '🕐' },
  { rule: '30-Minute Break Rule', detail: 'Drivers must take a 30-min break after 8 hours of driving without interruption.', icon: '☕' },
  { rule: 'Weekly Hour Limits', detail: '60/70 hours in 7/8 consecutive days. Reset after 34-hour restart.', icon: '📅' },
];

const FUEL_NETWORKS = [
  { name: 'Pilot Flying J', locations: 750, discount: 'Up to $0.20/gal', color: '#3b82f6' },
  { name: "Love's Travel Stops", locations: 620, discount: 'Up to $0.15/gal', color: '#10b981' },
  { name: 'TA / Petro', locations: 280, discount: 'Up to $0.18/gal', color: '#f59e0b' },
  { name: 'Flying J Standalone', locations: 190, discount: 'Network pricing', color: '#8b5cf6' },
];

export default function RouteOptimization() {
  const { theme } = useTheme();
  const t = theme;
  const [selected, setSelected] = useState(SAMPLE_ROUTES[0]);
  const [activeTab, setActiveTab] = useState('routes');

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 8,
    padding: 20,
  };

  const tabStyle = (active) => ({
    padding: '8px 18px',
    borderRadius: 4,
    border: `1px solid ${active ? t.accent : t.border}`,
    backgroundColor: active ? t.accent : 'transparent',
    color: active ? '#fff' : t.text,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: active ? 600 : 400,
  });

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>🗺️ Route Optimization Engine</div>
        <div style={{ fontSize: 14, color: t.textSecondary }}>
          Legal Class-8 truck routes • HOS compliance • Fuel stop optimization • Traffic & weather intelligence
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button style={tabStyle(activeTab === 'routes')} onClick={() => setActiveTab('routes')}>Optimized Routes</button>
        <button style={tabStyle(activeTab === 'hos')} onClick={() => setActiveTab('hos')}>HOS Compliance</button>
        <button style={tabStyle(activeTab === 'fuel')} onClick={() => setActiveTab('fuel')}>Fuel Networks</button>
      </div>

      {activeTab === 'routes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
          {/* Route List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {SAMPLE_ROUTES.map(route => (
              <div
                key={route.id}
                onClick={() => setSelected(route)}
                style={{
                  ...cardStyle,
                  cursor: 'pointer',
                  borderColor: selected?.id === route.id ? t.accent : t.border,
                  borderLeftWidth: selected?.id === route.id ? 3 : 1,
                  borderLeftColor: selected?.id === route.id ? t.accent : t.border,
                }}
                onMouseEnter={e => { if (selected?.id !== route.id) e.currentTarget.style.backgroundColor = t.bgAlt; }}
                onMouseLeave={e => { if (selected?.id !== route.id) e.currentTarget.style.backgroundColor = t.surface; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{route.origin}</div>
                    <div style={{ fontSize: 11, color: t.textSecondary }}>→ {route.destination}</div>
                  </div>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 99,
                    backgroundColor: route.alerts.length > 0 ? '#f59e0b18' : '#10b98118',
                    color: route.alerts.length > 0 ? '#f59e0b' : '#10b981',
                  }}>
                    {route.alerts.length > 0 ? `${route.alerts.length} alert${route.alerts.length > 1 ? 's' : ''}` : '✓ Clear'}
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{route.miles.toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: t.textSecondary }}>miles</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{route.estimatedHours}h</div>
                    <div style={{ fontSize: 10, color: t.textSecondary }}>drive time</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>${route.totalCost}</div>
                    <div style={{ fontSize: 10, color: t.textSecondary }}>fuel + tolls</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Route Detail */}
          {selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={cardStyle}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{selected.origin} → {selected.destination}</div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 16 }}>Route ID: {selected.id} · Weather: {selected.weather}</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Distance', value: `${selected.miles.toLocaleString()} mi` },
                    { label: 'Drive Time', value: `${selected.estimatedHours}h` },
                    { label: 'Fuel Cost', value: `$${selected.fuelCost}` },
                    { label: 'Toll Cost', value: `$${selected.tollCost}` },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: t.bg, borderRadius: 6, padding: 12, border: `1px solid ${t.border}`, textAlign: 'center' }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{item.value}</div>
                      <div style={{ fontSize: 10, color: t.textSecondary, marginTop: 2 }}>{item.label}</div>
                    </div>
                  ))}
                </div>

                {selected.alerts.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#f59e0b' }}>⚠ Route Alerts</div>
                    {selected.alerts.map((alert, i) => (
                      <div key={i} style={{ padding: '8px 12px', backgroundColor: '#f59e0b18', borderRadius: 4, border: '1px solid #f59e0b30', fontSize: 12, marginBottom: 6 }}>
                        {alert}
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>⛽ Fuel Stops</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {selected.fuelStops.map((stop, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: t.bg, borderRadius: 4, border: `1px solid ${t.border}`, fontSize: 12 }}>
                        <span>⛽</span>
                        <span>{stop}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {selected.restStops.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>🛏️ Scheduled Rest Stops</div>
                    {selected.restStops.map((stop, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', backgroundColor: '#3b82f618', borderRadius: 4, border: '1px solid #3b82f630', fontSize: 12 }}>
                        <span>🛏️</span>
                        <span>{stop}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{selected.hosCompliant ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {selected.hosCompliant ? 'HOS Compliant Route' : 'HOS Violation Detected'}
                  </div>
                  <div style={{ fontSize: 12, color: t.textSecondary }}>
                    {selected.hosCompliant
                      ? 'This route is within FMCSA hours-of-service limits including scheduled breaks.'
                      : 'Review required — route may exceed driver hours limits.'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'hos' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {HOS_RULES.map(rule => (
            <div key={rule.rule} style={cardStyle}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{rule.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{rule.rule}</div>
              <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>{rule.detail}</div>
            </div>
          ))}
          <div style={{ ...cardStyle, gridColumn: '1 / -1', backgroundColor: '#3b82f618', border: '1px solid #3b82f640' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#3b82f6' }}>🤖 Auto-Scheduled Compliance</div>
            <div style={{ fontSize: 13, color: t.textSecondary, lineHeight: 1.6 }}>
              The Route Optimization Engine automatically builds HOS-compliant stop schedules into every route plan.
              Rest breaks, sleeper stops, and parking are factored in before a route is presented. Drivers receive
              updated ETA and stop guidance via the Driver Mobile App.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fuel' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
            {FUEL_NETWORKS.map(network => (
              <div key={network.name} style={{ ...cardStyle, borderTop: `3px solid ${network.color}` }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{network.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: network.color, marginBottom: 4 }}>{network.locations}</div>
                <div style={{ fontSize: 11, color: t.textSecondary, marginBottom: 8 }}>locations nationwide</div>
                <div style={{ fontSize: 12, padding: '4px 10px', backgroundColor: network.color + '18', borderRadius: 99, display: 'inline-block', color: network.color, fontWeight: 600 }}>
                  {network.discount}
                </div>
              </div>
            ))}
          </div>
          <div style={cardStyle}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>⛽ Fuel Stop Selection Logic</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { factor: 'Fuel Price', detail: 'Regional diesel pricing compared across networks for lowest cost.' },
                { factor: 'Break Timing', detail: 'Stop locations aligned with mandatory HOS break windows.' },
                { factor: 'Parking Availability', detail: 'Verified truck parking capacity at each stop location.' },
                { factor: 'Route Proximity', detail: 'Stops within 5 miles of optimal route path to minimize deviation.' },
              ].map(f => (
                <div key={f.factor} style={{ padding: 12, backgroundColor: t.bg, borderRadius: 6, border: `1px solid ${t.border}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{f.factor}</div>
                  <div style={{ fontSize: 11, color: t.textSecondary, lineHeight: 1.5 }}>{f.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
