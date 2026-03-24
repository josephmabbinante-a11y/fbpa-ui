import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';

const STAGE_LABELS = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
const STAGE_COLORS = ['#64748b', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#22c55e', '#94a3b8'];

const EMPTY_LEAD = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  source: 'Referral',
  stage: 'New',
  estimatedRevenue: '',
  lanes: '',
  notes: '',
};

const INDUSTRIES = ['Agriculture', 'Automotive', 'Building Materials', 'Chemicals', 'Consumer Goods', 'Electronics', 'Food & Beverage', 'Industrial Equipment', 'Manufacturing', 'Paper & Packaging', 'Pharma', 'Retail', 'Steel & Metals', 'Textiles'];
const REGIONS = ['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'Pacific NW', 'Great Plains', 'National'];
const EQUIPMENT_TYPES = ['Dry Van', 'Reefer', 'Flatbed', 'Step Deck', 'LTL', 'Intermodal', 'Tanker', 'Oversize'];

const PROSPECT_DIRECTORY = [
  { id: 'p1', company: 'Midwest Grain Cooperative', contact: 'Tom Hargrove', email: 'tom@mwgrain.com', phone: '(312) 555-0140', industry: 'Agriculture', region: 'Midwest', equipment: 'Dry Van', estimatedVolume: '120 loads/mo', lanes: 'CHI→KC, DSM→STL' },
  { id: 'p2', company: 'Pacific Auto Parts Inc.', contact: 'Linda Chen', email: 'lchen@pacificauto.com', phone: '(213) 555-0182', industry: 'Automotive', region: 'West Coast', equipment: 'Dry Van', estimatedVolume: '80 loads/mo', lanes: 'LAX→PHX, LAX→DEN' },
  { id: 'p3', company: 'Southeast Steel Distributors', contact: 'Marcus Blake', email: 'mblake@sesteel.com', phone: '(404) 555-0211', industry: 'Steel & Metals', region: 'Southeast', equipment: 'Flatbed', estimatedVolume: '60 loads/mo', lanes: 'ATL→CLT, BHM→JAX' },
  { id: 'p4', company: 'Great Lakes Pharmaceutical', contact: 'Dr. Sarah Nguyen', email: 'snguyen@glpharma.com', phone: '(248) 555-0167', industry: 'Pharma', region: 'Midwest', equipment: 'Reefer', estimatedVolume: '45 loads/mo', lanes: 'DTW→CLE, DTW→PIT' },
  { id: 'p5', company: 'Lone Star Building Supply', contact: 'Jake Morrison', email: 'jake@lsbs.com', phone: '(214) 555-0193', industry: 'Building Materials', region: 'Southwest', equipment: 'Flatbed', estimatedVolume: '150 loads/mo', lanes: 'DAL→HOU, DAL→SAT, OKC→DAL' },
  { id: 'p6', company: 'Northern Produce Corp', contact: 'Emily Sorensen', email: 'esorensen@northproduce.com', phone: '(612) 555-0128', industry: 'Food & Beverage', region: 'Midwest', equipment: 'Reefer', estimatedVolume: '200 loads/mo', lanes: 'MSP→ORD, MSP→MKE' },
  { id: 'p7', company: 'TechFlow Electronics', contact: 'Raj Patel', email: 'rpatel@techflow.com', phone: '(408) 555-0205', industry: 'Electronics', region: 'West Coast', equipment: 'Dry Van', estimatedVolume: '35 loads/mo', lanes: 'SFO→SEA, SFO→PDX' },
  { id: 'p8', company: 'Carolina Textiles Group', contact: 'Amanda Reeves', email: 'areeves@carolinatex.com', phone: '(704) 555-0177', industry: 'Textiles', region: 'Southeast', equipment: 'Dry Van', estimatedVolume: '90 loads/mo', lanes: 'CLT→RDU, CLT→ATL' },
  { id: 'p9', company: 'Heartland Chemical Co.', contact: 'Bill Turner', email: 'bturner@heartchem.com', phone: '(816) 555-0221', industry: 'Chemicals', region: 'Great Plains', equipment: 'Tanker', estimatedVolume: '55 loads/mo', lanes: 'KC→OMA, KC→STL' },
  { id: 'p10', company: 'Pacific NW Timber', contact: 'Chris Walsh', email: 'cwalsh@pnwtimber.com', phone: '(503) 555-0198', industry: 'Building Materials', region: 'Pacific NW', equipment: 'Step Deck', estimatedVolume: '70 loads/mo', lanes: 'PDX→SEA, PDX→BOI' },
  { id: 'p11', company: 'National Consumer Brands', contact: 'Jessica Muñoz', email: 'jmunoz@ncbrands.com', phone: '(646) 555-0156', industry: 'Consumer Goods', region: 'National', equipment: 'Dry Van', estimatedVolume: '300 loads/mo', lanes: 'EWR→BOS, EWR→PHL, EWR→ORD' },
  { id: 'p12', company: 'Valley Paper & Packaging', contact: 'Doug Henderson', email: 'dhenderson@valleypaper.com', phone: '(559) 555-0144', industry: 'Paper & Packaging', region: 'West Coast', equipment: 'Dry Van', estimatedVolume: '65 loads/mo', lanes: 'FAT→LAX, FAT→SFO' },
  { id: 'p13', company: 'Sunbelt Industrial Equip.', contact: 'Maria Vasquez', email: 'mvasquez@sunbeltind.com', phone: '(602) 555-0119', industry: 'Industrial Equipment', region: 'Southwest', equipment: 'Oversize', estimatedVolume: '25 loads/mo', lanes: 'PHX→TUC, PHX→ABQ' },
  { id: 'p14', company: 'Appalachian Manufacturing', contact: 'Steve Becker', email: 'sbecker@appmfg.com', phone: '(304) 555-0176', industry: 'Manufacturing', region: 'Southeast', equipment: 'Flatbed', estimatedVolume: '40 loads/mo', lanes: 'CHS→CLT, CHS→RIC' },
  { id: 'p15', company: 'Metro Retail Logistics', contact: 'Karen White', email: 'kwhite@metroretail.com', phone: '(212) 555-0133', industry: 'Retail', region: 'Northeast', equipment: 'LTL', estimatedVolume: '180 loads/mo', lanes: 'NYC→BOS, NYC→PHL, NYC→DC' },
];

function toMoney(v) {
  return `$${Number(v || 0).toLocaleString()}`;
}

export default function LeadManagement() {
  const { theme } = useTheme();
  const t = theme;
  const navigate = useNavigate();

  const [leads, setLeads] = useState(() => {
    try {
      const saved = localStorage.getItem('opscale_leads');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState('pipeline');
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_LEAD });
  const [editId, setEditId] = useState(null);

  /* Find Leads state */
  const [prospectQuery, setProspectQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [addedIds, setAddedIds] = useState(() => {
    try { const s = localStorage.getItem('opscale_added_prospects'); return s ? JSON.parse(s) : []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('opscale_added_prospects', JSON.stringify(addedIds)); }, [addedIds]);

  useEffect(() => {
    localStorage.setItem('opscale_leads', JSON.stringify(leads));
  }, [leads]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((l) => {
      if (stageFilter !== 'All' && l.stage !== stageFilter) return false;
      if (q && ![l.companyName, l.contactName, l.email, l.lanes].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [leads, query, stageFilter]);

  const pipelineTotals = useMemo(() => {
    const totals = {};
    STAGE_LABELS.forEach((s) => { totals[s] = { count: 0, revenue: 0 }; });
    leads.forEach((l) => {
      if (totals[l.stage]) {
        totals[l.stage].count += 1;
        totals[l.stage].revenue += Number(l.estimatedRevenue) || 0;
      }
    });
    return totals;
  }, [leads]);

  const filteredProspects = useMemo(() => {
    const q = prospectQuery.toLowerCase();
    return PROSPECT_DIRECTORY.filter((p) => {
      if (industryFilter !== 'All' && p.industry !== industryFilter) return false;
      if (regionFilter !== 'All' && p.region !== regionFilter) return false;
      if (equipmentFilter !== 'All' && p.equipment !== equipmentFilter) return false;
      if (q && ![p.company, p.contact, p.lanes, p.industry].some((v) => String(v || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [prospectQuery, industryFilter, regionFilter, equipmentFilter]);

  const handleAddProspectAsLead = (prospect) => {
    const newLead = {
      id: `lead-${Date.now()}`,
      companyName: prospect.company,
      contactName: prospect.contact,
      email: prospect.email,
      phone: prospect.phone,
      source: 'Prospecting',
      stage: 'New',
      estimatedRevenue: '',
      lanes: prospect.lanes,
      notes: `${prospect.industry} · ${prospect.region} · ${prospect.equipment} · ~${prospect.estimatedVolume}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLeads((prev) => [newLead, ...prev]);
    setAddedIds((prev) => [...prev, prospect.id]);
  };

  const sectionStyle = { border: `1px solid ${t.border}`, borderRadius: 12, background: `linear-gradient(160deg, ${t.surface}, ${t.surfaceStrong})`, overflow: 'hidden' };
  const headerStyle = { padding: '10px 12px', borderBottom: `1px solid ${t.border}`, background: t.bgAlt, fontSize: 14, fontWeight: 700 };
  const bodyStyle = { padding: 12, display: 'grid', gap: 10 };
  const inputStyle = { minHeight: 34, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, color: t.text, padding: '7px 10px', fontSize: 12, outline: 'none' };
  const ghostBtn = { border: `1px solid ${t.border}`, background: t.surface, color: t.text, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const primaryBtn = { border: `1px solid ${t.accent2 || t.accent}`, background: `linear-gradient(135deg, ${t.accent}, ${t.accent2 || t.accent})`, color: t.bg, borderRadius: 8, fontSize: 12, fontWeight: 700, padding: '8px 12px', cursor: 'pointer' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: t.textSecondary };

  const setField = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.companyName.trim()) return;
    if (editId) {
      setLeads((prev) => prev.map((l) => l.id === editId ? { ...l, ...form, updatedAt: new Date().toISOString() } : l));
    } else {
      setLeads((prev) => [{ ...form, id: `lead-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, ...prev]);
    }
    setShowForm(false);
    setForm({ ...EMPTY_LEAD });
    setEditId(null);
  };

  const handleEdit = (lead) => {
    setForm({ companyName: lead.companyName, contactName: lead.contactName, email: lead.email, phone: lead.phone, source: lead.source, stage: lead.stage, estimatedRevenue: lead.estimatedRevenue, lanes: lead.lanes, notes: lead.notes });
    setEditId(lead.id);
    setShowForm(true);
  };

  const handleDelete = (id) => setLeads((prev) => prev.filter((l) => l.id !== id));

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 12, color: t.textSecondary }}>Account Mgmt / Sales Ops</div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: 26 }}>Lead Management</h1>
        </div>
        {activeTab === 'pipeline' && (
          <button type="button" style={primaryBtn} onClick={() => { setShowForm(true); setForm({ ...EMPTY_LEAD }); setEditId(null); }}>+ New Lead</button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: `2px solid ${t.border}` }}>
        {[{ key: 'pipeline', label: 'My Pipeline' }, { key: 'find', label: 'Find Leads' }].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              border: 'none', borderBottom: activeTab === tab.key ? `2px solid ${t.accent}` : '2px solid transparent',
              background: 'transparent', color: activeTab === tab.key ? t.accent : t.textSecondary,
              marginBottom: -2, transition: 'color 0.15s, border-color 0.15s',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ========== MY PIPELINE TAB ========== */}
      {activeTab === 'pipeline' && (<>
      <section style={sectionStyle}>
        <div style={headerStyle}>Revenue Pipeline</div>
        <div style={{ padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STAGE_LABELS.map((stage, i) => (
            <div key={stage} style={{ flex: '1 1 120px', padding: 10, borderRadius: 8, border: `1px solid ${t.border}`, background: t.bgAlt, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: STAGE_COLORS[i], textTransform: 'uppercase', letterSpacing: 0.5 }}>{stage}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{pipelineTotals[stage]?.count || 0}</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>{toMoney(pipelineTotals[stage]?.revenue || 0)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Add / Edit Form */}
      {showForm && (
        <section style={sectionStyle}>
          <div style={headerStyle}>{editId ? 'Edit Lead' : 'New Lead'}</div>
          <div style={bodyStyle}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Company Name *</span><input value={form.companyName} onChange={(e) => setField('companyName', e.target.value)} style={inputStyle} placeholder="Acme Shipping Co." /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Contact Name</span><input value={form.contactName} onChange={(e) => setField('contactName', e.target.value)} style={inputStyle} placeholder="Jane Smith" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Email</span><input value={form.email} onChange={(e) => setField('email', e.target.value)} style={inputStyle} placeholder="jane@acme.com" /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Phone</span><input value={form.phone} onChange={(e) => setField('phone', e.target.value)} style={inputStyle} placeholder="(555) 123-4567" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Source</span>
                <select value={form.source} onChange={(e) => setField('source', e.target.value)} style={inputStyle}>
                  {['Referral', 'Cold Call', 'Website', 'Trade Show', 'Inbound RFQ', 'Other'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Stage</span>
                <select value={form.stage} onChange={(e) => setField('stage', e.target.value)} style={inputStyle}>
                  {STAGE_LABELS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Est. Revenue</span><input value={form.estimatedRevenue} onChange={(e) => setField('estimatedRevenue', e.target.value)} style={inputStyle} placeholder="50000" /></label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Target Lanes</span><input value={form.lanes} onChange={(e) => setField('lanes', e.target.value)} style={inputStyle} placeholder="CHI→DAL, LAX→SEA" /></label>
              <label style={{ display: 'grid', gap: 4 }}><span style={labelStyle}>Notes</span><input value={form.notes} onChange={(e) => setField('notes', e.target.value)} style={inputStyle} placeholder="Internal notes" /></label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" style={primaryBtn} onClick={handleSave}>{editId ? 'Update Lead' : 'Save Lead'}</button>
              <button type="button" style={ghostBtn} onClick={() => { setShowForm(false); setEditId(null); }}>Cancel</button>
            </div>
          </div>
        </section>
      )}

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads…" style={{ ...inputStyle, flex: '1 1 260px' }} />
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={inputStyle}>
          <option value="All">All Stages</option>
          {STAGE_LABELS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Lead Table */}
      <section style={sectionStyle}>
        <div style={headerStyle}>Leads ({filtered.length})</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                {['Company', 'Contact', 'Stage', 'Est. Revenue', 'Lanes', 'Source', 'Updated', ''].map((h) => (
                  <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>{lead.companyName}</td>
                  <td style={{ padding: '8px 10px' }}>{lead.contactName || '—'}</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${STAGE_COLORS[STAGE_LABELS.indexOf(lead.stage)] || '#64748b'}22`, color: STAGE_COLORS[STAGE_LABELS.indexOf(lead.stage)] || '#64748b' }}>{lead.stage}</span>
                  </td>
                  <td style={{ padding: '8px 10px' }}>{lead.estimatedRevenue ? toMoney(lead.estimatedRevenue) : '—'}</td>
                  <td style={{ padding: '8px 10px', color: t.textSecondary }}>{lead.lanes || '—'}</td>
                  <td style={{ padding: '8px 10px', color: t.textSecondary }}>{lead.source}</td>
                  <td style={{ padding: '8px 10px', color: t.textSecondary, fontSize: 11 }}>{lead.updatedAt ? new Date(lead.updatedAt).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '8px 10px', display: 'flex', gap: 4 }}>
                    <button type="button" style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11 }} onClick={() => handleEdit(lead)}>Edit</button>
                    <button type="button" style={{ ...ghostBtn, padding: '4px 8px', fontSize: 11, color: t.error }} onClick={() => handleDelete(lead.id)}>Del</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: t.textSecondary }}>No leads found. Click "+ New Lead" to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      </>)}

      {/* ========== FIND LEADS TAB ========== */}
      {activeTab === 'find' && (<>
        {/* Prospecting Filters */}
        <section style={sectionStyle}>
          <div style={headerStyle}>🔍 Shipper Prospect Directory</div>
          <div style={{ padding: 12, display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={prospectQuery} onChange={(e) => setProspectQuery(e.target.value)} placeholder="Search by company, contact, lane, or industry…" style={{ ...inputStyle, flex: '1 1 260px' }} />
              <select value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)} style={inputStyle}>
                <option value="All">All Industries</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
              <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} style={inputStyle}>
                <option value="All">All Regions</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={equipmentFilter} onChange={(e) => setEquipmentFilter(e.target.value)} style={inputStyle}>
                <option value="All">All Equipment</option>
                {EQUIPMENT_TYPES.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
              </select>
            </div>
            <div style={{ fontSize: 11, color: t.textSecondary }}>{filteredProspects.length} prospects match your filters</div>
          </div>
        </section>

        {/* Prospect Results */}
        <section style={sectionStyle}>
          <div style={headerStyle}>Prospects ({filteredProspects.length})</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: t.bgAlt, borderBottom: `1px solid ${t.border}` }}>
                  {['Company', 'Contact', 'Industry', 'Region', 'Equipment', 'Est. Volume', 'Lanes', ''].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, fontSize: 11, color: t.textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredProspects.map((p) => {
                  const alreadyAdded = addedIds.includes(p.id);
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${t.border}`, opacity: alreadyAdded ? 0.55 : 1 }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.company}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <div>{p.contact}</div>
                        <div style={{ fontSize: 10, color: t.textSecondary }}>{p.email}</div>
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${t.accent}18`, color: t.accent }}>{p.industry}</span>
                      </td>
                      <td style={{ padding: '8px 10px', color: t.textSecondary }}>{p.region}</td>
                      <td style={{ padding: '8px 10px', color: t.textSecondary }}>{p.equipment}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 600 }}>{p.estimatedVolume}</td>
                      <td style={{ padding: '8px 10px', color: t.textSecondary, fontSize: 11 }}>{p.lanes}</td>
                      <td style={{ padding: '8px 10px' }}>
                        {alreadyAdded ? (
                          <span style={{ ...ghostBtn, padding: '4px 10px', fontSize: 11, opacity: 0.6, cursor: 'default' }}>✓ Added</span>
                        ) : (
                          <button type="button" style={{ ...primaryBtn, padding: '4px 10px', fontSize: 11 }} onClick={() => handleAddProspectAsLead(p)}>+ Add as Lead</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredProspects.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: 24, textAlign: 'center', color: t.textSecondary }}>No prospects match your current filters. Try broadening your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>)}
    </div>
  );
}
