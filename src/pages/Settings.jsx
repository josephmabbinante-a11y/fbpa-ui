import RoleManagement from '../components/admin/RoleManagement';
import { useEffect, useMemo, useState } from 'react';
import AdminControlCard from '../components/admin/AdminControlCard';
import CompanyInfoForm from '../components/admin/CompanyInfoForm';
import LogoUpload from '../components/admin/LogoUpload';
import CurrencyUnitsForm from '../components/admin/CurrencyUnitsForm';
import UserManagement from '../components/admin/UserManagement';
import DefaultMarginTargets from '../components/admin/DefaultMarginTargets';
import RoutingDefaults from '../components/admin/RoutingDefaults';
import NotificationSettings from '../components/admin/NotificationSettings';
import WorkflowAutomationEnginePanel from '../components/admin/WorkflowAutomationEnginePanel';
import {
  createEmailTemplate,
  deleteEmailTemplate,
  getUsers,
  listEmailTemplates,
  register,
  sendEmailMessage,
  updateEmailTemplate,
  updateUser,
} from '../api/client';
import { useTheme } from '../contexts/ThemeContext';
import { useDemo } from '../demo/DemoContext';
import { clearAccessToken } from '../utils/authToken';

const COMPANY_BRANDING_STORAGE_KEY = 'fbpa_company_branding';
const DOCUMENT_WHITELABEL_STORAGE_KEY = 'fbpa_document_whitelabel';

function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
}

function writeStorage(key, payload) {
  localStorage.setItem(key, JSON.stringify(payload));
}

const adminSections = [
  {
    icon: 'account',
    title: 'Account & Profile',
    description: 'Manage your personal profile, team, billing, integrations, API keys, and preferences.',
    actions: ['Profile', 'Team Management', 'Billing & Plan', 'Integrations', 'API Keys', 'Preferences'],
  },
  {
    icon: 'company',
    title: 'Company & Organization',
    description: 'Manage company profile, branding, and operational defaults.',
    actions: [
      'Edit your company contact info',
      'Edit your company insurance coverage',
      'Edit your dropdown lists',
      'Upload your company logo',
      'Customize the default currency and units of measure for your location',
      'Configure your alerts',
      'Configure your default routing options',
      'Automated Workflow Engine',
      'Edit Driver Pay Settings',
      'Set Default Target Gross Margins',
    ],
  },
  {
    icon: 'users',
    title: 'User & Permissions',
    description: 'Manage users, roles, and department access control.',
    actions: ['Add/Edit Users', 'Manage Roles', 'Permission Groups', 'Commission Overrides', 'Branch Management'],
  },
  {
    icon: 'freight',
    title: 'Load & Freight Configuration',
    description: 'Control load workflows and operational behaviors.',
    actions: ['Load Numbering Rules', 'Manifest Settings', 'Default Equipment Types', 'Workflow Automation Rules', 'Rate Logic Configuration'],
  },
  {
    icon: 'audit',
    title: 'Audit & Financial Controls',
    description: 'Configure audit rules and financial safeguards.',
    actions: ['Accessorial Validation Rules', 'Carrier Overcharge Thresholds', 'Invoice Audit Settings', 'Profit Margin Alerts', 'Payment Terms Settings'],
  },
  {
    icon: 'documents',
    title: 'Documents & Reporting',
    description: 'Customize document templates and reporting output.',
    actions: ['Carrier Confirmations', 'Invoice Templates', 'Bill of Lading Defaults', 'Font & Branding Settings', 'Reporting Configuration', 'Operator Email Templates'],
  },
  {
    icon: 'billing',
    title: 'Billing & Subscription',
    description: 'Manage subscription plan and feature access.',
    actions: ['View Current Plan', 'Upgrade Plan', 'Payment Methods', 'Usage Limits', 'Feature Access Controls'],
  },
];

// ── Inline form components for each action ──────────────────────────────────

function SimpleForm({ fields, onSave, t }) {
  const [vals, setVals] = useState(() => Object.fromEntries(fields.map(f => [f.key, f.default || ''])));
  const s = {
    label: { fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' },
    input: { padding: '8px 10px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    row: { marginBottom: 14 },
    btn: { marginTop: 8, padding: '9px 20px', background: t.accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  };
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(vals); }}>
      {fields.map(f => (
        <div key={f.key} style={s.row}>
          <label style={s.label}>{f.label}</label>
          {f.type === 'select' ? (
            <select value={vals[f.key]} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))} style={s.input}>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          ) : f.type === 'textarea' ? (
            <textarea rows={3} value={vals[f.key]} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))} style={{ ...s.input, resize: 'vertical' }} />
          ) : (
            <input type={f.type || 'text'} value={vals[f.key]} onChange={e => setVals(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder || ''} style={s.input} />
          )}
        </div>
      ))}
      <button type="submit" style={s.btn}>Save Changes</button>
    </form>
  );
}

