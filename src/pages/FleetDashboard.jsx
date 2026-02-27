import React, { useMemo, useState } from 'react';
// import DriverCommandCardModern from '../components/DriverCommandCardModern';
// Placeholder icons (replace with your icon components or SVGs)
const IconBus = () => <span role="img" aria-label="bus" style={{fontSize: 24}}>🚌</span>;
const IconCheck = () => <span role="img" aria-label="check" style={{fontSize: 24}}>✅</span>;
const IconGauge = () => <span role="img" aria-label="gauge" style={{fontSize: 24}}>⏱️</span>;

// Mock summary data
const summary = {
  totalVehicles: 350,
  vehiclesActive: 284,
  utilization: 78,
  avgFuel: 8.9,
};

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
      { name: 'Other Required Documents', status: 'Expired' },
    ],
    telematics: {
      location: '533 Elner E Sena',
      eta: '6 hours 5 mins',
      status: 'Driving',
      times: ['04:09', '05:19', '07:17', '08:28'],
      speed: '62 mph',
      updatedMinutesAgo: 2,
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
      { name: 'Other Required Documents', status: 'Pending' },
    ],
    telematics: {
      location: 'Waukegan, IL',
      eta: '2 hours 10 mins',
      status: 'Sleeper',
      times: ['06:42', '01:29', '01:29', '29:30'],
      speed: '0 mph',
      updatedMinutesAgo: 4,
    },
  },
];

function getDutyBadgeClasses(dutyStatus) {
  if (dutyStatus === 'Driving') {
    return 'bg-green-100 text-green-700';
  }
  if (dutyStatus === 'Sleeper') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-gray-200 text-gray-700';
}

function getComplianceAccent(compliance) {
  if (compliance < 70) {
    return {
      accentClass: 'accent-red-500',
      textClass: 'text-red-600',
      barClass: 'bg-red-50',
    };
  }
  if (compliance <= 85) {
    return {
      accentClass: 'accent-yellow-500',
      textClass: 'text-yellow-600',
      barClass: 'bg-yellow-50',
    };
  }
  return {
    accentClass: 'accent-green-500',
    textClass: 'text-green-600',
    barClass: 'bg-green-50',
  };
}

function getDocumentIcon(status) {
  if (status === 'Complete') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">
        OK
      </span>
    );
  }
  if (status === 'Expired') {
    return (
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
        !
      </span>
    );
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-xs font-bold text-yellow-700">
      !
    </span>
  );
}

function getTableStatusBadge(status) {
  if (status === 'Driving') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'Sleeper') {
    return 'bg-blue-100 text-blue-700';
  }
  return 'bg-gray-200 text-gray-700';
}

