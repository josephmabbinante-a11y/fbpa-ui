
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
  },
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
