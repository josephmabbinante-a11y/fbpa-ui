import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listLoadTemplates, createLoadTemplate, createLoad, createLoadsBatch, deleteLoadTemplate, sendToBidNetwork } from '../api/loadsClient';
import { postToBoards } from '../api/boardIntegrationClient';

export default function NewShipment() {
  const navigate = useNavigate();

  // Template & batch state
  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [batchCount, setBatchCount] = useState(1);
  const [opBusy, setOpBusy] = useState('');
  const [opMessage, setOpMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Tracks newly created load(s) for post-creation actions
  const [createdLoads, setCreatedLoads] = useState([]);

  // Load templates on mount
  useEffect(() => {
    setLoading(true);
    listLoadTemplates()
      .then((res) => {
        if (Array.isArray(res?.items)) setTemplates(res.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const refreshTemplates = async () => {
    const res = await listLoadTemplates();
    if (Array.isArray(res?.items)) setTemplates(res.items);
  };

  const handleSaveTemplate = async () => {
    const name = templateName.trim();
    if (!name) { setOpMessage('Template name is required.'); return; }
    setOpBusy('save-template');
    setOpMessage('');
    const res = await createLoadTemplate({ name, defaults: {} });
    if (res?.error) {
      setOpMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
    } else {
      setOpMessage(`Template "${name}" saved.`);
      setTemplateName('');
      await refreshTemplates();
    }
    setOpBusy('');
  };

  const handleCreateFromTemplate = async () => {
    const tpl = templates.find((t) => t.id === selectedTemplateId);
    if (!tpl) { setOpMessage('Select a template first.'); return; }
    const count = Math.max(1, Math.min(50, batchCount));
    setOpBusy('batch-create');
    setOpMessage('');
    const payload = { ...(tpl.defaults || {}), count, templateId: tpl.id };
    const res = count > 1 ? await createLoadsBatch(payload) : await createLoad(payload);
    if (res?.error) {
      setOpMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
    } else {
      const loads = res?.loads || (res?.load ? [res.load] : []);
      setCreatedLoads(loads);
      setOpMessage(`${loads.length} load(s) created from "${tpl.name}".`);
    }
    setOpBusy('');
  };

  const handleDeleteTemplate = async (id) => {
    setOpBusy('delete');
    const res = await deleteLoadTemplate(id);
    if (res?.error) {
      setOpMessage(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
    } else {
      setOpMessage('Template deleted.');
      await refreshTemplates();
    }
    setOpBusy('');
  };

  // Post created load(s) to Private Network Auction, then redirect to Freight Exchange
  const handlePostToAuction = async () => {
    if (createdLoads.length === 0) return;
    setOpBusy('post-auction');
    setOpMessage('');
    let success = 0;
    for (const load of createdLoads) {
      const loadId = load.id || load._id;
      if (!loadId) continue;
      const res = await postToBoards(loadId, { boards: ['internal'], auctionConfig: { type: 'private' } });
      if (!res?.error) {
        await sendToBidNetwork(loadId, { network: 'private-auction', userId: 'new_shipment_ui', transitionReason: 'Posted to private network auction' });
        success++;
      }
    }
    if (success > 0) {
      setOpMessage(`${success} load(s) posted to Private Network Auction. Redirecting...`);
      setTimeout(() => navigate('/load-board'), 1200);
    } else {
      setOpMessage('Failed to post loads to auction. Please try again.');
    }
    setOpBusy('');
  };

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 1400, margin: '0 auto' }}>
      {/* ── New Shipment Action Bar ── */}
      <div style={{ border: '2px solid #2980b9', borderRadius: 12, background: 'linear-gradient(135deg, #eaf6ff 0%, #f8fbff 100%)', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1a3a5c', letterSpacing: 0.3 }}>
              🚚 New Shipment
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#5a7a9a' }}>
              Complete each section below to build your load. At the end you can send it to the Loadboard, Auction, or Book directly.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate('/loads/template/load-basics')}
              style={{
                minHeight: 40, borderRadius: 8, border: '2px solid #8e44ad', background: '#fff',
                color: '#8e44ad', fontSize: 13, fontWeight: 700, padding: '0 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              📋 Create Load Template
            </button>
            <button
              type="button"
              onClick={() => navigate('/loads/load-basics')}
              style={{
                minHeight: 40, borderRadius: 8, border: '2px solid #27ae60', background: '#27ae60',
                color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 18px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              ⚡ Create Load
            </button>
          </div>
        </div>

        {/* Template save row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #d0e6fa', paddingTop: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#5a7a9a', minWidth: 110 }}>Save as Template</span>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Template name..."
            style={{ flex: 1, minWidth: 140, minHeight: 34, borderRadius: 6, border: '1px solid #ccc', padding: '0 10px', fontSize: 12 }}
          />
          <button
            type="button"
            disabled={Boolean(opBusy)}
            onClick={handleSaveTemplate}
            style={{ minHeight: 34, borderRadius: 6, border: '1px solid #2980b9', background: '#2980b9', color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}
          >
            {opBusy === 'save-template' ? 'Saving...' : '💾 Save Template'}
          </button>
        </div>

        {/* From Template row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#5a7a9a', minWidth: 110 }}>From Template</span>
          <select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
            style={{ flex: 1, minWidth: 140, minHeight: 34, borderRadius: 6, border: '1px solid #ccc', padding: '0 8px', fontSize: 12 }}
          >
            <option value="">— Select template —</option>
            {templates.map((tpl) => <option key={tpl.id} value={tpl.id}>{tpl.name}</option>)}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#5a7a9a' }}>
            Count
            <input
              type="number" min={1} max={50} value={batchCount}
              onChange={(e) => setBatchCount(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              style={{ width: 54, minHeight: 34, borderRadius: 6, border: '1px solid #ccc', padding: '0 6px', fontSize: 12, textAlign: 'center' }}
            />
          </label>
          <button
            type="button"
            disabled={Boolean(opBusy) || !selectedTemplateId}
            onClick={handleCreateFromTemplate}
            style={{ minHeight: 34, borderRadius: 6, border: '1px solid #27ae60', background: '#27ae60', color: '#fff', fontSize: 12, fontWeight: 700, padding: '0 14px', cursor: 'pointer' }}
          >
            {opBusy === 'batch-create' ? 'Creating...' : `⚡ Create ${batchCount > 1 ? batchCount + ' Loads' : 'Load'}`}
          </button>
        </div>

        {opMessage && (
          <div style={{
            fontSize: 12, padding: '6px 10px', borderRadius: 6,
            background: opMessage.includes('fail') || opMessage.includes('required') ? '#ffeaea' : '#eaffec',
            color: opMessage.includes('fail') || opMessage.includes('required') ? '#c0392b' : '#27ae60',
          }}>
            {opMessage}
          </div>
        )}

        {/* ── Post-creation actions: appear after load(s) created ── */}
        {createdLoads.length > 0 && (
          <div style={{ borderTop: '1px solid #d0e6fa', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1a3a5c' }}>
              ✅ {createdLoads.length} load(s) ready — choose next step:
            </span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                disabled={Boolean(opBusy)}
                onClick={handlePostToAuction}
                style={{
                  minHeight: 40, borderRadius: 8, border: '2px solid #e67e22', background: '#e67e22',
                  color: '#fff', fontSize: 13, fontWeight: 700, padding: '0 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {opBusy === 'post-auction' ? 'Posting...' : '🔔 Post to Private Network Auction'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/load-board')}
                style={{
                  minHeight: 40, borderRadius: 8, border: '2px solid #2980b9', background: '#fff',
                  color: '#2980b9', fontSize: 13, fontWeight: 700, padding: '0 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                📋 Go to Freight Exchange
              </button>
              <button
                type="button"
                onClick={() => { setCreatedLoads([]); setOpMessage(''); }}
                style={{
                  minHeight: 40, borderRadius: 8, border: '1px solid #ccc', background: '#fff',
                  color: '#5a7a9a', fontSize: 13, fontWeight: 600, padding: '0 18px', cursor: 'pointer',
                }}
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Active Templates List ── */}
      <div style={{ border: '2px solid #2980b9', borderRadius: 12, background: 'linear-gradient(135deg, #eaf6ff 0%, #f8fbff 100%)', padding: '18px 20px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 800, color: '#1a3a5c' }}>📋 Active Templates</h3>
        {loading ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#5a7a9a', fontSize: 13 }}>Loading templates...</div>
        ) : templates.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: '#5a7a9a', fontSize: 13 }}>
            No templates yet. Use "Save as Template" above or "Create Load Template" to add one.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #d0e6fa', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700 }}>Name</th>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700 }}>Customer</th>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700 }}>Equipment</th>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700 }}>Picks</th>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700 }}>Drops</th>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700 }}>Branch</th>
                <th style={{ padding: '8px 10px', color: '#1a3a5c', fontWeight: 700, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((tpl) => (
                <tr key={tpl.id} style={{ borderBottom: '1px solid #e8f0fa' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600, color: '#2c5282' }}>{tpl.name}</td>
                  <td style={{ padding: '8px 10px', color: '#5a7a9a' }}>{tpl.customer || 'Not set'}</td>
                  <td style={{ padding: '8px 10px', color: '#5a7a9a' }}>{tpl.defaults?.equipment || 'van'}</td>
                  <td style={{ padding: '8px 10px', color: '#5a7a9a' }}>{tpl.picks ?? 1}</td>
                  <td style={{ padding: '8px 10px', color: '#5a7a9a' }}>{tpl.drops ?? 1}</td>
                  <td style={{ padding: '8px 10px', color: '#5a7a9a' }}>{tpl.branch || 'Shared'}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => { setSelectedTemplateId(tpl.id); setBatchCount(1); }}
                        style={{ minHeight: 28, borderRadius: 6, border: '1px solid #27ae60', background: '#27ae60', color: '#fff', fontSize: 11, fontWeight: 700, padding: '0 10px', cursor: 'pointer' }}
                      >
                        Use
                      </button>
                      <button
                        type="button"
                        disabled={Boolean(opBusy)}
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        style={{ minHeight: 28, borderRadius: 6, border: '1px solid #e74c3c', background: '#fff', color: '#e74c3c', fontSize: 11, fontWeight: 700, padding: '0 10px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