function ToggleList({ items, t }) {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(items.map(i => [i.key, i.default !== false])));
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 };
  const toggle = (active) => ({
    width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
    background: active ? t.accent : t.border, position: 'relative', transition: 'background 0.2s',
  });
  return (
    <div>
      {items.map(item => (
        <div key={item.key} style={row}>
          <div>
            <div style={{ fontWeight: 600 }}>{item.label}</div>
            {item.desc && <div style={{ fontSize: 12, color: t.textSecondary }}>{item.desc}</div>}
          </div>
          <button type="button" style={toggle(enabled[item.key])} onClick={() => setEnabled(v => ({ ...v, [item.key]: !v[item.key] }))}>
            <span style={{ position: 'absolute', top: 3, left: enabled[item.key] ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

function OperatorEmailTemplatesPanel({ t }) {
  const [templateAudience, setTemplateAudience] = useState('customer');
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateList, setTemplateList] = useState([]);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateMessage, setTemplateMessage] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [templateForm, setTemplateForm] = useState({ name: '', subject: '', body: '', tags: '' });
  const [outboundEmail, setOutboundEmail] = useState({ to: '', subject: '', body: '' });

  const inputStyle = {
    padding: '8px 10px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: t.bgAlt,
    color: t.text,
    fontSize: 13,
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '8px 12px',
    borderRadius: 6,
    border: `1px solid ${t.border}`,
    background: t.surface,
    color: t.text,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };

  const optionButtonStyle = (active) => ({
    ...buttonStyle,
    border: `1px solid ${active ? t.accent : t.border}`,
    background: active ? t.accent : t.surface,
    color: active ? '#fff' : t.text,
  });

  const loadEmailTemplates = async (audience = templateAudience, q = templateQuery) => {
    setTemplateLoading(true);
    const response = await listEmailTemplates({ audience, q });
    setTemplateLoading(false);

    if (response?.error) {
      setTemplateMessage(response.error);
      setTemplateList([]);
      return;
    }

    const items = Array.isArray(response?.items) ? response.items : [];
    setTemplateList(items);
    setSelectedTemplateId((prev) => prev || items[0]?.id || '');
  };

  useEffect(() => {
    loadEmailTemplates(templateAudience, templateQuery);
  }, [templateAudience]);

  const selectedTemplate = templateList.find((template) => template.id === selectedTemplateId) || null;

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateForm({ name: '', subject: '', body: '', tags: '' });
      return;
    }

    setTemplateForm({
      name: selectedTemplate.name || '',
      subject: selectedTemplate.subject || '',
      body: selectedTemplate.body || '',
      tags: Array.isArray(selectedTemplate.tags) ? selectedTemplate.tags.join(', ') : '',
    });
  }, [selectedTemplateId, templateList]);

  const saveTemplate = async () => {
    setTemplateMessage('');
    const payload = {
      audience: templateAudience,
      name: templateForm.name,
      subject: templateForm.subject,
      body: templateForm.body,
      tags: templateForm.tags,
    };

    const response = selectedTemplateId
      ? await updateEmailTemplate(selectedTemplateId, payload)
      : await createEmailTemplate(payload);

    if (response?.error) {
      setTemplateMessage(response.error);
      return;
    }

    setTemplateMessage(selectedTemplateId ? 'Template updated.' : 'Template created.');
    await loadEmailTemplates(templateAudience, templateQuery);
    const nextTemplateId = response?.template?.id || selectedTemplateId;
    if (nextTemplateId) setSelectedTemplateId(nextTemplateId);
  };

  const removeTemplate = async () => {
    if (!selectedTemplateId) return;
    const response = await deleteEmailTemplate(selectedTemplateId);
    if (response?.error) {
      setTemplateMessage(response.error);
      return;
    }

    setTemplateMessage('Template deleted.');
    setSelectedTemplateId('');
    await loadEmailTemplates(templateAudience, templateQuery);
  };

  const applyTemplateToDraft = () => {
    if (!selectedTemplate) {
      setTemplateMessage('Select a template first.');
      return;
    }

    setOutboundEmail((prev) => ({
      ...prev,
      subject: selectedTemplate.subject || prev.subject,
      body: selectedTemplate.body || prev.body,
    }));
    setTemplateMessage('Template applied to email draft.');
  };

  const sendDraftEmail = async () => {
    const to = String(outboundEmail.to || '').trim();
    const subject = String(outboundEmail.subject || '').trim();
    const body = String(outboundEmail.body || '').trim();
    if (!to || !subject || !body) {
      setTemplateMessage('Recipient, subject, and message body are required.');
      return;
    }

    const response = await sendEmailMessage({
      to,
      subject,
      text: body,
      context: {
        audience: templateAudience,
        source: 'settings-operator-templates',
      },
    });

    if (response?.error) {
      setTemplateMessage(response.error);
      return;
    }

    setTemplateMessage(`Email sent (${response.delivery || 'queued'}).`);
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setTemplateAudience('customer')} style={optionButtonStyle(templateAudience === 'customer')}>Customer Templates</button>
          <button type="button" onClick={() => setTemplateAudience('carrier')} style={optionButtonStyle(templateAudience === 'carrier')}>Carrier Templates</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={templateQuery} onChange={(event) => setTemplateQuery(event.target.value)} placeholder="Search templates" style={{ ...inputStyle, minWidth: 220 }} />
          <button type="button" style={buttonStyle} onClick={() => loadEmailTemplates(templateAudience, templateQuery)} disabled={templateLoading}>
            {templateLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
        <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, overflow: 'hidden', background: t.surface }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
            <thead>
              <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Template Name</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Subject</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {templateList.map((template) => (
                <tr
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  style={{ cursor: 'pointer', background: selectedTemplateId === template.id ? 'rgba(var(--glow), 0.14)' : 'transparent' }}
                >
                  <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{template.name}</td>
                  <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{template.subject}</td>
                  <td style={{ padding: 8, borderTop: `1px solid ${t.border}` }}>{template.updatedAt ? new Date(template.updatedAt).toLocaleString() : '—'}</td>
                </tr>
              ))}
              {templateList.length === 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: 12, textAlign: 'center', color: t.textSecondary, borderTop: `1px solid ${t.border}` }}>
                    No templates for this audience.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>Template Name</label>
              <input value={templateForm.name} onChange={(event) => setTemplateForm((prev) => ({ ...prev, name: event.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>Subject</label>
              <input value={templateForm.subject} onChange={(event) => setTemplateForm((prev) => ({ ...prev, subject: event.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>Body</label>
              <textarea rows={4} value={templateForm.body} onChange={(event) => setTemplateForm((prev) => ({ ...prev, body: event.target.value }))} style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>Tags (comma separated)</label>
              <input value={templateForm.tags} onChange={(event) => setTemplateForm((prev) => ({ ...prev, tags: event.target.value }))} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" style={buttonStyle} onClick={() => { setSelectedTemplateId(''); setTemplateForm({ name: '', subject: '', body: '', tags: '' }); }}>New Template</button>
            <button type="button" style={buttonStyle} onClick={saveTemplate}>Save Template</button>
            <button type="button" style={{ ...buttonStyle, borderColor: '#ef4444', color: '#ef4444' }} onClick={removeTemplate} disabled={!selectedTemplateId}>Delete Template</button>
            <button type="button" style={buttonStyle} onClick={applyTemplateToDraft} disabled={!selectedTemplateId}>Apply to Draft</button>
          </div>
        </div>
      </div>

      <div style={{ border: `1px solid ${t.border}`, borderRadius: 8, background: t.bgAlt, padding: 10, display: 'grid', gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>Operator Email Draft</div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>To</label>
          <input value={outboundEmail.to} onChange={(event) => setOutboundEmail((prev) => ({ ...prev, to: event.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>Subject</label>
          <input value={outboundEmail.subject} onChange={(event) => setOutboundEmail((prev) => ({ ...prev, subject: event.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' }}>Message</label>
          <textarea rows={4} value={outboundEmail.body} onChange={(event) => setOutboundEmail((prev) => ({ ...prev, body: event.target.value }))} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" style={buttonStyle} onClick={sendDraftEmail}>Send Email</button>
        </div>
      </div>

      {templateMessage && <div style={{ fontSize: 12, color: t.textSecondary }}>{templateMessage}</div>}
    </div>
  );
}

function ActionPanel({ action, t, theme, setTheme }) {
  const [saveMessage, setSaveMessage] = useState('');
  const [companyBranding, setCompanyBranding] = useState(() => readStorage(COMPANY_BRANDING_STORAGE_KEY, {
    companyName: 'Opscale Supply Chain',
    logoUrl: '',
    address: '',
    phone: '',
    email: '',
    accentColor: '#2f80ed',
  }));
  const [documentWhiteLabel, setDocumentWhiteLabel] = useState(() => readStorage(DOCUMENT_WHITELABEL_STORAGE_KEY, {
    confirmationHeader: 'Rate Confirmation',
    rateConfirmationTerms: 'Carrier agrees to transport freight per schedule and conditions outlined in this confirmation.',
    signatureLine: 'Authorized Carrier Signature',
    sendMethod: 'Email',
    invoiceTemplate: 'Standard',
    showLogo: 'Yes',
    paymentInstructions: '',
    footerNote: 'Thank you for your business.',
    bolPrefix: 'BOL-',
    shipperName: '',
    shipperAddress: '',
    freightTerms: 'Prepaid',
    specialInstructions: '',
    primaryFont: 'Inter',
    primaryColor: '#2f80ed',
    accentColor: '#5ec8ff',
    logoPosition: 'Top Left',
  }));
  const [selectedCompanyList, setSelectedCompanyList] = useState('Commodity');
  const [companyLists, setCompanyLists] = useState(() => ({
    Commodity: [
      { id: 'comm-1', value: 'Alcohol', grouping: 'High Value' },
      { id: 'comm-2', value: 'Antiques / Works of Art', grouping: 'High Value' },
      { id: 'comm-3', value: 'Cash, Checks, Currency', grouping: 'High Value' },
      { id: 'comm-4', value: 'Feed Supplements', grouping: 'Dry' },
      { id: 'comm-5', value: 'Chemicals', grouping: 'Hazardous' },
      { id: 'comm-6', value: 'Consumer Electronics', grouping: 'High Value' },
      { id: 'comm-7', value: 'Bottled Juices', grouping: '' },
      { id: 'comm-8', value: 'Dry Goods (Food)', grouping: 'Dry' },
    ],
    'Load Status': [
      { id: 'status-1', value: 'Open', grouping: 'Planning' },
      { id: 'status-2', value: 'Booked', grouping: 'Planning' },
      { id: 'status-3', value: 'In Transit', grouping: 'Execution' },
      { id: 'status-4', value: 'Delivered', grouping: 'Closed' },
    ],
    'Pay Items': [
      { id: 'pay-1', value: 'Linehaul', grouping: 'Standard' },
      { id: 'pay-2', value: 'Fuel Surcharge', grouping: 'Accessorial' },
      { id: 'pay-3', value: 'Detention', grouping: 'Accessorial' },
    ],
    'Payment Methods': [
      { id: 'method-1', value: 'ACH', grouping: 'Electronic' },
      { id: 'method-2', value: 'Wire', grouping: 'Electronic' },
      { id: 'method-3', value: 'Check', grouping: 'Paper' },
    ],
    'Truck Length': [
      { id: 'length-1', value: '48 ft', grouping: 'Dry Van' },
      { id: 'length-2', value: '53 ft', grouping: 'Dry Van' },
      { id: 'length-3', value: '28 ft', grouping: 'LTL' },
    ],
    'Truck Status': [
      { id: 'tstatus-1', value: 'Available', grouping: 'Active' },
      { id: 'tstatus-2', value: 'Out of Service', grouping: 'Inactive' },
      { id: 'tstatus-3', value: 'Maintenance', grouping: 'Inactive' },
    ],
    'Truck Type': [
      { id: 'type-1', value: 'Dry Van', grouping: 'Van' },
      { id: 'type-2', value: 'Reefer', grouping: 'Van' },
      { id: 'type-3', value: 'Flatbed', grouping: 'Open Deck' },
    ],
  }));

  const listNames = ['Commodity', 'Load Status', 'Pay Items', 'Payment Methods', 'Truck Length', 'Truck Status', 'Truck Type'];
  const selectedListRows = companyLists[selectedCompanyList] || [];

  const save = (data) => {
    setSaveMessage('Settings saved.');
    alert('Saved: ' + JSON.stringify(data, null, 2));
  };

  const persistCompanyBranding = (updates, message = 'Company branding saved.') => {
    setCompanyBranding((previous) => {
      const next = { ...previous, ...updates };
      writeStorage(COMPANY_BRANDING_STORAGE_KEY, next);
      return next;
    });
    setSaveMessage(message);
  };

  const persistDocumentWhiteLabel = (updates, message = 'Document white-label settings saved.') => {
    setDocumentWhiteLabel((previous) => {
      const next = { ...previous, ...updates };
      writeStorage(DOCUMENT_WHITELABEL_STORAGE_KEY, next);
      return next;
    });
    setSaveMessage(message);
  };

  const persistLogoFile = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        persistCompanyBranding({ logoUrl: reader.result }, 'Company logo updated.');
      }
    };
    reader.readAsDataURL(file);
  };

  const withMessage = (node) => (
    <div style={{ display: 'grid', gap: 10 }}>
      {saveMessage && <div style={{ fontSize: 12, color: t.textSecondary }}>{saveMessage}</div>}
      {node}
    </div>
  );

  const sectionStyle = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20, marginBottom: 18 };
  const title = (txt) => <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: t.text }}>{txt}</div>;
  const listRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 };
  const btn = (label, color = t.accent, onClick) => (
    <button type="button" onClick={onClick} style={{ padding: '8px 16px', background: color, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
  );
  const secBtn = (label, onClick) => (
    <button type="button" onClick={onClick} style={{ padding: '8px 16px', background: 'transparent', color: t.accent, border: `1px solid ${t.accent}`, borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{label}</button>
  );

  const updateCompanyListRows = (updater) => {
    setCompanyLists((previous) => {
      const currentRows = previous[selectedCompanyList] || [];
      return {
        ...previous,
        [selectedCompanyList]: updater(currentRows),
      };
    });
  };

  const addCompanyListValue = () => {
    updateCompanyListRows((rows) => ([
      ...rows,
      {
        id: `${selectedCompanyList.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
        value: 'New Value',
        grouping: '',
      },
    ]));
    setSaveMessage('List value added.');
  };

  const sortCompanyListByName = () => {
    updateCompanyListRows((rows) => [...rows].sort((a, b) => String(a.value || '').localeCompare(String(b.value || ''))));
    setSaveMessage('List sorted by name.');
  };

  const updateCompanyListRow = (rowId, field, value) => {
    updateCompanyListRows((rows) => rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const removeCompanyListRow = (rowId) => {
    updateCompanyListRows((rows) => rows.filter((row) => row.id !== rowId));
    setSaveMessage('List value removed.');
  };

  switch (action) {
    // ── Company & Org ─────────────────────────────────────────────────────────
    case 'Edit your company contact info':
    case 'Edit Company Info':
      return withMessage(
        <CompanyInfoForm
          initial={{
            company: companyBranding.companyName,
            address: companyBranding.address,
            phone: companyBranding.phone,
            email: companyBranding.email,
          }}
          onSave={(data) => {
            persistCompanyBranding({
              companyName: data.company,
              address: data.address,
              phone: data.phone,
              email: data.email,
            });
          }}
        />
      );
    case 'Edit your company insurance coverage':
      return (
        <div style={sectionStyle}>
          {title('Company Insurance Coverage')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'provider', label: 'Insurance Provider', placeholder: 'Carrier name' },
            { key: 'policyNumber', label: 'Policy Number', placeholder: 'POL-00012345' },
            { key: 'coverageLimit', label: 'Coverage Limit ($)', type: 'number', placeholder: '1000000' },
            { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
            { key: 'expirationDate', label: 'Expiration Date', type: 'date' },
          ]} />
        </div>
      );
    case 'Edit your dropdown lists':
      return withMessage(
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ ...sectionStyle, padding: 16 }}>
            <div style={{ fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>☰ Edit Company Lists</div>
            <div style={{ marginTop: 8, fontSize: 12, color: t.textSecondary }}>Home {'>'} Settings {'>'} Lists</div>
          </div>

          <div style={{ ...sectionStyle, padding: 14, display: 'grid', gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: t.textSecondary }}>Select a List</label>
            <select
              value={selectedCompanyList}
              onChange={(event) => setSelectedCompanyList(event.target.value)}
              style={{ minHeight: 38, borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '0 12px', fontSize: 14 }}
            >
              {listNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div style={{ ...sectionStyle, padding: 14, background: theme === 'dark' ? 'rgba(24,210,255,0.12)' : 'rgba(10,124,255,0.08)' }}>
            <div style={{ fontSize: 28, fontWeight: 300, marginBottom: 8 }}>Did you know?</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.65 }}>
              <li>All new values are added to the bottom of the list when you click the "Add New Value" button.</li>
              <li>Values are modified by clicking on the value you want to edit.</li>
              <li>Use the "order" value to reorder list items.</li>
              <li>Changes are saved automatically.</li>
            </ul>
          </div>

          <div style={{ ...sectionStyle, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => setSaveMessage('List settings opened.')} style={{ border: 'none', borderRight: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: 13, fontWeight: 600, padding: '10px 14px', cursor: 'pointer' }}>
                🔧 List Settings
              </button>
              <button type="button" onClick={addCompanyListValue} style={{ border: 'none', borderRight: `1px solid ${t.border}`, background: 'transparent', color: t.accent, fontSize: 13, fontWeight: 700, padding: '10px 14px', cursor: 'pointer' }}>
                + Add New Value
              </button>
              <button type="button" onClick={sortCompanyListByName} style={{ border: 'none', background: 'transparent', color: t.accent, fontSize: 13, fontWeight: 700, padding: '10px 14px', cursor: 'pointer' }}>
                ↻ Sort By Name
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '1rem' }}>
                <thead>
                  <tr style={{ background: t.bgAlt, color: t.textSecondary }}>
                    <th style={{ width: 80, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, textAlign: 'left' }}>Order</th>
                    <th style={{ padding: '8px 10px', borderBottom: `1px solid ${t.border}`, textAlign: 'left' }}>Value</th>
                    <th style={{ width: 220, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, textAlign: 'left' }}>Grouping</th>
                    <th style={{ width: 120, padding: '8px 10px', borderBottom: `1px solid ${t.border}`, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedListRows.map((row, index) => (
                    <tr key={row.id}>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}` }}>{index + 1}</td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}` }}>
                        <input
                          value={row.value}
                          onChange={(event) => updateCompanyListRow(row.id, 'value', event.target.value)}
                          style={{ width: '100%', minHeight: 32, borderRadius: 6, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '0 10px' }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}` }}>
                        <input
                          value={row.grouping}
                          onChange={(event) => updateCompanyListRow(row.id, 'grouping', event.target.value)}
                          style={{ width: '100%', minHeight: 32, borderRadius: 6, border: `1px solid ${t.border}`, background: t.surface, color: t.text, padding: '0 10px' }}
                        />
                      </td>
                      <td style={{ padding: '6px 10px', borderBottom: `1px solid ${t.border}`, textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => removeCompanyListRow(row.id)}
                          style={{ border: `1px solid ${t.error}`, color: t.error, background: 'transparent', borderRadius: 6, fontSize: 12, fontWeight: 700, padding: '5px 8px', cursor: 'pointer' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {selectedListRows.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: 14, textAlign: 'center', color: t.textSecondary, borderBottom: `1px solid ${t.border}` }}>
                        No values in this list.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    case 'Upload your company logo':
    case 'Upload Logo':
      return withMessage(
        <div style={sectionStyle}>
          {title('Upload Company Logo')}
          <LogoUpload onUpload={persistLogoFile} />
          {companyBranding.logoUrl && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, color: t.textSecondary, marginBottom: 6 }}>Current logo on documents:</div>
              <img src={companyBranding.logoUrl} alt="Current company logo" style={{ maxHeight: 72, maxWidth: 280, objectFit: 'contain' }} />
            </div>
          )}
        </div>
      );
    case 'Customize the default currency and units of measure for your location':
    case 'Currency & Units Settings':
      return <CurrencyUnitsForm onSave={save} />;
    case 'Set Default Target Gross Margins':
    case 'Default Margin Targets':
      return <DefaultMarginTargets onSave={save} />;
    case 'Configure your default routing options':
    case 'Routing Defaults':
      return <RoutingDefaults onSave={save} />;
    case 'Configure your alerts':
    case 'Notification Settings':
      return <NotificationSettings onSave={save} />;
    case 'Automated Workflow Engine':
      return <WorkflowAutomationEnginePanel t={t} onSave={save} />;
    case 'Edit Driver Pay Settings':
      return (
        <div style={sectionStyle}>
          {title('Driver Pay Settings')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'payModel', label: 'Default Pay Model', type: 'select', options: ['Per Mile', 'Percentage', 'Hourly'], default: 'Per Mile' },
            { key: 'baseRate', label: 'Base Pay Rate', type: 'number', placeholder: '0.65' },
            { key: 'detentionPay', label: 'Detention Pay ($/hr)', type: 'number', placeholder: '25' },
            { key: 'layoverPay', label: 'Layover Pay ($/day)', type: 'number', placeholder: '150' },
            { key: 'bonusPolicy', label: 'Bonus Policy', type: 'textarea', default: 'On-time delivery bonus: $50 per qualifying load' },
          ]} />
        </div>
      );

    // ── Users & Permissions ───────────────────────────────────────────────────
    case 'Add/Edit Users':
      return <UserManagement />;
    case 'Manage Roles':
      return <RoleManagement />;
    case 'Permission Groups':
      return (
        <div style={sectionStyle}>
          {title('Permission Groups')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'name', label: 'Group Name', placeholder: 'e.g. Finance Team' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'access', label: 'Access Level', type: 'select', options: ['Read Only', 'Standard', 'Admin', 'Full Access'], default: 'Standard' },
          ]} />
        </div>
      );
    case 'Commission Overrides':
      return (
        <div style={sectionStyle}>
          {title('Commission Overrides')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'agent', label: 'Agent Name', placeholder: 'e.g. Sarah Martinez' },
            { key: 'baseRate', label: 'Base Commission Rate (%)', type: 'number', placeholder: '10' },
            { key: 'overrideRate', label: 'Override Rate (%)', type: 'number', placeholder: '12' },
            { key: 'effectiveDate', label: 'Effective Date', type: 'date' },
          ]} />
        </div>
      );
    case 'Branch Management':
      return (
        <div style={sectionStyle}>
          {title('Branch Management')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'name', label: 'Branch Name', placeholder: 'e.g. Chicago Office' },
            { key: 'code', label: 'Branch Code', placeholder: 'e.g. CHI-01' },
            { key: 'address', label: 'Address', placeholder: '123 Main St' },
            { key: 'manager', label: 'Branch Manager', placeholder: 'Full name' },
            { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1 (555) 000-0000' },
          ]} />
        </div>
      );

    // ── Load & Freight ────────────────────────────────────────────────────────
    case 'Load Numbering Rules':
      return (
        <div style={sectionStyle}>
          {title('Load Numbering Rules')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'prefix', label: 'Prefix', placeholder: 'e.g. LD-' },
            { key: 'startNum', label: 'Starting Number', type: 'number', placeholder: '1000' },
            { key: 'padding', label: 'Zero Padding (digits)', type: 'number', placeholder: '6' },
            { key: 'resetFrequency', label: 'Reset Frequency', type: 'select', options: ['Never', 'Annually', 'Monthly'], default: 'Never' },
          ]} />
        </div>
      );
    case 'Manifest Settings':
      return (
        <div style={sectionStyle}>
          {title('Manifest Settings')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'autoGenerate', label: 'Auto-Generate Manifests', type: 'select', options: ['On Load Create', 'On Dispatch', 'Manual Only'], default: 'On Dispatch' },
            { key: 'includeDriver', label: 'Include Driver Signature Line', type: 'select', options: ['Yes', 'No'], default: 'Yes' },
            { key: 'copies', label: 'Default Print Copies', type: 'number', placeholder: '2' },
            { key: 'footer', label: 'Footer Text', type: 'textarea' },
          ]} />
        </div>
      );
    case 'Default Equipment Types':
      return (
        <div style={sectionStyle}>
          {title('Default Equipment Types')}
          <ToggleList t={t} items={[
            { key: 'van', label: 'Dry Van', desc: 'Standard enclosed trailer' },
            { key: 'reefer', label: 'Refrigerated (Reefer)', desc: 'Temperature-controlled' },
            { key: 'flatbed', label: 'Flatbed', desc: 'Open-deck trailer' },
            { key: 'stepDeck', label: 'Step Deck', desc: 'Low-clearance freight' },
            { key: 'ltl', label: 'LTL', desc: 'Less-than-truckload' },
            { key: 'tanker', label: 'Tanker', desc: 'Liquid freight' },
          ]} />
        </div>
      );
    case 'Workflow Automation Rules':
      return <WorkflowAutomationEnginePanel t={t} onSave={save} />;
    case 'Rate Logic Configuration':
      return (
        <div style={sectionStyle}>
          {title('Rate Logic Configuration')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'baseMethod', label: 'Base Rate Method', type: 'select', options: ['Per Mile', 'Flat Rate', 'Percentage of Linehaul'], default: 'Per Mile' },
            { key: 'fuelSurcharge', label: 'Fuel Surcharge (%)', type: 'number', placeholder: '8.5' },
            { key: 'detentionRate', label: 'Detention Rate ($/hr)', type: 'number', placeholder: '75' },
            { key: 'layoverRate', label: 'Layover Rate ($/day)', type: 'number', placeholder: '250' },
            { key: 'tolerancePct', label: 'Overcharge Tolerance (%)', type: 'number', placeholder: '3' },
          ]} />
        </div>
      );

    // ── Audit & Financial ─────────────────────────────────────────────────────
    case 'Accessorial Validation Rules':
      return (
        <div style={sectionStyle}>
          {title('Accessorial Validation Rules')}
          <ToggleList t={t} items={[
            { key: 'liftgate', label: 'Validate Liftgate Charges', desc: 'Flag if liftgate billed without appointment note' },
            { key: 'detention', label: 'Validate Detention Charges', desc: 'Cross-check against ELD data' },
            { key: 'fuel', label: 'Validate Fuel Surcharge', desc: 'Compare against weekly DOE index' },
            { key: 'residential', label: 'Validate Residential Delivery', desc: 'Confirm delivery address type' },
            { key: 'hazmat', label: 'Validate Hazmat Fees', desc: 'Require manifest documentation' },
          ]} />
        </div>
      );
    case 'Carrier Overcharge Thresholds':
      return (
        <div style={sectionStyle}>
          {title('Carrier Overcharge Thresholds')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'warnPct', label: 'Warning Threshold (%)', type: 'number', placeholder: '5', default: '5' },
            { key: 'flagPct', label: 'Flag for Review (%)', type: 'number', placeholder: '10', default: '10' },
            { key: 'blockPct', label: 'Block Payment (%)', type: 'number', placeholder: '20', default: '20' },
            { key: 'notifyEmail', label: 'Notify Email on Flag', type: 'email', placeholder: 'billing@company.com' },
          ]} />
        </div>
      );
    case 'Invoice Audit Settings':
      return (
        <div style={sectionStyle}>
          {title('Invoice Audit Settings')}
          <ToggleList t={t} items={[
            { key: 'dupeCheck', label: 'Duplicate Invoice Detection', desc: 'Flag invoices with same carrier + amount within 30 days', default: true },
            { key: 'rateConf', label: 'Rate Confirmation Matching', desc: 'Require matching rate confirmation on file', default: true },
            { key: 'podRequired', label: 'POD Required for Payment', desc: 'Block payment until POD uploaded', default: true },
            { key: 'autoApprove', label: 'Auto-Approve Clean Invoices', desc: 'Auto-approve if no exceptions detected', default: false },
          ]} />
        </div>
      );
    case 'Profit Margin Alerts':
      return (
        <div style={sectionStyle}>
          {title('Profit Margin Alerts')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'targetMargin', label: 'Target Margin (%)', type: 'number', placeholder: '18', default: '18' },
            { key: 'warnBelow', label: 'Warn Below (%)', type: 'number', placeholder: '12', default: '12' },
            { key: 'alertBelow', label: 'Alert Below (%)', type: 'number', placeholder: '8', default: '8' },
            { key: 'notifyManager', label: 'Notify Manager', type: 'select', options: ['Always', 'On Alert Only', 'Never'], default: 'On Alert Only' },
          ]} />
        </div>
      );
    case 'Payment Terms Settings':
      return (
        <div style={sectionStyle}>
          {title('Payment Terms Settings')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'carrierTerms', label: 'Default Carrier Payment Terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 45', 'QuickPay 2%/10'], default: 'Net 30' },
            { key: 'customerTerms', label: 'Default Customer Invoice Terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 45', 'Net 60'], default: 'Net 30' },
            { key: 'lateFee', label: 'Late Fee (%)', type: 'number', placeholder: '1.5' },
            { key: 'graceDays', label: 'Grace Period (days)', type: 'number', placeholder: '5' },
          ]} />
        </div>
      );

    // ── Documents & Reporting ─────────────────────────────────────────────────
    case 'Carrier Confirmations':
      return withMessage(
        <div style={sectionStyle}>
          {title('Carrier Confirmation Template')}
          <SimpleForm t={t} onSave={(data) => persistDocumentWhiteLabel({
            confirmationHeader: data.header,
            rateConfirmationTerms: data.terms,
            signatureLine: data.signatureLine,
            sendMethod: data.sendMethod,
          })} fields={[
            { key: 'header', label: 'Confirmation Header', placeholder: 'Rate Confirmation', default: documentWhiteLabel.confirmationHeader },
            { key: 'terms', label: 'Terms & Conditions', type: 'textarea', default: documentWhiteLabel.rateConfirmationTerms },
            { key: 'signatureLine', label: 'Signature Line Label', placeholder: 'Authorized Carrier Signature', default: documentWhiteLabel.signatureLine },
            { key: 'sendMethod', label: 'Send Method', type: 'select', options: ['Email', 'Fax', 'Portal', 'All'], default: documentWhiteLabel.sendMethod || 'Email' },
          ]} />
        </div>
      );
    case 'Invoice Templates':
      return withMessage(
        <div style={sectionStyle}>
          {title('Invoice Templates')}
          <SimpleForm t={t} onSave={(data) => persistDocumentWhiteLabel({
            invoiceTemplate: data.template,
            showLogo: data.showLogo,
            paymentInstructions: data.paymentInstructions,
            footerNote: data.footerNote,
          })} fields={[
            { key: 'template', label: 'Default Template', type: 'select', options: ['Standard', 'Detailed', 'Summary', 'Custom'], default: documentWhiteLabel.invoiceTemplate || 'Standard' },
            { key: 'showLogo', label: 'Show Company Logo', type: 'select', options: ['Yes', 'No'], default: documentWhiteLabel.showLogo || 'Yes' },
            { key: 'paymentInstructions', label: 'Payment Instructions', type: 'textarea', default: documentWhiteLabel.paymentInstructions },
            { key: 'footerNote', label: 'Footer Note', type: 'textarea', default: documentWhiteLabel.footerNote },
          ]} />
        </div>
      );
    case 'Bill of Lading Defaults':
      return withMessage(
        <div style={sectionStyle}>
          {title('Bill of Lading Defaults')}
          <SimpleForm t={t} onSave={(data) => persistDocumentWhiteLabel({
            bolPrefix: data.bolPrefix,
            shipperName: data.shipper,
            shipperAddress: data.shipperAddr,
            freightTerms: data.terms,
            specialInstructions: data.specialInstructions,
          })} fields={[
            { key: 'bolPrefix', label: 'BOL Number Prefix', placeholder: 'BOL-', default: documentWhiteLabel.bolPrefix || 'BOL-' },
            { key: 'shipper', label: 'Default Shipper Name', placeholder: 'Company name', default: documentWhiteLabel.shipperName || companyBranding.companyName },
            { key: 'shipperAddr', label: 'Default Shipper Address', placeholder: '123 Main St', default: documentWhiteLabel.shipperAddress || companyBranding.address },
            { key: 'terms', label: 'Default Freight Terms', type: 'select', options: ['Prepaid', 'Collect', '3rd Party'], default: documentWhiteLabel.freightTerms || 'Prepaid' },
            { key: 'specialInstructions', label: 'Special Instructions', type: 'textarea', default: documentWhiteLabel.specialInstructions },
          ]} />
        </div>
      );
    case 'Font & Branding Settings':
      return withMessage(
        <div style={sectionStyle}>
          {title('Font & Branding Settings')}
          <SimpleForm t={t} onSave={(data) => {
            persistDocumentWhiteLabel({
              primaryFont: data.primaryFont,
              primaryColor: data.primaryColor,
              accentColor: data.accentColor,
              logoPosition: data.logoPosition,
            });
            persistCompanyBranding({
              accentColor: data.primaryColor || companyBranding.accentColor,
            }, 'Brand colors saved.');
          }} fields={[
            { key: 'primaryFont', label: 'Primary Font', type: 'select', options: ['Inter', 'Roboto', 'Open Sans', 'Exo 2', 'Helvetica'], default: documentWhiteLabel.primaryFont || 'Inter' },
            { key: 'primaryColor', label: 'Primary Brand Color (hex)', placeholder: '#0a7cff', default: documentWhiteLabel.primaryColor || companyBranding.accentColor },
            { key: 'accentColor', label: 'Accent Color (hex)', placeholder: '#18d2ff', default: documentWhiteLabel.accentColor || '#5ec8ff' },
            { key: 'logoPosition', label: 'Logo Position on Documents', type: 'select', options: ['Top Left', 'Top Center', 'Top Right'], default: documentWhiteLabel.logoPosition || 'Top Left' },
          ]} />
        </div>
      );
    case 'Reporting Configuration':
      return (
        <div style={sectionStyle}>
          {title('Reporting Configuration')}
          <SimpleForm t={t} onSave={save} fields={[
            { key: 'defaultPeriod', label: 'Default Report Period', type: 'select', options: ['Last 7 Days', 'Last 30 Days', 'Last Quarter', 'YTD'], default: 'Last 30 Days' },
            { key: 'exportFormat', label: 'Default Export Format', type: 'select', options: ['CSV', 'XLSX', 'PDF'], default: 'XLSX' },
            { key: 'scheduledEmail', label: 'Scheduled Report Email', type: 'email', placeholder: 'reports@company.com' },
            { key: 'frequency', label: 'Delivery Frequency', type: 'select', options: ['Daily', 'Weekly', 'Monthly', 'Off'], default: 'Weekly' },
          ]} />
        </div>
      );
    case 'Operator Email Templates':
      return (
        <div style={sectionStyle}>
          {title('Operator Email Templates')}
          <OperatorEmailTemplatesPanel t={t} />
        </div>
      );

    // ── Billing & Subscription ─────────────────────────────────────────────────
    case 'View Current Plan':
      return (
        <div>
          <div style={sectionStyle}>
            {title('Current Subscription Plan')}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>Professional Plan</div>
                <div style={{ fontSize: 13, color: t.textSecondary }}>$499/month • Unlimited users • Advanced analytics • Priority support</div>
              </div>
              <span style={{ background: '#10b981', color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>Active</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Next Billing Date', 'Mar 1, 2026'], ['Seats Used', '8 / Unlimited'], ['Storage', '42 GB / 500 GB'], ['API Calls', '12,400 / month']].map(([k, v]) => (
                <div key={k} style={{ background: t.bgAlt, borderRadius: 6, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: t.textSecondary, fontWeight: 600 }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 'Upgrade Plan':
      return (
        <div style={{ display: 'grid', gap: 12 }}>
          {[
            { name: 'Starter', price: '$99/mo', features: ['5 Users', 'Basic Analytics', 'Email Support'], current: false },
            { name: 'Professional', price: '$499/mo', features: ['Unlimited Users', 'Advanced Analytics', 'Priority Support', 'API Access'], current: true },
            { name: 'Enterprise', price: 'Custom', features: ['Custom Integrations', 'Dedicated Success Manager', 'SLA Guarantee', 'White Labeling'], current: false },
          ].map(plan => (
            <div key={plan.name} style={{ ...sectionStyle, border: plan.current ? `2px solid ${t.accent}` : `1px solid ${t.border}`, position: 'relative' }}>
              {plan.current && <span style={{ position: 'absolute', top: 12, right: 12, background: t.accent, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>Current</span>}
              <div style={{ fontSize: 16, fontWeight: 700 }}>{plan.name} — {plan.price}</div>
              <ul style={{ margin: '10px 0 12px 0', paddingLeft: 18, color: t.textSecondary, fontSize: 13 }}>
                {plan.features.map(f => <li key={f}>{f}</li>)}
              </ul>
              {!plan.current && <button style={{ padding: '8px 18px', background: t.accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Select Plan</button>}
            </div>
          ))}
        </div>
      );
    case 'Payment Methods':
      return (
        <div style={sectionStyle}>
          {title('Payment Methods')}
          <div style={{ ...listRow, marginBottom: 4 }}>
            <div><div style={{ fontWeight: 600 }}>Visa ending in 4242</div><div style={{ fontSize: 12, color: t.textSecondary }}>Expires 12/27 • Default</div></div>
            {secBtn('Remove')}
          </div>
          <div style={{ marginTop: 16 }}>{btn('+ Add Payment Method', t.accent)}</div>
        </div>
      );
    case 'Usage Limits':
      return (
        <div style={sectionStyle}>
          {title('Usage Limits')}
          {[['API Calls', 12400, 50000], ['Storage', 42, 500], ['Users', 8, 9999], ['Uploads', 340, 1000]].map(([label, used, max]) => (
            <div key={label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{label}</span>
                <span style={{ color: t.textSecondary }}>{used.toLocaleString()} / {max === 9999 ? 'Unlimited' : max.toLocaleString()}</span>
              </div>
              <div style={{ height: 8, background: t.border, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, (used / max) * 100)}%`, background: used / max > 0.8 ? '#ef4444' : t.accent, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      );
    case 'Feature Access Controls':
      return (
        <div style={sectionStyle}>
          {title('Feature Access Controls')}
          <ToggleList t={t} items={[
            { key: 'rateLogic', label: 'Rate Logic Tool', desc: 'Access to rate calculation engine' },
            { key: 'laneIntel', label: 'Lane Intelligence', desc: 'Market data and lane analytics' },
            { key: 'fleetDash', label: 'Fleet Dashboard', desc: 'Driver and vehicle management' },
            { key: 'apiAccess', label: 'API Access', desc: 'External API key generation' },
            { key: 'bulkExport', label: 'Bulk Export', desc: 'Export large datasets as CSV/XLSX' },
            { key: 'aiBot', label: 'AI Assistant', desc: 'Copilot chat assistant' },
          ]} />
        </div>
      );

    default:
      return <div style={{ color: t.textSecondary, fontSize: 13 }}>Select an action to begin configuration.</div>;
  }
}

// ── Account & Profile Panel ──────────────────────────────────────────────────

function AccountProfilePanel({ activeAction, t, theme, setTheme, settings, setAdvancedSetting, availablePalettes }) {
  const tabFromAction = (a) => {
    if (['Team Management', 'Billing & Plan', 'Integrations', 'API Keys', 'Preferences'].includes(a)) return a;
    return 'Profile';
  };
  const [tab, setTab] = useState(tabFromAction(activeAction));
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamMessage, setTeamMessage] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', role: 'user' });
  // Theme Center section open states
  const [isModeOpen, setIsModeOpen] = useState(true);
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(true);

  const fontScale = Number.isFinite(Number(settings?.fontScale)) ? Number(settings.fontScale) : 1;
  const fontWeight = Number.isFinite(Number(settings?.fontWeight)) ? Number(settings.fontWeight) : 600;
  const effectsStrength = Number.isFinite(Number(settings?.effectsStrength)) ? Number(settings.effectsStrength) : 1;

  const applyThemeStage = (stage) => {
    if (stage === 'subtle') {
      setAdvancedSetting('fontScale', 0.95);
      setAdvancedSetting('fontWeight', 500);
      setAdvancedSetting('effectsStrength', 0.8);
      return;
    }
    if (stage === 'intense') {
      setAdvancedSetting('fontScale', 1.05);
      setAdvancedSetting('fontWeight', 650);
      setAdvancedSetting('effectsStrength', 1.25);
      return;
    }
    setAdvancedSetting('fontScale', 1);
    setAdvancedSetting('fontWeight', 600);
    setAdvancedSetting('effectsStrength', 1);
  };

  const currentThemeStage = (() => {
    if (fontScale >= 1.04 && fontWeight >= 640 && effectsStrength >= 1.2) return 'intense';
    if (fontScale <= 0.96 && fontWeight <= 540 && effectsStrength <= 0.85) return 'subtle';
    return 'balanced';
  })();

  useEffect(() => {
    setTab(tabFromAction(activeAction));
  }, [activeAction]);

  useEffect(() => {
    let mounted = true;

    const loadTeamMembers = async () => {
      if (tab !== 'Team Management') return;
      setTeamLoading(true);
      const res = await getUsers();
      if (!mounted) return;

      if (res?.error) {
        setTeamMessage(res.error);
      } else {
        setTeamMembers(Array.isArray(res?.users) ? res.users : []);
        setTeamMessage('');
      }
      setTeamLoading(false);
    };

    loadTeamMembers();
    return () => {
      mounted = false;
    };
  }, [tab]);

  const handleInviteChange = (event) => {
    const { name, value } = event.target;
    setInviteForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleInviteSubmit = async (event) => {
    event.preventDefault();
    setTeamMessage('');
    setTeamLoading(true);

    const res = await register({
      name: inviteForm.name.trim(),
      email: inviteForm.email.trim(),
      password: inviteForm.password,
      role: inviteForm.role,
    });

    if (res?.error) {
      setTeamMessage(res.error);
      setTeamLoading(false);
      return;
    }

    const created = res?.user;
    if (created) {
      setTeamMembers((previous) => [...previous, created]);
    }
    setTeamMessage('Team member invited successfully.');
    setInviteForm({ name: '', email: '', password: '', role: 'user' });
    setShowInviteForm(false);
    setTeamLoading(false);
  };

  const beginEditMember = (user) => {
    setEditingUserId(user.id);
    setEditForm({
      name: String(user.name || ''),
      role: user.role === 'admin' ? 'admin' : 'user',
    });
    setTeamMessage('');
  };

  const cancelEditMember = () => {
    setEditingUserId(null);
    setEditForm({ name: '', role: 'user' });
  };

  const saveEditMember = async (userId) => {
    setTeamMessage('');
    setTeamLoading(true);

    const res = await updateUser(userId, {
      name: editForm.name.trim(),
      role: editForm.role,
    });

    if (res?.error) {
      setTeamMessage(res.error);
      setTeamLoading(false);
      return;
    }

    const updated = res?.user;
    if (updated) {
      setTeamMembers((previous) => previous.map((user) => (user.id === updated.id ? updated : user)));
    }
    setTeamMessage('Team member updated successfully.');
    cancelEditMember();
    setTeamLoading(false);
  };

  const tabs = ['Profile', 'Team Management', 'Billing & Plan', 'Integrations', 'API Keys', 'Preferences'];
  const tabStyle = (active) => ({
    padding: '10px 16px', fontSize: 13, fontWeight: active ? 600 : 500,
    color: active ? t.accent : t.textSecondary,
    borderBottom: `2px solid ${active ? t.accent : 'transparent'}`,
    border: 'none', background: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  });
  const sec = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 20, marginBottom: 16 };
  const secTitle = (txt) => <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{txt}</div>;
  const fg2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 };
  const lbl = { fontSize: 12, fontWeight: 600, color: t.textSecondary, marginBottom: 4, display: 'block' };
  const inp = { padding: '8px 10px', borderRadius: 6, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, fontSize: 13, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
  const primaryBtn = { padding: '9px 20px', background: t.accent, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' };
  const secBtn = { ...primaryBtn, background: 'transparent', color: t.accent, border: `1px solid ${t.accent}` };
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${t.border}`, fontSize: 13 };

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${t.border}`, marginBottom: 20, overflowX: 'auto' }}>
        {tabs.map(tb => <button key={tb} style={tabStyle(tab === tb)} onClick={() => setTab(tb)}>{tb}</button>)}
      </div>

      {tab === 'Profile' && (
        <>
          <div style={sec}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0 }}>JA</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Joseph Abbinante</div>
                <div style={{ fontSize: 13, color: t.textSecondary }}>Admin • joseph@opscale.ai</div>
                <button style={{ ...secBtn, padding: '5px 12px', fontSize: 12, marginTop: 6 }}>Change Avatar</button>
              </div>
            </div>
            {secTitle('Personal Information')}
            <div style={fg2}>
              <div><label style={lbl}>First Name</label><input type="text" style={inp} defaultValue="Joseph" /></div>
              <div><label style={lbl}>Last Name</label><input type="text" style={inp} defaultValue="Abbinante" /></div>
            </div>
            <div style={fg2}>
              <div><label style={lbl}>Email</label><input type="email" style={inp} defaultValue="joseph@opscale.ai" /></div>
              <div><label style={lbl}>Phone</label><input type="tel" style={inp} placeholder="+1 (555) 000-0000" /></div>
            </div>
            <button style={primaryBtn}>Save Changes</button>
          </div>
          <div style={sec}>
            {secTitle('Company Information')}
            <div style={fg2}>
              <div><label style={lbl}>Company Name</label><input type="text" style={inp} defaultValue="Opscale Supply Chain" /></div>
              <div><label style={lbl}>Website</label><input type="url" style={inp} defaultValue="https://opscale.ai" /></div>
            </div>
            <div style={fg2}>
              <div><label style={lbl}>EIN</label><input type="text" style={inp} placeholder="XX-XXXXXXX" /></div>
              <div><label style={lbl}>Address</label><input type="text" style={inp} placeholder="123 Business St" /></div>
            </div>
            <button style={primaryBtn}>Save Changes</button>
          </div>
          <div style={sec}>
            {secTitle('Security')}
            <div style={fg2}>
              <div><label style={lbl}>Current Password</label><input type="password" style={inp} placeholder="••••••••" /></div>
              <div><label style={lbl}>New Password</label><input type="password" style={inp} placeholder="••••••••" /></div>
            </div>
            <button style={primaryBtn}>Update Password</button>
          </div>
        </>
      )}

      {tab === 'Team Management' && (
        <>
          <div style={sec}>
            {secTitle('Team Members')}
            <div style={{ marginBottom: 14 }}>
              <button style={primaryBtn} onClick={() => setShowInviteForm((value) => !value)}>
                {showInviteForm ? 'Cancel Invite' : '+ Invite Team Member'}
              </button>
            </div>
            {showInviteForm && (
              <form onSubmit={handleInviteSubmit} style={{ marginBottom: 16, border: `1px solid ${t.border}`, borderRadius: 8, padding: 12, background: t.bgAlt }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input
                    name="name"
                    type="text"
                    value={inviteForm.name}
                    onChange={handleInviteChange}
                    placeholder="Full name"
                    style={inp}
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={handleInviteChange}
                    placeholder="Email"
                    style={inp}
                    required
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <input
                    name="password"
                    type="password"
                    value={inviteForm.password}
                    onChange={handleInviteChange}
                    placeholder="Temporary password"
                    minLength={8}
                    style={inp}
                    required
                  />
                  <select
                    name="role"
                    value={inviteForm.role}
                    onChange={handleInviteChange}
                    style={inp}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" style={primaryBtn} disabled={teamLoading}>
                  {teamLoading ? 'Inviting...' : 'Invite Team Member'}
                </button>
              </form>
            )}

            {teamMessage && (
              <div style={{ marginBottom: 10, fontSize: 12, color: teamMessage.toLowerCase().includes('success') ? 'var(--success)' : 'var(--error)' }}>
                {teamMessage}
              </div>
            )}

            {teamMembers.map((u) => (
              <div key={u.id || u.email} style={row}>
                <div>
                  {editingUserId === u.id ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(event) => setEditForm((previous) => ({ ...previous, name: event.target.value }))}
                      style={{ ...inp, minWidth: 200, marginBottom: 6 }}
                    />
                  ) : (
                    <div style={{ fontWeight: 600 }}>{u.name || '—'}</div>
                  )}
                  <div style={{ fontSize: 12, color: t.textSecondary }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {editingUserId === u.id ? (
                    <select
                      value={editForm.role}
                      onChange={(event) => setEditForm((previous) => ({ ...previous, role: event.target.value }))}
                      style={{ ...inp, width: 110 }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: t.textSecondary, textTransform: 'capitalize' }}>{u.role || 'user'}</span>
                  )}
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#10b981' }}>Active</span>
                  {editingUserId === u.id ? (
                    <>
                      <button
                        type="button"
                        style={{ ...primaryBtn, padding: '4px 10px', fontSize: 11 }}
                        onClick={() => saveEditMember(u.id)}
                        disabled={teamLoading}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        style={{ ...secBtn, padding: '4px 10px', fontSize: 11 }}
                        onClick={cancelEditMember}
                        disabled={teamLoading}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      style={{ ...secBtn, padding: '4px 10px', fontSize: 11 }}
                      onClick={() => beginEditMember(u)}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
            {!teamLoading && teamMembers.length === 0 && !teamMessage && (
              <div style={{ fontSize: 12, color: t.textSecondary }}>No team members found yet.</div>
            )}
          </div>
        </>
      )}

      {tab === 'Billing & Plan' && (
        <>
          <div style={sec}>
            {secTitle('Current Plan')}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Professional Plan</div>
                <div style={{ fontSize: 13, color: t.textSecondary }}>$499/month • Unlimited users • Advanced analytics</div>
              </div>
              <span style={{ background: '#10b981', color: '#fff', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>Active</span>
            </div>
            <button style={secBtn}>Change Plan</button>
          </div>
          <div style={sec}>
            {secTitle('Billing History')}
            {[['Feb 1, 2026', 'Monthly subscription', '$499.00'], ['Jan 1, 2026', 'Monthly subscription', '$499.00'], ['Dec 1, 2025', 'Monthly subscription', '$499.00']].map(([date, desc, amount]) => (
              <div key={date} style={row}>
                <div><div style={{ fontWeight: 600 }}>{date}</div><div style={{ fontSize: 12, color: t.textSecondary }}>{desc}</div></div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600 }}>{amount}</span>
                  <button style={{ ...secBtn, padding: '4px 10px', fontSize: 11 }}>Receipt</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'Integrations' && (
        <div style={sec}>
          {secTitle('Connected Integrations')}
          {[
            { name: 'Stripe', desc: 'Payment processing', status: 'Connected' },
            { name: 'Slack', desc: 'Notifications & alerts', status: 'Connected' },
            { name: 'Google Sheets', desc: 'Data export', status: 'Not Connected' },
            { name: 'QuickBooks', desc: 'Accounting sync', status: 'Not Connected' },
            { name: 'Twilio', desc: 'SMS alerts', status: 'Not Connected' },
          ].map(int => (
            <div key={int.name} style={row}>
              <div>
                <div style={{ fontWeight: 600 }}>{int.name}</div>
                <div style={{ fontSize: 12, color: t.textSecondary }}>{int.desc}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: int.status === 'Connected' ? '#10b981' : t.textSecondary }}>{int.status}</span>
                <button style={{ ...secBtn, padding: '4px 10px', fontSize: 11 }}>{int.status === 'Connected' ? 'Configure' : 'Connect'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'API Keys' && (
        <div style={sec}>
          {secTitle('API Keys')}
          <div style={{ background: t.bgAlt, borderRadius: 6, padding: 14, fontSize: 12, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>sk_live_4eC39Hq••••••••••••j81e</strong>
                <div style={{ color: t.textSecondary, marginTop: 4 }}>Created Jan 15, 2026 • Last used 2 days ago</div>
              </div>
              <button style={{ ...secBtn, padding: '4px 10px', fontSize: 11 }}>Revoke</button>
            </div>
          </div>
          <button style={primaryBtn}>+ Generate New Key</button>
        </div>
      )}

      {tab === 'Preferences' && (
        <>
          {/* 1. Mode Section */}
          <div style={sec}>
            <button
              type="button"
              onClick={() => setIsModeOpen((v) => !v)}
              style={{ width: '100%', border: 'none', background: 'transparent', color: t.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, cursor: 'pointer' }}
            >
              {secTitle('Theme Mode')}
              <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 700 }}>{isModeOpen ? '− Collapse' : '+ Expand'}</span>
            </button>
            {isModeOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Theme</span>
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                  {['light', 'dark'].map(th => (
                    <button key={th} onClick={() => setTheme(th)} style={{
                      padding: '6px 16px', borderRadius: 6, border: `1px solid ${theme === th ? t.accent : t.border}`,
                      background: theme === th ? t.accent : 'transparent', color: theme === th ? '#fff' : t.textSecondary,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                    }}>{th === 'light' ? '☀️ Light' : '🌙 Dark'}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Palette Section */}
          <div style={sec}>
            <button
              type="button"
              onClick={() => setIsPaletteOpen((v) => !v)}
              style={{ width: '100%', border: 'none', background: 'transparent', color: t.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, cursor: 'pointer' }}
            >
              {secTitle('Theme Palette')}
              <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 700 }}>{isPaletteOpen ? '− Collapse' : '+ Expand'}</span>
            </button>
            {isPaletteOpen && (
              <div style={{ padding: '10px 0' }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Select Palette</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(availablePalettes || []).map((paletteOption) => (
                    <button
                      key={paletteOption.id}
                      type="button"
                      onClick={() => setTheme(paletteOption.id)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: `1px solid ${settings?.palette === paletteOption.id ? t.accent : t.border}`,
                        background: settings?.palette === paletteOption.id ? t.accent : 'transparent',
                        color: settings?.palette === paletteOption.id ? '#fff' : t.textSecondary,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {paletteOption.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Surface & Layer Preview Section */}
          <div style={sec}>
            <button
              type="button"
              onClick={() => setIsPreviewOpen((v) => !v)}
              style={{ width: '100%', border: 'none', background: 'transparent', color: t.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, cursor: 'pointer' }}
            >
              {secTitle('Surface & Layer Preview')}
              <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 700 }}>{isPreviewOpen ? '− Collapse' : '+ Expand'}</span>
            </button>
            {isPreviewOpen && (
              <div style={{ padding: '10px 0' }}>
                {/* Placeholder for live mini preview and visual mode cards */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ width: 80, height: 60, borderRadius: 8, background: t.surface, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary, fontSize: 12 }}>Surface</div>
                  <div style={{ width: 80, height: 60, borderRadius: 8, background: t.bgAlt, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary, fontSize: 12 }}>Alt</div>
                  <div style={{ width: 80, height: 60, borderRadius: 8, background: t.bg, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary, fontSize: 12 }}>BG</div>
                  <div style={{ width: 80, height: 60, borderRadius: 8, background: t.accent, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12 }}>Accent</div>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: t.textSecondary }}>Preview of key surfaces and accent color for the selected palette and mode.</div>
              </div>
            )}
          </div>

          {/* 4. Advanced Controls Section */}
          <div style={sec}>
            <button
              type="button"
              onClick={() => setIsAdvancedOpen((v) => !v)}
              style={{ width: '100%', border: 'none', background: 'transparent', color: t.text, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 0, cursor: 'pointer' }}
            >
              {secTitle('Advanced Controls')}
              <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 700 }}>{isAdvancedOpen ? '− Collapse' : '+ Expand'}</span>
            </button>
            {isAdvancedOpen && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>Theme Stage</span>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    {[
                      { key: 'subtle', label: 'Subtle' },
                      { key: 'balanced', label: 'Balanced' },
                      { key: 'intense', label: 'Intense' },
                    ].map((stage) => (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => applyThemeStage(stage.key)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: `1px solid ${currentThemeStage === stage.key ? t.accent : t.border}`,
                          background: currentThemeStage === stage.key ? t.accent : 'transparent',
                          color: currentThemeStage === stage.key ? '#fff' : t.textSecondary,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {stage.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '10px 0', borderTop: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Font Size</span>
                    <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600 }}>{Math.round(fontScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="90"
                    max="120"
                    step="5"
                    value={Math.round(fontScale * 100)}
                    onChange={(event) => setAdvancedSetting('fontScale', Number(event.target.value) / 100)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ padding: '10px 0', borderTop: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Font Heaviness</span>
                    <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600 }}>{Math.round(fontWeight)}</span>
                  </div>
                  <input
                    type="range"
                    min="400"
                    max="700"
                    step="50"
                    value={Math.round(fontWeight)}
                    onChange={(event) => setAdvancedSetting('fontWeight', Number(event.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ padding: '10px 0', borderTop: `1px solid ${t.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>Page Effects Heaviness</span>
                    <span style={{ fontSize: 12, color: t.textSecondary, fontWeight: 600 }}>{Math.round(effectsStrength * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={Math.round(effectsStrength * 100)}
                    onChange={(event) => setAdvancedSetting('effectsStrength', Number(event.target.value) / 100)}
                    style={{ width: '100%' }}
                  />
                </div>
              </>
            )}
          </div>
          <div style={sec}>
            {secTitle('Notifications')}
            <ToggleList t={t} items={[
              { key: 'emailExceptions', label: 'Email Alerts on Exceptions', desc: 'Get notified when rate issues are detected' },
              { key: 'weeklyReports', label: 'Weekly Summary Reports', desc: 'Summary of loads, revenue, and margins' },
              { key: 'invoiceReady', label: 'Invoice Ready Notifications', desc: 'Alert when new invoices are awaiting review' },
              { key: 'smsAlerts', label: 'SMS Critical Alerts', desc: 'Text alerts for urgent exceptions', default: false },
            ]} />
          </div>
          <div style={{ ...sec, border: '1px solid #ef4444' }}>
            {secTitle('Danger Zone')}
            <button
              style={{ padding: '9px 20px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onClick={() => { if (window.confirm('Are you sure you want to log out?')) { clearAccessToken(); window.location.href = '/login'; } }}
            >
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Main Settings Component ──────────────────────────────────────────────────

export default function Settings() {
  const { theme, themeMode, toggleTheme, setTheme, settings, setAdvancedSetting, availablePalettes } = useTheme();
  const { demoMode, enableDemo, disableDemo } = useDemo();
  const t = theme || {};

  const [activeSectionTitle, setActiveSectionTitle] = useState(adminSections[0].title);
  const activeSection = useMemo(
    () => adminSections.find((s) => s.title === activeSectionTitle) ?? adminSections[0],
    [activeSectionTitle],
  );
  const [activeAction, setActiveAction] = useState(adminSections[0].actions[0]);

  useEffect(() => {
    setActiveAction(activeSection.actions[0]);
  }, [activeSection]);

  const isAccountSection = activeSection.title === 'Account & Profile';

  return (
    <div style={{ width: '100%', minHeight: '100%', background: t.bg, color: t.text }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: `1px solid ${t.border}`, background: t.surface }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>⚙️ Settings</div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Configure your workspace, profile, and system preferences</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={toggleTheme} style={{ borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, fontSize: 13, fontWeight: 600, padding: '7px 14px', cursor: 'pointer' }}>
            {themeMode === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button onClick={demoMode ? disableDemo : enableDemo} style={{ borderRadius: 8, border: `1px solid ${demoMode ? t.accent : t.border}`, background: demoMode ? t.accent : t.bgAlt, color: demoMode ? '#fff' : t.textSecondary, fontSize: 13, fontWeight: 600, padding: '7px 14px', cursor: 'pointer' }}>
            {demoMode ? '🟢 Mock Data: ON' : '⚪ Mock Data: OFF'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
        {/* Left nav */}
        <nav style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${t.border}`, background: t.surface, padding: '16px 10px' }}>
          {adminSections.map((section) => {
            const isActive = section.title === activeSection.title;
            const iconMap = { account: '👤', company: '🏢', users: '👥', freight: '🚛', audit: '📋', documents: '📄', billing: '💳' };
            return (
              <button
                key={section.title}
                type="button"
                onClick={() => setActiveSectionTitle(section.title)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 8, marginBottom: 4, border: 'none', cursor: 'pointer',
                  background: isActive ? (themeMode === 'dark' ? 'rgba(24,210,255,0.15)' : 'rgba(10,124,255,0.1)') : 'transparent',
                  color: isActive ? t.text : t.textSecondary,
                  fontWeight: isActive ? 700 : 500, fontSize: 13,
                  borderLeft: `3px solid ${isActive ? t.accent : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <span>{iconMap[section.icon] || '⚙️'}</span>
                <span>{section.title}</span>
              </button>
            );
          })}
        </nav>

        {/* Content area */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          {/* Actions list */}
          {!isAccountSection && (
            <div style={{ width: 200, flexShrink: 0, borderRight: `1px solid ${t.border}`, padding: '16px 10px', background: themeMode === 'dark' ? 'rgba(10,19,38,0.6)' : 'rgba(245,249,255,0.8)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, letterSpacing: 0.5, marginBottom: 10 }}>ACTIONS</div>
              {activeSection.actions.map((action) => {
                const isActive = action === activeAction;
                return (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setActiveAction(action)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
                      borderRadius: 6, marginBottom: 3, border: 'none', cursor: 'pointer',
                      background: isActive ? (themeMode === 'dark' ? 'rgba(24,210,255,0.15)' : 'rgba(10,124,255,0.1)') : 'transparent',
                      color: isActive ? t.text : t.textSecondary, fontWeight: isActive ? 700 : 500, fontSize: 13,
                      borderLeft: `2px solid ${isActive ? t.accent : 'transparent'}`,
                    }}
                  >
                    {action}
                  </button>
                );
              })}
            </div>
          )}

          {/* Detail panel */}
          <div style={{ flex: 1, padding: 24, overflowY: 'auto', minWidth: 0 }}>
            {!isAccountSection && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: t.textSecondary, letterSpacing: 0.5 }}>{activeSection.title.toUpperCase()}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>{activeAction}</div>
                <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>{activeSection.description}</div>
                <div style={{ height: 1, background: t.border, marginTop: 16 }} />
              </div>
            )}

            {isAccountSection ? (
              <AccountProfilePanel
                activeAction={activeAction}
                t={t}
                theme={theme}
                setTheme={setTheme}
                settings={settings}
                setAdvancedSetting={setAdvancedSetting}
                availablePalettes={availablePalettes}
              />
            ) : (
              <ActionPanel action={activeAction} t={t} theme={theme} setTheme={setTheme} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
