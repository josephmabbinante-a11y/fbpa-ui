// Placeholder components for missing sections
import StickyLoadHeader from '../../components/StickyLoadHeader';
import CustomerSection from '../../components/CustomerSection';
import StopsSection from '../../components/StopsSection';
import LaneIntelligencePanel from '../../components/LaneIntelligencePanel';
import CarrierSection from '../../components/CarrierSection';
import FinancialSection from '../../components/FinancialSection';
import CollapsibleSection from '../../components/CollapsibleSection';
// TODO: Implement DocumentsSection and ActivityLogPanel as real components if needed
const DocumentsSection = ({ onComplete }) => <div>Documents & Dispatch section coming soon.<button onClick={onComplete}>Mark Complete</button></div>;
const ActivityLogPanel = ({ onComplete }) => <div>Activity Log section coming soon.<button onClick={onComplete}>Mark Complete</button></div>;
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

  // Stepper state
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState({});

  const steps = [
    {
      title: 'Customer',
      component: <CustomerSection onComplete={() => { setCompleted((c) => ({ ...c, customer: true })); setStep(1); }} />,
      key: 'customer',
    },
    {
      title: 'Stops',
      component: <StopsSection onComplete={() => { setCompleted((c) => ({ ...c, stops: true })); setStep(2); }} />,
      key: 'stops',
    },
    {
      title: 'Lane Intelligence',
      component: <LaneIntelligencePanel onComplete={() => { setCompleted((c) => ({ ...c, lane: true })); setStep(3); }} />,
      key: 'lane',
    },
    {
      title: 'Carrier',
      component: <CarrierSection onComplete={() => { setCompleted((c) => ({ ...c, carrier: true })); setStep(4); }} />,
      key: 'carrier',
    },
    {
      title: 'Financials',
      component: <FinancialSection onComplete={() => { setCompleted((c) => ({ ...c, financials: true })); setStep(5); }} />,
      key: 'financials',
    },
    {
      title: 'Documents & Dispatch',
      component: <DocumentsSection onComplete={() => { setCompleted((c) => ({ ...c, documents: true })); setStep(6); }} />,
      key: 'documents',
    },
    {
      title: 'Activity Log',
      component: <ActivityLogPanel onComplete={() => { setCompleted((c) => ({ ...c, activity: true })); setStep(7); }} />,
      key: 'activity',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 18, padding: 18 }}>
      <StickyLoadHeader />
      {steps.map((s, idx) => (
        <CollapsibleSection
          key={s.key}
          title={s.title}
          complete={!!completed[s.key]}
          defaultOpen={step === idx}
        >
          {step === idx ? s.component : null}
        </CollapsibleSection>
      ))}
      {step === steps.length && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button style={primaryBtn} onClick={runCreateNewLoad}>Create Load</button>
        </div>
      )}
    </div>
  );
}
