import { useEffect, useState, useCallback } from 'react';
import {
  mtLogin,
  mtLogout,
  getMtAccessToken,
  mtListTenants,
  mtGetTenant,
  mtCreateTenant,
  mtUpdateTenantStatus,
  mtListUsers,
  mtCreateUser,
  mtGetSettings,
  mtUpdateSettings,
  mtGetFeatures,
  mtSetFeature,
  mtListLoads,
  mtCreateLoad,
  mtListCarriers,
  mtImpersonateTenant,
  mtStopImpersonation,
  getMtImpersonatedTenantId,
} from '../api/multitenantClient';

/**
 * Hook for multitenant auth state and API actions.
 * Returns auth helpers, tenant/user/settings actions, and impersonation controls.
 */
export function useMtAuth() {
  const [accessToken, setAccessToken] = useState(() => getMtAccessToken());
  const [impersonatedTenantId, setImpersonatedTenantId] = useState(() => getMtImpersonatedTenantId());

  const login = useCallback(async (email, password) => {
    const result = await mtLogin(email, password);
    if (!result.error) {
      setAccessToken(getMtAccessToken());
    }
    return result;
  }, []);

  const logout = useCallback(() => {
    mtLogout();
    mtStopImpersonation();
    setAccessToken(null);
    setImpersonatedTenantId(null);
  }, []);

  const impersonate = useCallback(async (tenantId) => {
    const result = await mtImpersonateTenant(tenantId);
    if (!result.error) {
      setImpersonatedTenantId(tenantId);
    }
    return result;
  }, []);

  const stopImpersonation = useCallback(() => {
    mtStopImpersonation();
    setImpersonatedTenantId(null);
  }, []);

  return {
    accessToken,
    impersonatedTenantId,
    isAuthenticated: Boolean(accessToken),
    login,
    logout,
    impersonate,
    stopImpersonation,
  };
}

/**
 * Generic hook for one-shot multitenant API calls with loading/error states.
 * Mirrors the existing useApi hook pattern.
 * @param {Function} apiCall - The multitenant API function to call
 * @param {*} fallbackData - Initial / fallback data
 * @param {Array} deps - Re-fetch dependencies
 */
export function useMtApi(apiCall, fallbackData = null, deps = []) {
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
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, setData };
}

export {
  mtListTenants,
  mtGetTenant,
  mtCreateTenant,
  mtUpdateTenantStatus,
  mtListUsers,
  mtCreateUser,
  mtGetSettings,
  mtUpdateSettings,
  mtGetFeatures,
  mtSetFeature,
  mtListLoads,
  mtCreateLoad,
  mtListCarriers,
};
