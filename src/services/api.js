// src/services/api.js
// Basic API utility for frontend
const request = async (path, options = {}) => {
  const response = await fetch(`/api${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    error.response = { data, status: response.status };
    throw error;
  }

  return { data, status: response.status };
};

const api = {
  get: (path, options = {}) => request(path, { ...options, method: 'GET' }),
};

export default api;
