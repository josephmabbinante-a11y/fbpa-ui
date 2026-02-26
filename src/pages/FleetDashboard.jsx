import React, { useState } from 'react';
import { useTheme, themes } from '../contexts/ThemeContext';

// Mock data
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
];

const mockELD = [
  { driver: 'Mohamed Fernandez Yaser', status: 'Driving', eta: 'Deerfield Beach, FL in 6 hours 5 mins', times: ['04:09', '05:19', '07:17', '08:28'] },
  { driver: 'Chandier Rivera Rodriguez', status: 'Driving', eta: 'Evansville, TN in 1 hour 59 mins', times: ['01:01', '04:01', '06:37', '62:44'] },
  { driver: 'Gabor Ujhelyi', status: 'Sleeper', eta: 'Swedesboro, NJ in 7 hours 20 mins', times: ['06:42', '01:29', '01:29', '29:30'] },
];

export default function FleetDashboard() {
  const { theme } = useTheme();
  const t = themes[theme];
  const [selectedDriver, setSelectedDriver] = useState(mockDrivers[0]);
  // Remove menu state

  return (
    <div className="bg-gray-50 min-h-screen px-8 py-8">
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-2">
        {/* Top: Driver Overview Card */}
        <div className="col-span-12 mb-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-8 transition-all duration-200 hover:shadow-md">
            <div className="flex flex-col gap-2">
              <div className="text-2xl font-bold text-gray-900">{selectedDriver.name}</div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-lg font-semibold ${selectedDriver.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{selectedDriver.status}</span>
                <span className="text-sm text-gray-500">Compliance: <span className="font-bold text-blue-600">{selectedDriver.compliance}%</span></span>
                <span className="text-sm text-gray-500">ETA: <span className="font-bold text-purple-600">{selectedDriver.telematics.eta}</span></span>
              </div>
              {/* Compact KPI Row */}
              <div className="flex gap-4 mt-2">
                <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700">Status: {selectedDriver.telematics.status}</div>
                <div className="bg-gray-50 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700">Location: {selectedDriver.telematics.location}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Map & Telemetry Panel */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-72 flex items-center justify-center transition-all duration-200 hover:shadow-md">
            <span className="text-gray-400">[Map Placeholder]</span>
          </div>
        </div>
        <div className="col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-72 flex flex-col gap-4 transition-all duration-200 hover:shadow-md">
            <div className="text-lg font-semibold text-gray-800 mb-2">Live Telemetry</div>
            <div className="text-sm text-gray-500">Times: {selectedDriver.telematics.times.join(' · ')}</div>
            <div className="text-sm text-gray-500">Status: {selectedDriver.telematics.status}</div>
            <div className="text-sm text-gray-500">ETA: {selectedDriver.telematics.eta}</div>
          </div>
        </div>

        {/* Below: Compliance Module */}
        <div className="col-span-12 mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-md">
            <div className="text-lg font-semibold text-gray-800 mb-2">Compliance Progress</div>
            <div className="flex gap-4">
              {selectedDriver.docs.map((doc, i) => (
                <div key={i} className={`px-4 py-2 rounded-lg font-semibold text-sm ${doc.status === 'Complete' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{doc.name}: {doc.status}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom: ELD Table */}
        <div className="col-span-12 mt-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200 hover:shadow-md">
            <div className="text-lg font-semibold text-gray-800 mb-2">ELD Status</div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Driver</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">ETA</th>
                  <th className="px-3 py-2 text-left">Times</th>
                </tr>
              </thead>
              <tbody>
                {mockELD.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-900">{row.driver}</td>
                    <td className={`px-3 py-2 font-semibold ${row.status === 'Driving' ? 'bg-green-100 text-green-700 rounded' : 'bg-purple-100 text-purple-700 rounded'}`}>{row.status}</td>
                    <td className="px-3 py-2">{row.eta}</td>
                    <td className="px-3 py-2">{row.times.join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
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
