// Centralized API URL builder
export function apiUrl(path) {
  // You can set your base URL here if needed
  // For relative API calls, just prefix with /api
  return `/api${path.startsWith('/') ? path : '/' + path}`;
}
