import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InlineAlert } from '../components/ui/Primitives';
import CollapsibleSection from '../components/CollapsibleSection';
import SavingsByCarrierChart from '../components/SavingsByCarrierChart';
import ExceptionBreakdownChart from '../components/ExceptionBreakdownChart';
import dashboardEnhanced from '../mock/dashboardEnhanced';
import defaultDashboardPrefs from '../mock/dashboard';

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

      // ...existing code...
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
