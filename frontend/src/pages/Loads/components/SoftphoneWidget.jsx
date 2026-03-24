import React, { useEffect, useRef, useState } from 'react';
import {
  startCall,
  endCall,
  getCallLog,
  getActiveCall,
  TELEPHONY_PROVIDERS,
  saveTelephonyConfig,
  getTelephonyConfig,
} from '../../../api/telephonyClient';

const TAB_KEYS = ['dialer', 'log', 'settings'];
const TAB_LABELS = { dialer: 'Dialer', log: 'Call Log', settings: 'Settings' };

function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw;
}

const STATUS_COLORS = {
  ringing: 'var(--warning)',
  'in-progress': 'var(--success)',
  completed: 'var(--text-secondary)',
  'no-answer': 'var(--error)',
  failed: 'var(--error)',
};

export default function SoftphoneWidget({ selectedLoad, compact = false }) {
  const [tab, setTab] = useState('dialer');
  const [collapsed, setCollapsed] = useState(false);

  // Dialer state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [activeCall, setActiveCall] = useState(null);
  const [callTimer, setCallTimer] = useState(0);
  const [callError, setCallError] = useState('');
  const timerRef = useRef(null);

  // Log state
  const [callLog, setCallLog] = useState([]);
  const [logLoading, setLogLoading] = useState(false);

  // Settings state
  const [provider, setProvider] = useState('twilio');
  const [providerConfig, setProviderConfig] = useState({});
  const [configSaving, setConfigSaving] = useState(false);
  const [configMsg, setConfigMsg] = useState('');

  // Load call log on mount and when switching to log tab
  useEffect(() => {
    if (tab === 'log') {
      setLogLoading(true);
      getCallLog({ limit: 25 })
        .then((res) => setCallLog(res?.calls || []))
        .catch(() => {})
        .finally(() => setLogLoading(false));
    }
  }, [tab]);

  // Load config on settings tab
  useEffect(() => {
    if (tab === 'settings') {
      getTelephonyConfig()
        .then((res) => {
          if (res?.provider) setProvider(res.provider);
          setProviderConfig(res || {});
        })
        .catch(() => {});
    }
  }, [tab]);

  // Call timer
  useEffect(() => {
    if (activeCall && (activeCall.status === 'ringing' || activeCall.status === 'in-progress')) {
      timerRef.current = setInterval(() => {
        setCallTimer((t) => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeCall?.status]);

  // Poll active call status in mock mode
  const activeCallIdRef = useRef(activeCall?.id);
  useEffect(() => { activeCallIdRef.current = activeCall?.id; }, [activeCall?.id]);
  useEffect(() => {
    if (!activeCall) return;
    const poll = setInterval(async () => {
      try {
        const res = await getActiveCall();
        if (res?.call) {
          setActiveCall(prev => {
            if (prev?.id === activeCallIdRef.current) return res.call;
            return prev;
          });
        } else {
          setActiveCall(null);
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [!!activeCall]);

  const handleDial = async () => {
    if (!phoneNumber.trim()) return;
    setCallError('');
    try {
      const res = await startCall({
        to: phoneNumber.trim(),
        toName: contactName.trim() || undefined,
        loadId: selectedLoad?.id || undefined,
        provider,
      });
      if (res?.call) {
        setActiveCall(res.call);
        setCallTimer(0);
      }
    } catch (err) {
      setCallError(err.message || 'Call failed');
    }
  };

  const handleHangUp = async () => {
    if (!activeCall) return;
    try {
      await endCall(activeCall.id);
      setActiveCall(null);
      setCallTimer(0);
    } catch (err) {
      setCallError(err.message || 'Failed to end call');
    }
  };

  const handleSaveConfig = async () => {
    setConfigSaving(true);
    setConfigMsg('');
    try {
      await saveTelephonyConfig({ provider, ...providerConfig });
      setConfigMsg('Configuration saved.');
    } catch (err) {
      setConfigMsg(err.message || 'Save failed');
    } finally {
      setConfigSaving(false);
    }
  };

  const dialPad = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  if (collapsed) {
    return (
      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 12,
          background: 'var(--surface)',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed(false)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📞</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Softphone</span>
          {activeCall && (
            <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[activeCall.status] || 'var(--text-secondary)', animation: activeCall.status === 'ringing' ? 'pulse 1.2s infinite' : 'none' }}>
              ● {activeCall.status === 'ringing' ? 'Ringing...' : formatDuration(callTimer)}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>▼</span>
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        background: 'linear-gradient(160deg, var(--surface), var(--surface-strong, var(--surface)))',
        display: 'grid',
        gap: 0,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📞</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Softphone</span>
          {activeCall && (
            <span style={{ fontSize: 10, fontWeight: 700, color: STATUS_COLORS[activeCall.status] || 'var(--text-secondary)' }}>
              ● {activeCall.status === 'ringing' ? 'Ringing...' : `Connected ${formatDuration(callTimer)}`}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11, padding: '2px 6px' }}
        >
          ▲
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
        {TAB_KEYS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              background: 'transparent',
              color: tab === t ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 11,
              fontWeight: 700,
              padding: '8px 4px',
              cursor: 'pointer',
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Active call banner */}
      {activeCall && (
        <div
          style={{
            padding: '10px 14px',
            background: activeCall.status === 'ringing'
              ? 'color-mix(in srgb, var(--warning) 10%, transparent)'
              : 'color-mix(in srgb, var(--success) 10%, transparent)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div style={{ display: 'grid', gap: 2 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
              {activeCall.toName || formatPhone(activeCall.to)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {activeCall.status === 'ringing' ? 'Ringing...' : `In call · ${formatDuration(callTimer)}`}
              {activeCall.loadId && ` · Load ${activeCall.loadId}`}
            </div>
          </div>
          <button
            type="button"
            onClick={handleHangUp}
            style={{
              border: 'none',
              background: 'var(--error)',
              color: '#fff',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 14px',
              cursor: 'pointer',
            }}
          >
            End
          </button>
        </div>
      )}

      {/* Tab content */}
      <div style={{ padding: 14 }}>
        {/* ─── Dialer Tab ─── */}
        {tab === 'dialer' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {callError && <div style={{ fontSize: 11, color: 'var(--error)' }}>{callError}</div>}

            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Contact / Carrier name"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg-alt)',
                color: 'var(--text)',
                fontSize: 12,
                padding: '8px 12px',
                outline: 'none',
              }}
            />

            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg-alt)',
                color: 'var(--text)',
                fontSize: 14,
                fontWeight: 700,
                padding: '10px 12px',
                outline: 'none',
                textAlign: 'center',
                letterSpacing: 1,
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !activeCall) handleDial(); }}
            />

            {!compact && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {dialPad.map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => setPhoneNumber((p) => p + digit)}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      background: 'var(--bg-alt)',
                      color: 'var(--text)',
                      fontSize: 14,
                      fontWeight: 700,
                      padding: '10px 0',
                      cursor: 'pointer',
                    }}
                  >
                    {digit}
                  </button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              {!activeCall ? (
                <button
                  type="button"
                  onClick={handleDial}
                  disabled={!phoneNumber.trim()}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 8,
                    background: phoneNumber.trim() ? 'var(--success)' : 'var(--bg-alt)',
                    color: phoneNumber.trim() ? '#fff' : 'var(--text-secondary)',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '10px 0',
                    cursor: phoneNumber.trim() ? 'pointer' : 'default',
                  }}
                >
                  📞 Call
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleHangUp}
                  style={{
                    flex: 1,
                    border: 'none',
                    borderRadius: 8,
                    background: 'var(--error)',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '10px 0',
                    cursor: 'pointer',
                  }}
                >
                  End Call
                </button>
              )}
              <button
                type="button"
                onClick={() => setPhoneNumber('')}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--bg-alt)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '10px 14px',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
            </div>

            {selectedLoad && (
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>
                Calls linked to Load {selectedLoad.id}
              </div>
            )}
          </div>
        )}

        {/* ─── Call Log Tab ─── */}
        {tab === 'log' && (
          <div style={{ display: 'grid', gap: 8 }}>
            {logLoading && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Loading call log...</div>}
            {!logLoading && callLog.length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', padding: 12 }}>
                No calls yet.
              </div>
            )}
            {callLog.map((call) => (
              <div
                key={call.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--bg-alt)',
                  padding: '8px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {call.direction === 'inbound' ? '↙' : '↗'}{' '}
                    {call.toName || call.fromName || formatPhone(call.to || call.from)}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                    {new Date(call.startedAt).toLocaleString()}
                    {call.loadId && ` · ${call.loadId}`}
                  </div>
                </div>
                <div style={{ display: 'grid', gap: 2, textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLORS[call.status] || 'var(--text-secondary)' }}>
                    {call.status === 'completed' ? formatDuration(call.duration) : call.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Settings Tab ─── */}
        {tab === 'settings' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Telephony Provider</div>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 8,
                background: 'var(--bg-alt)',
                color: 'var(--text)',
                fontSize: 12,
                padding: '8px 12px',
                outline: 'none',
              }}
            >
              {Object.entries(TELEPHONY_PROVIDERS).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>

            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              Configure your {TELEPHONY_PROVIDERS[provider]?.label || provider} credentials to enable live outbound / inbound calls from the dispatch console. All credentials are stored securely and used server-side only.
            </div>

            {(TELEPHONY_PROVIDERS[provider]?.fields || []).map((field) => (
              <div key={field} style={{ display: 'grid', gap: 4 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                  {field.replace(/([A-Z])/g, ' $1').trim()}
                </label>
                <input
                  type={field.toLowerCase().includes('token') || field.toLowerCase().includes('secret') || field.toLowerCase().includes('key') ? 'password' : 'text'}
                  value={providerConfig[field] || ''}
                  onChange={(e) => setProviderConfig((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={field}
                  autoComplete="off"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    fontSize: 12,
                    padding: '8px 12px',
                    outline: 'none',
                  }}
                />
              </div>
            ))}

            {configMsg && <div style={{ fontSize: 11, color: configMsg.includes('fail') ? 'var(--error)' : 'var(--success)' }}>{configMsg}</div>}

            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={configSaving}
              style={{
                border: 'none',
                borderRadius: 8,
                background: 'var(--accent)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 700,
                padding: '10px 0',
                cursor: configSaving ? 'default' : 'pointer',
                opacity: configSaving ? 0.6 : 1,
              }}
            >
              {configSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Supported providers: Twilio, Bandwidth, Vonage, Telnyx, or any custom SIP/API endpoint.
              Connect to carrier services, customer support lines, or driver dispatch numbers directly from this console.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
