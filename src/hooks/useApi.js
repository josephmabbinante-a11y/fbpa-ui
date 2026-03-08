import { useEffect, useState } from 'react';

/**
 * Custom hook for API calls with loading, error states, and cleanup
 * @param {Function} apiCall - The API function to call
 * @param {*} fallbackData - Fallback data to use initially
 * @param {Array} deps - Dependencies array (optional)
 */
export function useApi(apiCall, fallbackData = null, deps = []) {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        
        if (!mounted) return;
        
        if (result && result.error) {
          setError(result.error);
          setData(fallbackData);
        } else {
          setData(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || String(err));
          setData(fallbackData);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}
