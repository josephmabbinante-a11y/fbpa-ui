import React, { useState } from 'react';

const STORAGE_KEY = 'fbpa_notification_settings_v1';
const DEFAULTS = { emailEnabled: true, smsEnabled: false, pushEnabled: false, dailySummary: true };

function loadInitial(initial) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') return { ...DEFAULTS, ...parsed };
  } catch { /* ignore */ }
  return { ...DEFAULTS, ...initial };
}

export default function NotificationSettings({ initial, onSave }) {
  const init = loadInitial(initial);
  const [emailEnabled, setEmailEnabled] = useState(init.emailEnabled);
  const [smsEnabled, setSmsEnabled] = useState(init.smsEnabled);
  const [pushEnabled, setPushEnabled] = useState(init.pushEnabled);
  const [dailySummary, setDailySummary] = useState(init.dailySummary);

  function handleSubmit(e) {
    e.preventDefault();
    const data = { emailEnabled, smsEnabled, pushEnabled, dailySummary };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    onSave(data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>
          <input type="checkbox" checked={emailEnabled} onChange={e => setEmailEnabled(e.target.checked)} />
          Email Notifications
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} />
          SMS Notifications
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={pushEnabled} onChange={e => setPushEnabled(e.target.checked)} />
          Push Notifications
        </label>
      </div>
      <div>
        <label>
          <input type="checkbox" checked={dailySummary} onChange={e => setDailySummary(e.target.checked)} />
          Daily Summary Email
        </label>
      </div>
      <button type="submit">Save</button>
    </form>
  );
}
