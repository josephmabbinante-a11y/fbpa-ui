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
      // ...existing code...
    } catch (e) {
      // handle error
    }
    setLoading(false);
  }, []);

  // ...existing code for Dashboard component...

            {error && (
              <InlineAlert>
                Backend error, using mock data: {error}
              </InlineAlert>
            )}
          </div>
        );
      }
              </div>
            </CollapsibleSection>
          )}
        </>
      )}
    </div>
  );
}