function DriverListCard({ drivers, selectedDriverId, onSelectDriver }) {
  const [search, setSearch] = useState('');

  const filteredDrivers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return drivers;
    }
    return drivers.filter((driver) => driver.name.toLowerCase().includes(term));
  }, [drivers, search]);

  return (
    <aside className="col-span-12 lg:col-span-3">
      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200">
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search drivers"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-blue-400"
          />
        </div>
        <div className="space-y-2">
          {filteredDrivers.map((driver) => {
            const isActive = driver.id === selectedDriverId;
            const dotClass =
              driver.telematics.status === 'Driving'
                ? 'bg-green-500'
                : driver.telematics.status === 'Sleeper'
                  ? 'bg-blue-500'
                  : 'bg-gray-400';

            return (
              <button
                key={driver.id}
                type="button"
                onClick={() => onSelectDriver(driver)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-all duration-200 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-white' : dotClass}`} />
                <span className="text-sm font-medium">{driver.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function FleetOverviewCard({ driver }) {
  const dutyStatus =
    driver.telematics.status === 'Driving' || driver.telematics.status === 'Sleeper'
      ? driver.telematics.status
      : 'Off Duty';
  const complianceTone = getComplianceAccent(driver.compliance);

  return (
    <section className="col-span-12">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-base font-semibold text-blue-700">
              {driver.name
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{driver.name}</h1>
              <p className="text-sm text-gray-500">{driver.company}</p>
              <span className={`mt-2 inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${getDutyBadgeClasses(dutyStatus)}`}>
                {dutyStatus}
              </span>
              <div className="mt-2 flex gap-2">
                <button className="rounded-full bg-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">VoIP Call</button>
                <button className="rounded-full bg-green-200 px-3 py-1 text-xs font-semibold text-green-700">SMS</button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Compliance</p>
              <p className={`text-2xl font-bold ${complianceTone.textClass}`}>{driver.compliance}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ETA</p>
              <p className="text-2xl font-bold text-gray-900">{driver.telematics.eta}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Drive Time</p>
              <p className="text-2xl font-bold text-gray-900">{driver.telematics.times[2] || '--:--'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">HOS Remaining</p>
              <p className="text-2xl font-bold text-gray-900">{driver.telematics.times[1] || '--:--'}</p>
            </div>
          </div>
        </div>

        {/* DQF Checklist */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Safety & Compliance</h3>
          <div className="mb-2 text-sm text-gray-500">DQF: 36% Completed</div>
          <ul className="space-y-1">
            {driver.docs.map((doc) => (
              <li key={doc.name} className="flex items-center gap-2">
                {getDocumentIcon(doc.status)}
                <span className="text-sm text-gray-800">{doc.name}</span>
                <span className={`ml-auto text-xs font-semibold ${doc.status === 'Complete' ? 'text-green-700' : doc.status === 'Expired' ? 'text-red-700' : 'text-yellow-700'}`}>{doc.status}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Tabs for License, Medical, MVRs, PSPs, Uploaded */}
        <div className="mt-6">
          <div className="flex gap-2 mb-2">
            <button className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700">License</button>
            <button className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700">Medical</button>
            <button className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700">MVRs</button>
            <button className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700">PSPs</button>
            <button className="px-3 py-1 rounded-lg bg-gray-100 text-xs font-semibold text-gray-700">Uploaded</button>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-500">Checklist and document management tabs (UI only)</div>
        </div>

        <div className={`mt-4 rounded-lg p-3 ${complianceTone.barClass}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Compliance Risk</p>
            <p className={`text-sm font-semibold ${complianceTone.textClass}`}>{driver.compliance}%</p>
          </div>
          <progress
            value={driver.compliance}
            max="100"
            className={`h-2 w-full overflow-hidden rounded-full ${complianceTone.accentClass}`}
          />
        </div>
      </div>
    </section>
  );
}

function LiveMapCard({ driver }) {
  return (
    <section className="col-span-12 lg:col-span-8">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">EDI Tracking &amp; Live Location</h2>
            <p className="text-sm text-gray-500">Last Updated: {driver.telematics.updatedMinutesAgo} minutes ago</p>
          </div>
          <button className="rounded-lg bg-blue-600 text-white px-4 py-2 text-xs font-semibold shadow hover:bg-blue-700">View EDI Details</button>
        </div>
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
          {/* Google Maps Embed for EDI tracking */}
          <iframe
            title="Google Maps EDI Tracking"
            width="100%"
            height="300"
            className="rounded-lg border border-gray-300"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${encodeURIComponent(driver.telematics.location)}`}
          />
        </div>
      </div>
    </section>
  );
}

function TelemetryCard({ driver }) {
  const stats = [
    { label: 'Current Location', value: driver.telematics.location },
    { label: 'Status', value: driver.telematics.status },
    { label: 'Drive Time Today', value: driver.telematics.times[0] || '--:--' },
    { label: 'HOS Remaining', value: driver.telematics.times[1] || '--:--' },
    { label: 'ETA', value: driver.telematics.eta },
    { label: 'Speed', value: driver.telematics.speed || 'N/A' },
  ];

  return (
    <section className="col-span-12 lg:col-span-4">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-200">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Driver Analytics &amp; Telemetry</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3">
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>
        {/* Placeholder for modern analytics/graphs */}
        <div className="mt-6 rounded-lg border border-gray-100 bg-white p-4 shadow">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Performance Metrics</h3>
          <div className="flex flex-col gap-2">
            <div className="h-24 bg-gradient-to-r from-blue-100 to-blue-300 rounded-lg flex items-center justify-center text-blue-700 text-lg font-bold">Graph: Drive Time vs Compliance</div>
            <div className="h-24 bg-gradient-to-r from-green-100 to-green-300 rounded-lg flex items-center justify-center text-green-700 text-lg font-bold">Graph: Speed &amp; Location Trends</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ComplianceCard({ driver }) {
  const complianceTone = getComplianceAccent(driver.compliance);

  return (
    <section className="col-span-12 lg:col-span-6">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200">
        <h2 className="text-lg font-semibold text-gray-800">Compliance Overview</h2>
        <p className="mt-1 text-sm text-gray-500">Document readiness and risk signals</p>

        <div className={`mt-4 rounded-lg p-3 ${complianceTone.barClass}`}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Compliance Score</p>
            <p className={`text-sm font-semibold ${complianceTone.textClass}`}>{driver.compliance}%</p>
          </div>
          <progress
            value={driver.compliance}
            max="100"
            className={`h-2 w-full overflow-hidden rounded-full ${complianceTone.accentClass}`}
          />
        </div>

        <div className="mt-5 space-y-3">
          {driver.docs.map((doc) => (
            <div key={doc.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-3">
              <div className="flex items-center gap-3">
                {getDocumentIcon(doc.status)}
                <p className="text-sm font-medium text-gray-800">{doc.name}</p>
              </div>
              <p
                className={`text-xs font-semibold ${
                  doc.status === 'Complete'
                    ? 'text-green-700'
                    : doc.status === 'Expired'
                      ? 'text-red-700'
                      : 'text-yellow-700'
                }`}
              >
                {doc.status}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ELDTableCard({ rows }) {
  return (
    <section className="col-span-12">
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-200">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Integrated ELD &amp; ETAs</h2>
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-100"
          >
            View Full Logs
          </button>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-700">Driver</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-700">Location</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-700">ETA</th>
                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-700">Drive Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, index) => (
                <tr key={row.driver} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.driver}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${getTableStatusBadge(row.status)}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.location}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.eta}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.driveTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


export default function FleetDashboard() {
  const [selectedDriver, setSelectedDriver] = useState(mockDrivers[0]);
  const mockELD = useMemo(
    () =>
      mockDrivers.map((driver) => ({
        driver: driver.name,
        status: driver.telematics.status,
        location: driver.telematics.location,
        eta: driver.telematics.eta,
        driveTime: driver.telematics.times[0] || '--:--',
      })),
    []
  );

  return (
    <div className="min-h-screen w-full" style={{ background: 'linear-gradient(135deg,#181e2a 0%,#232b3e 100%)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-10 pt-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="bg-blue-900 p-2 rounded-lg"><IconBus /></span>
          <h1 className="text-3xl font-bold text-white">Management</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-[#232b3e] p-2 rounded-full"><span role="img" aria-label="bell">🔔</span></button>
          <button className="bg-[#232b3e] p-2 rounded-full"><span role="img" aria-label="settings">⚙️</span></button>
          <div className="bg-[#232b3e] px-4 py-2 rounded-lg text-white font-semibold">Spencer Waters ▾</div>
        </div>
      </header>

      {/* Top Summary Cards */}
      <section className="grid grid-cols-4 gap-6 px-10">
        <div className="bg-[#232b3e] rounded-xl p-6 flex flex-col items-start shadow">
          <span className="mb-2"><IconBus /></span>
          <span className="text-gray-400 text-sm">Total Vehicles</span>
          <span className="text-3xl font-bold text-white">{summary.totalVehicles}</span>
        </div>
        <div className="bg-[#232b3e] rounded-xl p-6 flex flex-col items-start shadow">
          <span className="mb-2"><IconCheck /></span>
          <span className="text-gray-400 text-sm">Vehicles Active</span>
          <span className="text-3xl font-bold text-white">{summary.vehiclesActive}</span>
        </div>
        <div className="bg-[#232b3e] rounded-xl p-6 flex flex-col items-start shadow">
          <span className="mb-2"><IconGauge /></span>
          <span className="text-gray-400 text-sm">Active Utilization</span>
          <span className="text-3xl font-bold text-white">{summary.utilization}%</span>
        </div>
        <div className="bg-[#232b3e] rounded-xl p-6 flex flex-col items-start shadow">
          <span className="mb-2"><IconGauge /></span>
          <span className="text-gray-400 text-sm">Fuel & Maintenance</span>
          <span className="text-3xl font-bold text-white">{summary.avgFuel} <span className="text-base font-normal">MPG</span></span>
        </div>
      </section>

      {/* Map and Main Cards */}
      <section className="grid grid-cols-12 gap-6 px-10 mt-6">
        {/* Map */}
        <div className="col-span-12 bg-[#232b3e] rounded-xl shadow p-0 overflow-hidden" style={{height: 320}}>
          <iframe
            title="Fleet Map"
            width="100%"
            height="320"
            className="rounded-xl"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=Los+Angeles,CA`}
          />
        </div>
      </section>

      {/* Lower Cards and Table */}
      <section className="grid grid-cols-12 gap-6 px-10 mt-6">
        {/* Fleet Status Donut, Fuel Consumption Line, Driver Leaderboard, Vehicles in Maintenance, Vehicles List */}
        <div className="col-span-3 bg-[#232b3e] rounded-xl p-6 shadow flex flex-col items-center">
          <span className="text-gray-400 text-sm mb-2">Fleet Status</span>
          {/* Placeholder Donut Chart */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-green-400 flex items-center justify-center text-3xl font-bold text-white">
            {summary.vehiclesActive}
          </div>
          <div className="mt-4 w-full flex flex-col gap-1">
            <span className="text-blue-400 text-xs">78% Active</span>
            <span className="text-yellow-400 text-xs">14% Inactive</span>
            <span className="text-pink-400 text-xs">15% Maintenance</span>
          </div>
        </div>
        <div className="col-span-3 bg-[#232b3e] rounded-xl p-6 shadow flex flex-col">
          <span className="text-gray-400 text-sm mb-2">Fuel Consumption</span>
          {/* Placeholder Line Chart */}
          <div className="w-full h-32 bg-gradient-to-tr from-blue-900 to-blue-400 rounded-lg flex items-center justify-center text-blue-200 font-bold">Line Chart</div>
        </div>
        <div className="col-span-3 bg-[#232b3e] rounded-xl p-6 shadow flex flex-col">
          <span className="text-gray-400 text-sm mb-2">Driver Leaderboard</span>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">A</span>
              <span className="text-white font-semibold">Alex Miller</span>
              <span className="ml-auto text-green-400 font-bold">1,250 miles</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">S</span>
              <span className="text-white font-semibold">Sarah Lee</span>
              <span className="ml-auto text-green-400 font-bold">1,150 miles</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">J</span>
              <span className="text-white font-semibold">John Smith</span>
              <span className="ml-auto text-green-400 font-bold">1,000 miles</span>
            </div>
          </div>
        </div>
        <div className="col-span-3 bg-[#232b3e] rounded-xl p-6 shadow flex flex-col">
          <span className="text-gray-400 text-sm mb-2">Vehicles in Maintenance</span>
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">A</span>
              <span className="text-white font-semibold">Alex Miller</span>
              <span className="ml-auto text-green-400 font-bold">1,229 miles</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">S</span>
              <span className="text-white font-semibold">Sarah Lee</span>
              <span className="ml-auto text-green-400 font-bold">1,250 miles</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold">J</span>
              <span className="text-white font-semibold">John Smith</span>
              <span className="ml-auto text-green-400 font-bold">1,250 miles</span>
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle List Table */}
      <section className="px-10 mt-6 pb-10">
        <div className="bg-[#232b3e] rounded-xl shadow p-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-gray-400 text-xs uppercase">
                <th className="px-4 py-2 text-left">Vehicle List</th>
                <th className="px-4 py-2 text-left">Driver</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Last Trip</th>
                <th className="px-4 py-2 text-left">Odometer</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-white border-b border-[#2e3650]">
                <td className="px-4 py-2"><span className="bg-green-700 px-2 py-1 rounded text-xs">Active</span> Active</td>
                <td className="px-4 py-2">Ford Banson</td>
                <td className="px-4 py-2">Dalla F-150</td>
                <td className="px-4 py-2">Mercedes Capcadia</td>
                <td className="px-4 py-2">Dallas, TX</td>
              </tr>
              <tr className="text-white border-b border-[#2e3650]">
                <td className="px-4 py-2"><span className="bg-blue-700 px-2 py-1 rounded text-xs">Active</span> Active</td>
                <td className="px-4 py-2">Joe Carter</td>
                <td className="px-4 py-2">Meredad Spriner</td>
                <td className="px-4 py-2">Freight Cascadia</td>
                <td className="px-4 py-2">Chicago, FL</td>
              </tr>
              <tr className="text-white">
                <td className="px-4 py-2"><span className="bg-green-700 px-2 py-1 rounded text-xs">Active</span> Miami FL</td>
                <td className="px-4 py-2">Emma Whison</td>
                <td className="px-4 py-2">Emma Seminson</td>
                <td className="px-4 py-2">Freightliner Cassadia</td>
                <td className="px-4 py-2">Chicago, IL</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
