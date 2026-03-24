import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getLocation } from '../api/locationsClient';
import { useTheme } from '../contexts/ThemeContext';

export default function LocationProfile() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme;

  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!locationId) return;

    const load = async () => {
      setLoading(true);
      setError('');
      const result = await getLocation(locationId);
      if (result?.error) {
        setError(result.error);
        setLocation(null);
      } else {
        setLocation(result);
      }
      setLoading(false);
    };

    load();
  }, [locationId]);

  if (loading) {
    return <div style={{ padding: 24, fontSize: 13, color: 'var(--text-secondary)' }}>Loading location profile...</div>;
  }

  if (error || !location) {
    return (
      <div style={{ padding: 24, display: 'grid', gap: 12 }}>
        <div style={{ fontSize: 14, color: 'var(--error)', fontWeight: 700 }}>{error || 'Location not found.'}</div>
        <div>
          <button type="button" onClick={() => navigate('/locations')} style={{ padding: '8px 16px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, fontWeight: 600, cursor: 'pointer' }}>
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  const infoRow = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 13, color: t.textSecondary }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gap: 16, padding: 24, minHeight: '100vh', background: t.bg }}>
      <header>
        <button type="button" onClick={() => navigate('/locations')} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, fontSize: 12, cursor: 'pointer', marginBottom: 8 }}>
          Back to Locations
        </button>
        <h1 style={{ margin: 0, fontSize: 26 }}>{location.name || 'Location Profile'}</h1>
        <div style={{ fontSize: 12, color: t.textSecondary }}>{location.address}</div>
      </header>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Shipments', value: location.totalShipments ?? '—' },
          { label: 'Avg Dwell (min)', value: location.avgDwell ?? '—' },
          { label: 'Status', value: location.status || 'Active' },
          { label: 'Type', value: location.type || location.locationTypes || '—' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: t.bgAlt, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: t.textSecondary, textTransform: 'uppercase', fontWeight: 700 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Location Details */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Location Details</div>
          {infoRow('Location Code', location.locationCodes || location.locationCode)}
          {infoRow('City', location.city)}
          {infoRow('State', location.state)}
          {infoRow('ZIP', location.zip)}
          {infoRow('Role', location.role)}
          {infoRow('Branch', location.branch)}
          {infoRow('Operating Hours', location.operatingHours)}
          {infoRow('Appointment Required', location.appointmentRequired ? 'Yes' : 'No')}
          {infoRow('Liftgate Required', location.liftgateRequired ? 'Yes' : 'No')}
          {infoRow('Inside Pickup', location.insidePickup ? 'Yes' : 'No')}
        </div>

        {/* Contact & Customer */}
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>Contact & Customer</div>
          {infoRow('Primary Contact', location.primaryContact)}
          {infoRow('Phone', location.primaryPhone)}
          {infoRow('Email', location.primaryEmail)}
          {location.customerId && (
            <>
              {infoRow('Customer', location.customerName || location.customerId)}
              <div style={{ marginTop: 8 }}>
                <a
                  href={`/customers/${encodeURIComponent(location.customerId)}`}
                  onClick={(e) => { e.preventDefault(); navigate(`/customers/${encodeURIComponent(location.customerId)}`); }}
                  style={{ color: 'var(--accent)', textDecoration: 'underline', fontSize: 13, cursor: 'pointer' }}
                >
                  View Customer Profile →
                </a>
              </div>
            </>
          )}
          {infoRow('Savings Rate', location.savingsRate)}
        </div>
      </div>

      {/* Notes */}
      {location.notes && (
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Notes</div>
          <div style={{ fontSize: 13, color: t.textSecondary }}>{location.notes}</div>
        </div>
      )}

      {/* Timestamps */}
      <div style={{ fontSize: 11, color: t.textSecondary, display: 'flex', gap: 16 }}>
        {location.createdAt && <span>Created: {new Date(location.createdAt).toLocaleDateString()}</span>}
        {location.updatedAt && <span>Updated: {new Date(location.updatedAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
