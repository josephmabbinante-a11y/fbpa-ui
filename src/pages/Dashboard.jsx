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
              )}
              <span className="ml-auto text-xs text-gray-400">[Sparkline]</span>
            </div>
          </div>
        );
      }

      export default function Dashboard() {
        const navigate = useNavigate();
        const [data, setData] = useState(dashboardEnhanced);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [dashboardPrefs, setDashboardPrefs] = useState(defaultDashboardPrefs);
        const [variant, setVariant] = useState('shipper');

        useEffect(() => {
          try {
            const prefs = JSON.parse(localStorage.getItem('DASH_PREFS_KEY'));
            if (prefs) setDashboardPrefs(prefs);
          } catch {}
        }, []);

        return (
          <div className="dashboard-page">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <KPICompact title="Recovery Rate %" value={data.summary?.recoveryRate || 92.5} change={+2.1} accent="border-l-4 border-green-400" />
              <KPICompact title="Total Recovered ($)" value={data.summary?.totalRecovered || 12450.75} change={+4.3} accent="border-l-4 border-blue-400" />
              <KPICompact title="Exception Rate %" value={data.summary?.exceptionRate || 7.1} change={-0.8} accent="border-l-4 border-red-400" />
              <KPICompact title="Cost per Shipment" value={data.summary?.costPerShipment || 32.8} change={+0.5} accent="border-l-4 border-yellow-400" />
              <KPICompact title="Avg Resolution Time" value={data.summary?.avgResolutionTime || 2.4} change={-0.2} accent="border-l-4 border-purple-400" />
            </div>

            {/* PRIMARY ANALYTICS ROW */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              <div className="col-span-12 lg:col-span-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200">
                <div className="text-lg font-semibold text-gray-800 mb-4">Savings & Recovery Trend</div>
                <SavingsByCarrierChart data={data.trends?.savingsTrend} />
              </div>
              <div className="col-span-12 lg:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-all duration-200">
                <div className="text-lg font-semibold text-gray-800 mb-4">Exception Trend</div>
                <ExceptionBreakdownChart data={data.trends?.exceptionTrend} />
              </div>
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
        );
      }
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
