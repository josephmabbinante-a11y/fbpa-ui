const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '';

function apiUrl(path) {
  return `${API_URL}${path}`;
}

// Send customer message and log activity
export async function sendCustomerMessage({ message, customer, invoice, exception }) {
  try {
    const res = await fetch(apiUrl('/api/messages/send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, customer, invoice, exception }),
    });
    if (!res.ok) throw new Error(`Send failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('sendCustomerMessage error:', err);
    return { error: err.message };
  }
}

function isMockMode() {
  try {
    return localStorage.getItem('mockMode') === 'true';
  } catch {
    return false;
  }
}

function getAccessToken() {
  try {
    return localStorage.getItem('accessToken');
  } catch {
    return null;
  }
}

async function safeFetch(path, options) {
  try {
    const token = getAccessToken();
    const headers = {
      ...(options && options.headers ? options.headers : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    const res = await fetch(apiUrl(path), { ...options, headers });
    if (!res.ok) throw new Error(`Request failed with ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("safeFetch error:", path, err);
    return { error: err.message };
  }
}


// Mock data imports (only loaded if needed)
let mockInvoices, mockExceptions, mockDashboard, mockReports;

export async function getInvoices() {
  if (isMockMode()) {
    if (!mockInvoices) mockInvoices = (await import('../mock/invoices')).default;
    return mockInvoices;
  }
  return safeFetch('/api/invoices');
}


export async function getExceptions() {
  if (isMockMode()) {
    if (!mockExceptions) mockExceptions = (await import('../mock/exceptions')).default;
    return mockExceptions;
  }
  return safeFetch('/api/exceptions');
}


export async function getDashboard() {
  if (isMockMode()) {
    if (!mockDashboard) mockDashboard = (await import('../mock/dashboard')).default;
    return mockDashboard;
  }
  return safeFetch('/api/dashboard');
}


export async function getReports() {
  if (isMockMode()) {
    if (!mockReports) mockReports = (await import('../mock/reports')).default;
    return mockReports;
  }
  return safeFetch('/api/reports');
}

export async function login(payload) {
  try {
    const res = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Login failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('login error:', err);
    return { error: err.message };
  }
}

export async function connectEdiIntegration(payload) {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl('/api/edi/connect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error(`Connect failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('connectEdiIntegration error:', err);
    return { error: err.message };
  }
}

export function getInvoiceImages(invoiceId) {
  const query = invoiceId ? `?invoiceId=${encodeURIComponent(invoiceId)}` : '';
  return safeFetch(`/api/invoice-images${query}`);
}

export async function uploadInvoiceImage(payload) {
  try {
    const fd = new FormData();
    fd.append('file', payload.file);
    fd.append('invoiceId', payload.invoiceId);
    if (payload.notes) fd.append('notes', payload.notes);

    const token = getAccessToken();
    const res = await fetch(apiUrl('/api/invoice-images'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });

    if (!res.ok) throw new Error(`Upload failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('uploadInvoiceImage error:', err);
    return { error: err.message };
  }
}

export async function verifyInvoiceImage(payload) {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl('/api/invoice-images/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({
        imageId: payload.imageId,
        invoiceId: payload.invoiceId,
      }),
    });

    if (!res.ok) throw new Error(`Verify failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('verifyInvoiceImage error:', err);
    return { error: err.message };
  }
}

export async function uploadInvoiceFile(payload) {
  // payload can be a File object (legacy) or an object { fileName, invoiceCount }
  try {
    let body;
    let headers = {};
    const token = getAccessToken();

    if (payload instanceof File) {
      // legacy: send as FormData
      const fd = new FormData();
      fd.append('file', payload);
      body = fd;
    } else if (payload && typeof payload === 'object') {
      // send JSON metadata expected by mock uploads endpoint
      body = JSON.stringify({ fileName: payload.fileName, invoiceCount: payload.invoiceCount });
      headers['Content-Type'] = 'application/json';
    } else {
      return { error: 'Invalid upload payload' };
    }

    const res = await fetch(apiUrl('/api/uploads'), {
      method: 'POST',
      headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body,
    });

    if (!res.ok) throw new Error(`Upload failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('uploadInvoiceFile error:', err);
    return { error: err.message };
  }
}

export async function calculateRateLogic(payload) {
  return safeFetch('/api/rate-logic/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
