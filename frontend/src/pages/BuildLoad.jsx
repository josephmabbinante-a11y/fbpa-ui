import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, themes } from '../contexts/ThemeContext';
import { createLoad, createLoadTemplate, listLoadTemplates, updateLoadTemplate } from '../api/loadsClient';

const templatesSeed = [
  { id: 'tpl-1', name: 'Caterpillar Loads', customer: 'Not set', picks: 0, drops: 0, branch: 'Shared' },
  { id: 'tpl-2', name: 'Gregory Packaging Colorado Load', customer: 'Gregory Packaging Inc.', picks: 1, drops: 1, branch: 'Shared' },
  { id: 'tpl-3', name: 'Gregory Packaging Load', customer: 'Not set', picks: 0, drops: 0, branch: 'Shared' },
  { id: 'tpl-4', name: 'N and H Construction Load', customer: 'Not set', picks: 2, drops: 2, branch: 'Shared' },
  { id: 'tpl-5', name: 'Panda Kitchen Load', customer: 'Panda Kitchen and Bath', picks: 1, drops: 1, branch: 'Shared' },
];

function Panel({ title, subtitle, children, t }) {
  return (
    <section
      style={{
        border: `1px solid ${t.border}`,
        borderRadius: 12,
        background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`,
        overflow: 'hidden',
      }}
    >
      <header style={{ padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt }}>
        <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
        {subtitle && <div style={{ color: t.textSecondary, fontSize: 12, marginTop: 3 }}>{subtitle}</div>}
      </header>
      <div style={{ padding: 12 }}>{children}</div>
    </section>
  );
}

export default function BuildLoad() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const t = theme;
  t.accent2 = t.accent2 || '#888';
  const [search, setSearch] = useState('');
  const [templatesData, setTemplatesData] = useState(templatesSeed);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [working, setWorking] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [lastCreatedLoadId, setLastCreatedLoadId] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadTemplates = async () => {
      setLoadingTemplates(true);
      const result = await listLoadTemplates();
      if (!mounted) return;

      if (!result?.error && Array.isArray(result?.items)) {
        setTemplatesData(result.items);
      }
      setLoadingTemplates(false);
    };

    loadTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!templatesData.length) {
      setSelectedTemplateId('');
      return;
    }

    setSelectedTemplateId((previous) => {
      if (previous && templatesData.some((row) => row.id === previous)) return previous;
      return templatesData[0].id;
    });
  }, [templatesData]);

  const templates = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templatesData;
    return templatesData.filter((row) => [row.name, row.customer, row.branch].some((value) => String(value).toLowerCase().includes(q)));
  }, [search, templatesData]);

  const selectedTemplate = useMemo(
    () => templatesData.find((row) => row.id === selectedTemplateId) || templates[0] || templatesData[0] || null,
    [selectedTemplateId, templates, templatesData]
  );

  const financialSnapshot = useMemo(() => {
    const defaults = selectedTemplate?.defaults || {};
    const miles = Number(defaults.miles || 0);
    const revenue = Number(defaults.revenue || 0);
    const carrierCost = Number(defaults.carrierCost || 0);
    const margin = revenue - carrierCost;
    const marginPct = revenue > 0 ? (margin / revenue) * 100 : 0;
    const rpm = miles > 0 ? revenue / miles : 0;
    const cpm = miles > 0 ? carrierCost / miles : 0;

    return { miles, revenue, carrierCost, margin, marginPct, rpm, cpm };
  }, [selectedTemplate]);

  const refreshTemplates = async () => {
    const result = await listLoadTemplates();
    if (!result?.error && Array.isArray(result?.items)) {
      setTemplatesData(result.items);
    }
  };

  const runCreateNewLoad = async () => {
    setWorking('create-load');
    setMessage('');
    const result = await createLoad({});
    setWorking('');

    if (result?.error || !result?.load?.id) {
      setMessage(result?.error || 'Could not create load.');
      return;
    }

    setMessage(`New load ${result.load.id} created.`);
    setLastCreatedLoadId(result.load.id);
    navigate(`/loads/${encodeURIComponent(result.load.id)}/load-basics`);
  };

  const runUseTemplate = async (template) => {
    setWorking(`use-${template.id}`);
    setMessage('');
    const result = await createLoad({ templateId: template.id });
    setWorking('');

    if (result?.error || !result?.load?.id) {
      setMessage(result?.error || `Could not create load from ${template.name}.`);
      return;
    }

    setMessage(`Created load ${result.load.id} from ${template.name}.`);
    setLastCreatedLoadId(result.load.id);
    navigate(`/loads/${encodeURIComponent(result.load.id)}/load-basics`);
  };

  const runCreateTemplate = async () => {
    const name = window.prompt('Template name');
    if (!name || !name.trim()) return;

    const customer = window.prompt('Customer name (optional)', 'Not set') || 'Not set';
    const picks = Number.parseInt(window.prompt('Number of picks', '1') || '1', 10);
    const drops = Number.parseInt(window.prompt('Number of drops', '1') || '1', 10);

    setWorking('create-template');
    setMessage('');
    const result = await createLoadTemplate({
      name: name.trim(),
      customer,
      picks: Number.isFinite(picks) ? picks : 1,
      drops: Number.isFinite(drops) ? drops : 1,
      branch: 'Shared',
    });
    setWorking('');

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    setMessage(`Template ${name.trim()} created.`);
    await refreshTemplates();
  };

  const runEditTemplate = async (template) => {
    const name = window.prompt('Template name', template.name);
    if (!name || !name.trim()) return;

    const customer = window.prompt('Customer name', template.customer || 'Not set') || 'Not set';
    const picks = Number.parseInt(window.prompt('Number of picks', String(template.picks ?? 0)) || String(template.picks ?? 0), 10);
    const drops = Number.parseInt(window.prompt('Number of drops', String(template.drops ?? 0)) || String(template.drops ?? 0), 10);

    setWorking(`edit-${template.id}`);
    setMessage('');
    const result = await updateLoadTemplate(template.id, {
      name: name.trim(),
      customer,
      picks: Number.isFinite(picks) ? picks : Number(template.picks || 0),
      drops: Number.isFinite(drops) ? drops : Number(template.drops || 0),
      branch: template.branch || 'Shared',
    });
    setWorking('');

    if (result?.error) {
      setMessage(result.error);
      return;
    }

    setMessage(`Template ${name.trim()} updated.`);
    await refreshTemplates();
  };

  const primaryBtn = {
    border: `1px solid ${t.accent2}`,
    background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
    color: t.bg,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  const ghostBtn = {
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
    padding: '8px 12px',
    cursor: 'pointer',
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26 }}>Build a Load</h1>
        <div style={{ color: t.textSecondary, fontSize: 12 }}>Home / Loads / New</div>
        {message && <div style={{ color: t.textSecondary, fontSize: 12, marginTop: 6 }}>{message}</div>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Panel
          title="New Load Wizard"
          subtitle="Use guided flow to build a successful load from scratch."
          t={t}
        >
          <button type="button" style={primaryBtn} onClick={runCreateNewLoad} disabled={Boolean(working)}>
            {working === 'create-load' ? 'Creating Load...' : 'Use the New Load Wizard'}
          </button>
        </Panel>

        <Panel
          title="Create a Template"
          subtitle="Save time by creating templates you can reuse for future loads."
          t={t}
        >
          <button type="button" style={ghostBtn} onClick={runCreateTemplate} disabled={Boolean(working)}>
            {working === 'create-template' ? 'Creating Template...' : 'Create a New Template'}
          </button>
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 12 }}>
        <Panel title="Use a Template" t={t}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: t.textSecondary, fontSize: 12 }}>{loadingTemplates ? 'Loading templates...' : `${templates.length} entries`}</div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              style={{
                minHeight: 34,
                borderRadius: 8,
                border: `1px solid ${t.accent2}`,
                background: t.bgAlt,
                color: t.text,
                padding: '7px 10px',
                fontSize: 12,
                width: 220,
              }}
            />
          </div>

          <div style={{ border: `1px solid ${t.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                  <th style={{ padding: 10, textAlign: 'left' }}>Template Name</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Customer</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Picks</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Drops</th>
                  <th style={{ padding: 10, textAlign: 'left' }}>Branch</th>
                  <th style={{ padding: 10, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedTemplateId(row.id)}
                    style={{
                      background: selectedTemplateId === row.id ? 'rgba(var(--glow), 0.12)' : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.name}</td>
                    <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.customer}</td>
                    <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>{row.picks}</td>
                    <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>{row.drops}</td>
                    <td style={{ padding: 10, borderTop: `1px solid ${t.border}` }}>{row.branch}</td>
                    <td style={{ padding: 10, borderTop: `1px solid ${t.border}`, textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          style={primaryBtn}
                          onClick={(event) => {
                            event.stopPropagation();
                            runUseTemplate(row);
                          }}
                          disabled={Boolean(working)}
                        >
                          {working === `use-${row.id}` ? 'Using...' : 'Use'}
                        </button>
                        <button
                          type="button"
                          style={ghostBtn}
                          onClick={(event) => {
                            event.stopPropagation();
                            runEditTemplate(row);
                          }}
                          disabled={Boolean(working)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {templates.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 14, textAlign: 'center', color: t.textSecondary, borderTop: `1px solid ${t.border}` }}>
                      No templates match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          <Panel title="Financials Snapshot" subtitle={selectedTemplate ? selectedTemplate.name : 'Select a template'} t={t}>
            <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: t.textSecondary }}>Miles</span><strong>{financialSnapshot.miles.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: t.textSecondary }}>Revenue</span><strong>${financialSnapshot.revenue.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: t.textSecondary }}>Carrier Cost</span><strong>${financialSnapshot.carrierCost.toLocaleString()}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: t.textSecondary }}>Margin</span><strong>${financialSnapshot.margin.toLocaleString()} ({financialSnapshot.marginPct.toFixed(1)}%)</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: t.textSecondary }}>Revenue / Mile</span><strong>${financialSnapshot.rpm.toFixed(2)}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: t.textSecondary }}>Cost / Mile</span><strong>${financialSnapshot.cpm.toFixed(2)}</strong></div>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                style={primaryBtn}
                onClick={() => navigate(lastCreatedLoadId ? `/loads/${encodeURIComponent(lastCreatedLoadId)}/financials` : '/loads/financials')}
              >
                Open Financials
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
