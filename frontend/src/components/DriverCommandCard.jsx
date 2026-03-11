import React, { useState } from 'react';

export default function DriverCommandCard({ driver }) {
  // Demo driver data if not provided
  const d = driver || {
    name: 'James Carter',
    mcDot: 'MC 123456 / DOT 654321',
    cdlClass: 'A',
    safetyScore: 92,
    yearsExp: 8,
    profileImg: 'https://randomuser.me/api/portraits/men/32.jpg',
    online: true,
    aiRisk: 'Low',
    trend: [90, 91, 92, 93, 92, 92, 92],
    docs: { insurance: true, w9: true, authority: false },
  };
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="driver-command-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        background: 'rgba(24,28,38,0.85)',
        borderRadius: 14,
        boxShadow: '0 6px 32px 0 rgba(0,0,0,0.22)',
        padding: 24,
        marginBottom: 28,
        position: 'relative',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid rgba(60,80,120,0.18)',
        transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 12px 36px 0 rgba(0,180,255,0.18)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 6px 32px 0 rgba(0,0,0,0.22)'}
    >
      <div style={{ position: 'relative' }}>
        <img
          src={d.profileImg}
          alt="Driver"
          style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '3px solid #1e293b', boxShadow: '0 2px 12px #0006' }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: d.online ? 'radial-gradient(circle,#22ff88 60%,#0f0 100%)' : '#aaa',
            border: '2px solid #222',
            boxShadow: d.online ? '0 0 8px 2px #22ff88' : 'none',
            animation: d.online ? 'pulse 1.2s infinite alternate' : 'none',
            display: 'block',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 22, color: '#fff' }}>{d.name}</span>
          <span style={{ fontSize: 13, color: '#a3e635', background: '#1e293b', borderRadius: 8, padding: '2px 8px', fontWeight: 600, marginLeft: 4 }}>CDL {d.cdlClass}</span>
          <span style={{ fontSize: 12, color: '#60a5fa', background: '#0f172a', borderRadius: 8, padding: '2px 8px', fontWeight: 600, marginLeft: 4 }}>{d.mcDot}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
          <div style={{ fontSize: 13, color: '#fff' }}>Experience: <b>{d.yearsExp} yrs</b></div>
          <div style={{ fontSize: 13, color: '#fff' }}>AI Risk: <span style={{ color: d.aiRisk === 'Low' ? '#22ff88' : '#f87171', fontWeight: 700 }}>{d.aiRisk}</span></div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 120, height: 18, background: '#22292f', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${d.safetyScore}%`, height: '100%', background: 'linear-gradient(90deg,#22ff88,#60a5fa)', transition: 'width 1s cubic-bezier(.4,2,.6,1)' }} />
            <span style={{ position: 'absolute', left: 8, top: 0, fontSize: 12, color: '#fff', fontWeight: 700 }}>{d.safetyScore}</span>
          </div>
          <button style={{ fontSize: 13, color: '#fff', background: '#0ea5e9', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 8, cursor: 'pointer', boxShadow: '0 2px 8px #0ea5e955', transition: 'transform 0.15s', fontWeight: 600 }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>Send Load</button>
          <button style={{ fontSize: 13, color: '#fff', background: '#6366f1', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px #6366f155', transition: 'transform 0.15s', fontWeight: 600 }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>Request Docs</button>
          <button style={{ fontSize: 13, color: '#fff', background: '#f59e42', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px #f59e4255', transition: 'transform 0.15s', fontWeight: 600 }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>Message Driver</button>
          <button style={{ fontSize: 13, color: '#fff', background: '#22d3ee', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px #22d3ee55', transition: 'transform 0.15s', fontWeight: 600 }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>View Compliance</button>
        </div>
        <div style={{ marginTop: 10 }}>
          <button style={{ fontSize: 13, color: '#fff', background: '#22292f', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontWeight: 600, boxShadow: '0 1px 4px #22292f55', transition: 'background 0.15s' }} onClick={() => setExpanded(v => !v)}>{expanded ? 'Hide Full Profile' : 'View Full Profile'}</button>
        </div>
        {expanded && (
          <div style={{ marginTop: 14, background: 'rgba(30,41,59,0.92)', borderRadius: 10, padding: 16, color: '#fff', boxShadow: '0 2px 12px #0004' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Driver Details</div>
            <div>MC/DOT: {d.mcDot}</div>
            <div>CDL Class: {d.cdlClass}</div>
            <div>Years Experience: {d.yearsExp}</div>
            <div>Safety Score: {d.safetyScore}</div>
            <div>AI Risk: {d.aiRisk}</div>
            <div style={{ marginTop: 8, display: 'flex', gap: 12 }}>
              <span>Docs:</span>
              <span title="Insurance"><span style={{ color: d.docs.insurance ? '#22ff88' : '#f87171' }}>●</span> Insurance</span>
              <span title="W9"><span style={{ color: d.docs.w9 ? '#22ff88' : '#f87171' }}>●</span> W9</span>
              <span title="Authority"><span style={{ color: d.docs.authority ? '#22ff88' : '#f87171' }}>●</span> Authority</span>
            </div>
            <div style={{ marginTop: 8 }}>
              <span>Performance Trend: </span>
              <span style={{ color: '#60a5fa', fontWeight: 700 }}>{d.trend.join(' → ')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
