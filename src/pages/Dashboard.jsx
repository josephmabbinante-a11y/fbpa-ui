import { useEffect, useState } from 'react';
// ...existing imports...

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(dashboardEnhanced);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardPrefs, setDashboardPrefs] = useState(defaultDashboardPrefs);
  const [variant, setVariant] = useState(() => {
    try {
      return localStorage.getItem(DASH_VARIANT_KEY) || 'shipper';
    } catch {
      return 'shipper';
    }
  });

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem(DASH_PREFS_KEY));
      if (prefs) setDashboardPrefs(prefs);
    } catch {}
  }, []);

  // KPICompact component for KPI row
  function KPICompact({ title, value, change, accent }) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${accent} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-2`}>
        <div className="text-sm text-gray-500 font-medium">{title}</div>
        <div className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="flex items-center gap-2">
          {change !== undefined && (
            <span className={change > 0 ? 'text-green-600' : 'text-red-600'}>
              {change > 0 ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          )}
          {/* Sparkline placeholder */}
          <span className="ml-auto text-xs text-gray-400">[Sparkline]</span>
        </div>
      </div>
    );
  }

  // Tailwind Freight Intelligence Command Center Layout
  return (
    // ...existing code...
          <div className="col-span-12 lg:col-span-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200">
            <div className="text-lg font-semibold text-gray-800 mb-4">Carrier Overcharge Leaderboard</div>
            {/* Carrier Leaderboard Table placeholder */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-xs uppercase tracking-wide">
                  <tr>
                    <th className="px-3 py-2 text-left">Carrier</th>
// ...existing code...
                <tbody>
                  {/* Replace with real leaderboard data */}
                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                    <td className="px-3 py-2 font-medium">FastShip</td>
                    <td className="px-3 py-2">12</td>
                    <td className="px-3 py-2">$2,450.75</td>
                    <td className="px-3 py-2 text-red-600 font-bold">8.2%</td>
                  </tr>
                  <tr className="even:bg-gray-50 hover:bg-gray-100">
                    <td className="px-3 py-2 font-medium">Oceanic</td>
              {error && ( 
                <InlineAlert> 
                  Backend error, using mock data: {error} 
                </InlineAlert> 
              )} 
            </div> 
          </div> 
        ); 
      } 

      // KPICompact component for KPI row 
      function KPICompact({ title, value, change, accent }) { 
        return ( 
          <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${accent} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 flex flex-col gap-2`}> 
            <div className="text-sm text-gray-500 font-medium">{title}</div> 
            <div className="text-3xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString() : value}</div> 
            <div className="flex items-center gap-2"> 
              {change !== undefined && ( 
                <span className={change > 0 ? 'text-green-600' : 'text-red-600'}> 
                  {change > 0 ? '▲' : '▼'} {Math.abs(change)}% 
                </span> 
              )} 
              {/* Sparkline placeholder */} 
              <span className="ml-auto text-xs text-gray-400">[Sparkline]</span> 
            </div> 
          </div> 
        ); 
      } 
        </div>

        {/* RECENT ACTIVITY */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold text-gray-800">Recent Activity</div>
              <button className="bg-gray-100 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-200 transition-all duration-200">View All</button>
            </div>
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Details</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity?.slice(0, 7).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-100 transition-all duration-200">
                    <td className="px-3 py-2">{row.type}</td>
                    <td className="px-3 py-2">{row.invoiceNumber || row.fileName || '-'}</td>
                    <td className="px-3 py-2">
                      <span className={
                        row.status === 'Review' ? 'bg-yellow-100 text-yellow-700 rounded px-2 py-1 text-xs font-semibold' :
                        row.status === 'Processed' ? 'bg-green-100 text-green-700 rounded px-2 py-1 text-xs font-semibold' :
                        row.status === 'Fail' ? 'bg-red-100 text-red-700 rounded px-2 py-1 text-xs font-semibold' :
                        'bg-gray-100 text-gray-700 rounded px-2 py-1 text-xs font-semibold'
                      }>{row.status}</span>
                    </td>
                    <td className="px-3 py-2">{new Date(row.timestamp).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <InlineAlert>
            Backend error, using mock data: {error}
          </InlineAlert>
        )}
      </div>
    </div>
  );
              <div className="text-lg font-semibold text-gray-800">🕒 Recent Activity</div>
              <button className="bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-300 transition-all duration-200">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left">Invoice</th>
                    <th className="px-3 py-2 text-left">Carrier</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity?.slice(0, 7).map((row, i) => (
                    <tr key={row.id} className="hover:bg-gray-100 transition-all duration-200">
                      <td className="px-3 py-3 font-semibold text-gray-900">{row.invoiceNumber}</td>
                      <td className="px-3 py-3">{row.carrier}</td>
                      <td className="px-3 py-3">${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 py-3">
                        {row.status === 'Review' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-semibold">Review</span>}
                        {row.status === 'Processed' && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Processed</span>}
                        {row.status === 'Fail' && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Failed</span>}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-500">{new Date(row.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {error && (
          <InlineAlert>
            Backend error, using mock data: {error}
          </InlineAlert>
        )}
      </div>
    </div>
  );
}
// ...existing code...
              </div>
            )}
          </div>

          {/* Summary Tables */}
          {dashboardPrefs.showRecentActivity && data.recentActivity && (
            <CollapsibleSection title={variant === 'broker' ? 'Recent Loads' : 'Recent Activity'} defaultOpen={true}>
              <div className="ui-table-wrap">
                <table className="ui-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>{variant === 'broker' ? 'Load/File' : 'Invoice/File'}</th>
                    <th>{variant === 'broker' ? 'Margin' : 'Amount'}</th>
                    <th>Status</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentActivity?.slice(0, 5).map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.type}</td>
                      <td>{activity.invoiceNumber || activity.fileName}</td>
                      <td>
                        {variant === 'broker'
                          ? (activity.margin ? `${activity.margin}%` : activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)
                          : (activity.amount ? `$${activity.amount.toLocaleString()}` : activity.count)}
                      </td>
                      <td>{activity.status}</td>
                      <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}
