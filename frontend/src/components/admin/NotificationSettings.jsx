import React, { useState } from 'react';

export default function NotificationSettings({ initial, onSave }) {
  const [emailEnabled, setEmailEnabled] = useState(initial?.emailEnabled ?? true);
  const [smsEnabled, setSmsEnabled] = useState(initial?.smsEnabled ?? false);
  const [pushEnabled, setPushEnabled] = useState(initial?.pushEnabled ?? false);
  const [dailySummary, setDailySummary] = useState(initial?.dailySummary ?? true);

  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ emailEnabled, smsEnabled, pushEnabled, dailySummary }); }}>
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
