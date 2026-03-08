import { useMemo, useState } from 'react';
import ContactCustomerModal from '../components/ContactCustomerModal';
import { getInvoices, sendCustomerMessage } from '../api/client';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { useApi } from '../hooks/useApi';
import mockInvoices from '../mock/invoices';
import mockInvoiceImages from '../mock/invoiceImages';
import invoiceDetails from '../mock/invoiceDetails';
import carrierPerformance from '../mock/carriersPerformance';
import GoogleMapEmbed from '../components/GoogleMapEmbed';
import RateConfirmationImageUpload from '../components/RateConfirmationImageUpload';
import InvoiceAndRateUpload from '../components/InvoiceAndRateUpload';

function extractInvoices(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.invoices)) return payload.invoices;
  return [];
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { demoMode } = useDemo();
  const t = theme;
  const { data: rawInvoices, loading, error } = useApi(() => getInvoices(), demoMode ? mockInvoices : null, [demoMode]);

  const invoices = useMemo(() => {
    const source = extractInvoices(rawInvoices);
    return source.length ? source : (demoMode ? mockInvoices : []);
  }, [demoMode, rawInvoices]);

  const invoice = useMemo(
    () => invoices.find((inv) => String(inv.id) === String(id) || String(inv.invoiceNumber) === String(id)),
    [id, invoices]
  );
  const detail = useMemo(() => {
    if (demoMode) return invoiceDetails[id] || null;
    return {
      billedCost: Number(invoice?.amount || 0),
      expectedCost: Number(invoice?.amount || 0),
      benefitValue: Number(invoice?.savings || 0),
      rateMatch: 0,
      marginError: 0,
      origin: { city: 'N/A' },
      destination: { city: 'N/A' },
      distanceMiles: 0,
      avgTransitDays: 0,
      linehaulCost: Number(invoice?.amount || 0),
      fuelSurcharge: 0,
      accessorials: 0,
      expectedRatePerMile: 0,
      billedRatePerMile: 0,
    };
  }, [demoMode, id, invoice]);
  const images = demoMode ? mockInvoiceImages.filter((img) => img.invoiceId === id) : [];
  const carrierSnap = demoMode ? carrierPerformance.find((c) => c.carrier === invoice?.carrier) : null;

  // Contact modal state
  const [modalOpen, setModalOpen] = useState(false);

  const handleSendMessage = async ({ message, customer, invoice, exception }) => {
    return await sendCustomerMessage({ message, customer, invoice, exception });
  };

  if (!invoice || !detail) {
    return (
      <div style={{ padding: 24, color: t.text }}>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          style={{
            backgroundColor: t.bgAlt,
            border: `1px solid ${t.border}`,
            color: t.text,
            borderRadius: 6,
            padding: '8px 12px',
            marginBottom: 16,
            cursor: 'pointer',
          }}
        >
          Back to Invoices
        </button>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Invoice not found</div>
      </div>
    );
  }

  const containerStyle = {
    padding: 24,
    backgroundColor: t.bg,
    color: t.text,
    minHeight: '100vh',
    width: '100%',
    boxSizing: 'border-box',
  };

  const cardStyle = {
    backgroundColor: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: 6,
    padding: 16,
  };

  const kpiStyle = {
    backgroundColor: t.bgAlt,
    border: `1px solid ${t.borderLight}`,
    borderRadius: 6,
    padding: 12,
  };

  const formatCurrency = (value) =>
    `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const rateMatchTone = detail.rateMatch >= 90 ? t.positive : detail.rateMatch >= 80 ? t.warning : t.error;

  return (
    <div style={containerStyle}>
      {/* Warning banner for mock data */}
      {demoMode && error ? (
        <div
          style={{
            backgroundColor: '#ffb300',
            color: '#222',
            padding: '10px 16px',
            borderRadius: 6,
            marginBottom: 16,
            fontWeight: 600,
            border: '1px solid #ff9800',
          }}
        >
          Backend error, using mock data: {error}
        </div>
      ) : null}
      {!demoMode && error ? (
        <div style={{ marginBottom: 12, fontSize: 13, color: t.warning }}>Unable to load invoice details: {error}</div>
      ) : null}
      {loading ? <div style={{ marginBottom: 12, fontSize: 13, color: t.textSecondary }}>Loading invoice...</div> : null}
      <div
        style={{
          backgroundColor: t.warning,
          color: t.text,
          padding: '10px 16px',
          borderRadius: 6,
          marginBottom: 16,
          fontWeight: 600,
          border: `1px solid ${t.warning}`,
        }}
      >
        Backend error, using mock data: Failed to fetch
      </div>
      <button
        type="button"
        onClick={() => navigate('/invoices')}
        style={{
          backgroundColor: t.bgAlt,
          border: `1px solid ${t.border}`,
          color: t.text,
          borderRadius: 6,
          padding: '8px 12px',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        Back to Invoices
      </button>

      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Invoice {invoice.id}</h1>
          <div style={{ fontSize: 12, color: t.textSecondary }}>
            {invoice.carrier || 'N/A'} · {invoice.status || 'N/A'} · Uploaded {invoice.uploadDate ? new Date(invoice.uploadDate).toLocaleDateString() : 'N/A'}
          </div>
        </div>
        <button
          style={{
            background: t.accent,
            color: t.surface,
            border: 'none',
            borderRadius: 4,
            padding: '7px 18px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            marginLeft: 'auto',
            marginTop: 8,
            height: 36,
          }}
          onClick={() => setModalOpen(true)}
        >
          Contact Customer
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={kpiStyle}>
          <div style={{ fontSize: 11, color: t.textSecondary }}>Billed</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(detail.billedCost)}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 11, color: t.textSecondary }}>Expected</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{formatCurrency(detail.expectedCost)}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 11, color: t.textSecondary }}>Benefit</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: t.success }}>{formatCurrency(detail.benefitValue)}</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 11, color: t.textSecondary }}>Rate Match</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: rateMatchTone }}>{detail.rateMatch}%</div>
        </div>
        <div style={kpiStyle}>
          <div style={{ fontSize: 11, color: t.textSecondary }}>Margin Error</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{detail.marginError.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Route Details</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>
            {detail.origin.city} → {detail.destination.city}
          </div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 12 }}>
            {detail.distanceMiles.toLocaleString()} miles · Avg transit {carrierSnap ? carrierSnap.avgTransitDays.toFixed(1) : detail.avgTransitDays?.toFixed?.(1) || '—'} days
          </div>

          <GoogleMapEmbed origin={detail.origin.city} destination={detail.destination.city} height={160} />
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Rate Analysis</div>
          <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
            <div>Linehaul: {formatCurrency(detail.linehaulCost)}</div>
            <div>Fuel surcharge: {formatCurrency(detail.fuelSurcharge)}</div>
            <div>Accessorials: {formatCurrency(detail.accessorials)}</div>
            <div>Expected rate/mi: {formatCurrency(detail.expectedRatePerMile)}</div>
            <div>Billed rate/mi: {formatCurrency(detail.billedRatePerMile)}</div>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: t.textSecondary }}>
            Cost-to-benefit ratio: {(detail.benefitValue / detail.billedCost * 100).toFixed(1)}%
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Carrier Performance Snapshot</div>
          {carrierSnap ? (
            <div style={{ display: 'grid', gap: 6, fontSize: 12 }}>
              <div>On-time: {carrierSnap.onTime.toFixed(1)}%</div>
              <div>Billing errors: {carrierSnap.billingErrors.toFixed(1)}%</div>
              <div>Invoice discrepancy: {carrierSnap.invoiceDiscrepancy.toFixed(1)}%</div>
              <div>Claims rate: {carrierSnap.claimsRate.toFixed(1)}%</div>
              <div>Avg transit: {carrierSnap.avgTransitDays.toFixed(1)} days</div>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: t.textSecondary }}>No carrier metrics available.</div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <InvoiceAndRateUpload invoiceImages={images} />
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Match Analysis</div>
          <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 8 }}>
            Rating match is calculated from billed vs expected totals, accessorial validation, and lane rate tables.
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 999,
              backgroundColor: t.bgAlt,
              overflow: 'hidden',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                width: `${detail.rateMatch}%`,
                height: '100%',
                backgroundColor: rateMatchTone,
              }}
            />
          </div>
          <div style={{ fontSize: 12 }}>
            Rate match score: <strong style={{ color: rateMatchTone }}>{detail.rateMatch}%</strong>
          </div>
        </div>
      </div>
      <ContactCustomerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSend={handleSendMessage}
        invoice={invoice}
        customer={null}
        exception={null}
      />
    </div>
  );
}
