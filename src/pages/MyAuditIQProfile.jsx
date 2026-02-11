// src/pages/MyAuditIQProfile.jsx
import { useTheme, themes } from '../contexts/ThemeContext';
import { useState } from 'react';

export default function MyAuditIQProfile() {
  const { theme } = useTheme();
  const t = themes[theme];
  // Mock user data
  const [profile, setProfile] = useState({
    name: 'Jane Doe',
    email: 'jane@acme.com',
    company: 'Acme Corp',
    role: 'Finance Manager',
    phone: '555-1234',
    address: '123 Main St, Springfield',
    avatar: '',
  });

  return (
    <div style={{ padding: 32, background: t.bg, color: t.text, minHeight: '100vh', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 24 }}>My Audit IQ Profile</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: t.bgAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, color: t.accent }}>
          {profile.avatar ? <img src={profile.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} /> : profile.name[0]}
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 600 }}>{profile.name}</div>
          <div style={{ fontSize: 14, color: t.textSecondary }}>{profile.role}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 18 }}>
        <ProfileField label="Email" value={profile.email} />
        <ProfileField label="Company" value={profile.company} />
        <ProfileField label="Phone" value={profile.phone} />
        <ProfileField label="Address" value={profile.address} />
      </div>
      <div style={{ marginTop: 40, color: t.textSecondary, fontSize: 13 }}>
        For changes to your profile, please contact your administrator or support.
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 500 }}>{value}</div>
    </div>
  );
}
