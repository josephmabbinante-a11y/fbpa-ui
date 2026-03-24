export function isMockModeEnabled() {
  // In production builds, only allow env-var-based mock mode (never localStorage)
  if (import.meta.env.PROD) return false;

  const envMock = import.meta.env.VITE_MOCK_MODE === 'true';
  const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';

  let storageMock = false;
  try {
    storageMock = typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true';
  } catch {
    storageMock = false;
  }

  return envMock || useMockApi || storageMock;
}
