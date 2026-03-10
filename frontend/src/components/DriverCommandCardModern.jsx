import React from 'react';

export default function DriverCommandCardModern({ driver }) {
  // Accepts driver object from FleetDashboard mockDrivers
  const d = driver || {};
  // Fallbacks for missing fields
  const name = d.name || 'Driver';
  const cdlClass = d.cdlClass || d.cdl || 'A';
  const mcDot = d.mcDot || d.mc_dot || '--';
  const yearsExp = d.yearsExp || d.experience || '—';
  const profileImg = d.profileImg || d.photo || 'https://randomuser.me/api/portraits/men/32.jpg';
  const online = d.online !== undefined ? d.online : true;
  const aiRisk = d.aiRisk || 'Low';
  const safetyScore = d.safetyScore !== undefined ? d.safetyScore : (d.compliance || 0);

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
    >
      <div style={{ position: 'relative' }}>
        <img
          src={profileImg}
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
            background: online ? 'radial-gradient(circle,#22ff88 60%,#0f0 100%)' : '#aaa',
            border: '2px solid #222',
            boxShadow: online ? '0 0 8px 2px #22ff88' : 'none',
            animation: online ? 'pulse 1.2s infinite alternate' : 'none',
            display: 'block',
          }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 22, color: '#fff' }}>{name}</span>
          <span style={{ fontSize: 13, color: '#a3e635', background: '#1e293b', borderRadius: 8, padding: '2px 8px', fontWeight: 600, marginLeft: 4 }}>CDL {cdlClass}</span>
          <span style={{ fontSize: 12, color: '#60a5fa', background: '#0f172a', borderRadius: 8, padding: '2px 8px', fontWeight: 600, marginLeft: 4 }}>{mcDot}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6 }}>
          <div style={{ fontSize: 13, color: '#fff' }}>Experience: <b>{yearsExp} yrs</b></div>
          <div style={{ fontSize: 13, color: '#fff' }}>AI Risk: <span style={{ color: aiRisk === 'Low' ? '#22ff88' : '#f87171', fontWeight: 700 }}>{aiRisk}</span></div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 120, height: 18, background: '#22292f', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            <div style={{ width: `${safetyScore}%`, height: '100%', background: 'linear-gradient(90deg,#22ff88,#60a5fa)', transition: 'width 1s cubic-bezier(.4,2,.6,1)' }} />
            <span style={{ position: 'absolute', left: 8, top: 0, fontSize: 12, color: '#fff', fontWeight: 700 }}>{safetyScore}</span>
          </div>
          <button style={{ fontSize: 13, color: '#fff', background: '#0ea5e9', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 8, cursor: 'pointer', boxShadow: '0 2px 8px #0ea5e955', transition: 'transform 0.15s', fontWeight: 600 }}>Send Load</button>
          <button style={{ fontSize: 13, color: '#fff', background: '#6366f1', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px #6366f155', transition: 'transform 0.15s', fontWeight: 600 }}>Request Docs</button>
          <button style={{ fontSize: 13, color: '#fff', background: '#f59e42', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px #f59e4255', transition: 'transform 0.15s', fontWeight: 600 }}>Message Driver</button>
          <button style={{ fontSize: 13, color: '#fff', background: '#22d3ee', border: 'none', borderRadius: 8, padding: '6px 14px', marginLeft: 4, cursor: 'pointer', boxShadow: '0 2px 8px #22d3ee55', transition: 'transform 0.15s', fontWeight: 600 }}>View Compliance</button>
        </div>
      </div>
    </div>
  );
}
