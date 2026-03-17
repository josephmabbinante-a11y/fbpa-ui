import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listLoads } from '../api/loadsClient';
import { getCarriers, getCustomers } from '../api/client';

const MAX_RESULTS_PER_GROUP = 5;

function makeCarrierPath(carrier) {
  const key = String(carrier?.id || carrier?.mcNumber || carrier?.name || '').trim();
  return key ? `/carriers/profile/${encodeURIComponent(key)}` : '/carriers';
}

export default function GlobalCommandSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ loads: [], customers: [], carriers: [] });

  useEffect(() => {
    const onHotkey = (event) => {
      const key = String(event.key || '').toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (key === 'escape') {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', onHotkey);
    return () => window.removeEventListener('keydown', onHotkey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const trimmed = String(query || '').trim();
    if (!trimmed) {
      setResults({ loads: [], customers: [], carriers: [] });
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      const [loadsRes, customersRes, carriersRes] = await Promise.all([
        listLoads({ q: trimmed, pageSize: MAX_RESULTS_PER_GROUP, sort: '-updatedAt' }),
        getCustomers(),
        getCarriers({ limit: 200 }),
      ]);

      const customerRows = Array.isArray(customersRes) ? customersRes : [];
      const carrierRows = Array.isArray(carriersRes?.carriers) ? carriersRes.carriers : (Array.isArray(carriersRes) ? carriersRes : []);
      const lower = trimmed.toLowerCase();

      setResults({
        loads: Array.isArray(loadsRes?.items)
          ? loadsRes.items.slice(0, MAX_RESULTS_PER_GROUP).map((load) => ({
            id: `load-${load.id}`,
            title: `Load ${load.id}`,
            subtitle: `${load.customer?.name || 'Unknown customer'} -> ${load.carrier?.name || 'Unassigned'}`,
            path: `/loads/${encodeURIComponent(load.id)}/load-basics`,
          }))
          : [],
        customers: customerRows
          .filter((customer) => [customer?.id, customer?.name, customer?.company].filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(lower)))
          .slice(0, MAX_RESULTS_PER_GROUP)
          .map((customer) => ({
            id: `customer-${customer.id}`,
            title: `${customer.name || 'Customer'} (${customer.id || 'No ID'})`,
            subtitle: customer.company || customer.email || 'Customer profile',
            path: `/customers/${encodeURIComponent(customer.id)}`,
          })),
        carriers: carrierRows
          .filter((carrier) => [carrier?.id, carrier?.name, carrier?.mcNumber].filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(lower)))
          .slice(0, MAX_RESULTS_PER_GROUP)
          .map((carrier) => ({
            id: `carrier-${carrier.id || carrier.mcNumber || carrier.name}`,
            title: `${carrier.name || 'Carrier'} (${carrier.mcNumber || carrier.id || 'No ID'})`,
            subtitle: carrier.status || carrier.phone || 'Carrier profile',
            path: makeCarrierPath(carrier),
          })),
      });
      setLoading(false);
    }, 220);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  const hasResults = useMemo(() => (
    results.loads.length > 0 || results.customers.length > 0 || results.carriers.length > 0
  ), [results]);

  const pickResult = (path) => {
    setOpen(false);
    setQuery('');
    navigate(path);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'rgba(4, 10, 24, 0.58)',
        display: 'grid',
        placeItems: 'start center',
        paddingTop: 80,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: 'min(760px, calc(100vw - 32px))',
          borderRadius: 14,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.36)',
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search loads, customers, or carrier MC#"
            style={{
              width: '100%',
              minHeight: 40,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              color: 'var(--text)',
              padding: '9px 12px',
              fontSize: 14,
            }}
          />
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 12, display: 'grid', gap: 10 }}>
          {loading && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Searching...</div>}
          {!loading && !hasResults && query.trim() && (
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No matches found.</div>
          )}

          {['loads', 'customers', 'carriers'].map((group) => (
            <section key={group} style={{ display: results[group].length > 0 ? 'grid' : 'none', gap: 6 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-secondary)', fontWeight: 700 }}>{group}</div>
              {results[group].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pickResult(item.path)}
                  style={{
                    textAlign: 'left',
                    borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    padding: '9px 10px',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{item.title}</div>
                  <div style={{ fontSize: 12, opacity: 0.82 }}>{item.subtitle}</div>
                </button>
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
