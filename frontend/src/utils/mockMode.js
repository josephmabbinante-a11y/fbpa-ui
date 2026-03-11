export function isMockModeEnabled() {
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
