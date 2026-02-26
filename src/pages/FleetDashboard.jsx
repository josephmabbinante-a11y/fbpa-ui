
import React, { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

const mockDrivers = [
  {
    id: 1,
    name: 'John Doe',
    status: 'Active',
    company: 'Company Driver',
    phone: '555-1234',
    compliance: 36,
    docs: [
      { name: 'Medical Card', status: 'Complete' },
      { name: 'MVR', status: 'Pending' },
      { name: 'PSP', status: 'Pending' },
    ],
    telematics: {
      location: '533 Elner E Sena',
      eta: '6 hours 5 mins',
      status: 'Driving',
      times: ['04:09', '05:19', '07:17', '08:28'],
    },
  },
  {
    id: 2,
    name: 'Michael Smith',
    status: 'Active',
    company: 'Owner Operator',
    phone: '555-5678',
    compliance: 82,
    docs: [
      { name: 'Medical Card', status: 'Complete' },
      { name: 'MVR', status: 'Complete' },
      { name: 'PSP', status: 'Complete' },
    ],
    telematics: {
      location: 'Waukegan, IL',
      eta: '2 hours 10 mins',
      status: 'Sleeper',
      times: ['06:42', '01:29', '01:29', '29:30'],
    },
  }
      {/* Sidebar: Driver List */}
      <div style={{ width: 220, background: t.surface, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ padding: '24px 0 0 0' }}>
          <div style={{ padding: '0 18px', marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 18 }}>Drivers</div>
            {mockDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                style={{
                  marginBottom: 8,
                  color: selectedDriver.id === driver.id ? t.accent : t.textSecondary,
                  fontWeight: selectedDriver.id === driver.id ? 700 : 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: selectedDriver.id === driver.id ? t.bgAlt : 'none',
                }}
              >
                {driver.name}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <button style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, marginRight: 8 }}>VoIP Call</button>
          <button style={{ background: t.warning, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600 }}>SMS</button>
        </div>
      </div>

      {/* Main Content: Driver Profile */}
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 24, marginBottom: 24, maxWidth: 900 }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{selectedDriver.name}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>{selectedDriver.company} · <span style={{ color: t.positive }}>{selectedDriver.status}</span></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600 }}>VoIP Call</button>
            <button style={{ background: t.warning, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600 }}>SMS</button>
          </div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Compliance: {selectedDriver.compliance}%</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Documents</div>
          <ul style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>
            {selectedDriver.docs.map((doc, i) => (
              <li key={i}>{doc.name} - <span style={{ color: doc.status === 'Complete' ? t.positive : t.warning }}>{doc.status}</span></li>
            ))}
          </ul>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>DQF Management</div>
          <div style={{ fontSize: 14, color: t.textSecondary }}>Safety & Compliance checklist, document uploads, and blank forms.</div>
          <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 24 }}>Real-Time Telematics & Traffic</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Location: {selectedDriver.telematics.location}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>ETA: {selectedDriver.telematics.eta}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Status: {selectedDriver.telematics.status}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Times: {selectedDriver.telematics.times.join(' · ')}</div>
          <div style={{ height: 180, background: t.bgAlt, borderRadius: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary }}>
            <span>Trimble Maps (placeholder)</span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 24 }}>Integrated ELD & ETAs</div>
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ color: t.textSecondary }}>
                <th>Driver</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Times</th>
              </tr>
            </thead>
            <tbody>
              {mockELD.map((row, i) => (
                <tr key={i}>
                  <td>{row.driver}</td>
                  <td>{row.status}</td>
                  <td>{row.eta}</td>
                  <td>{row.times.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 24 }}>Driver Application</div>
          <div style={{ fontSize: 14, color: t.textSecondary }}>Mobile app preview and driver features.</div>
          <div style={{ height: 120, background: t.bgAlt, borderRadius: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary }}>
            <span>Mobile App (placeholder)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
}
      <div style={{ width: 220, background: t.surface, borderRight: `1px solid ${t.border}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ padding: '24px 0 0 0' }}>
          <div style={{ padding: '0 18px', marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 18 }}>Drivers</div>
            {mockDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                style={{
                  marginBottom: 8,
                  color: selectedDriver.id === driver.id ? t.accent : t.textSecondary,
                  fontWeight: selectedDriver.id === driver.id ? 700 : 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: selectedDriver.id === driver.id ? t.bgAlt : 'none',
                }}
              >
                {driver.name}
              </div>
            ))}
          </div>
          <div style={{ padding: '0 18px', marginBottom: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>Drivers</div>
            {mockDrivers.map((driver) => (
              <div
                key={driver.id}
                onClick={() => setSelectedDriver(driver)}
                style={{
                  marginBottom: 8,
                  color: selectedDriver.id === driver.id ? t.accent : t.textSecondary,
                  fontWeight: selectedDriver.id === driver.id ? 700 : 500,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: selectedDriver.id === driver.id ? t.bgAlt : 'none',
                }}
              >
                {driver.name}
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: 18 }}>
          <button style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, marginRight: 8 }}>VoIP Call</button>
          <button style={{ background: t.warning, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600 }}>SMS</button>
        </div>
      </div>

      {/* Main Content: Merge all fields into Driver Profile */}
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, padding: 24, marginBottom: 24, maxWidth: 900 }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8 }}>{selectedDriver.name}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>{selectedDriver.company} · <span style={{ color: t.positive }}>{selectedDriver.status}</span></div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button style={{ background: t.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600 }}>VoIP Call</button>
            <button style={{ background: t.warning, color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 600 }}>SMS</button>
          </div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Compliance: {selectedDriver.compliance}%</div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Documents</div>
          <ul style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>
            {selectedDriver.docs.map((doc, i) => (
              <li key={i}>{doc.name} - <span style={{ color: doc.status === 'Complete' ? t.positive : t.warning }}>{doc.status}</span></li>
            ))}
          </ul>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>DQF Management</div>
          <div style={{ fontSize: 14, color: t.textSecondary }}>Safety & Compliance checklist, document uploads, and blank forms.</div>
          <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 24 }}>Real-Time Telematics & Traffic</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Location: {selectedDriver.telematics.location}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>ETA: {selectedDriver.telematics.eta}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Status: {selectedDriver.telematics.status}</div>
          <div style={{ fontSize: 14, color: t.textSecondary, marginBottom: 8 }}>Times: {selectedDriver.telematics.times.join(' · ')}</div>
          <div style={{ height: 180, background: t.bgAlt, borderRadius: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary }}>
            <span>Trimble Maps (placeholder)</span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 24 }}>Integrated ELD & ETAs</div>
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ color: t.textSecondary }}>
                <th>Driver</th>
                <th>Status</th>
                <th>ETA</th>
                <th>Times</th>
              </tr>
            </thead>
            <tbody>
              {mockELD.map((row, i) => (
                <tr key={i}>
                  <td>{row.driver}</td>
                  <td>{row.status}</td>
                  <td>{row.eta}</td>
                  <td>{row.times.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 24 }}>Driver Application</div>
          <div style={{ fontSize: 14, color: t.textSecondary }}>Mobile app preview and driver features.</div>
          <div style={{ height: 120, background: t.bgAlt, borderRadius: 8, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.textSecondary }}>
            <span>Mobile App (placeholder)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
