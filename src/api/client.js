const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? ''
  : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

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

// Removed JWT token retrieval

async function safeFetch(path, options) {
  try {
    const headers = {
      ...(options && options.headers ? options.headers : {}),
    };
    const res = await fetch(apiUrl(path), { ...options, headers });
    if (!res.ok) throw new Error(`Request failed with ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("safeFetch error:", path, err);
    return { error: err.message };
  }
}


// Mock data imports
import mockInvoices from '../mock/invoices';
import mockExceptions from '../mock/exceptions';
import mockDashboard from '../mock/dashboard';
import mockReports from '../mock/reports';

export async function getInvoices(type) {
  if (isMockMode()) {
    return mockInvoices;
  }
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  return safeFetch(`/api/invoices${query}`);
}

export async function getCustomers() {
  if (isMockMode()) {
    return [];
  }
  return safeFetch('/api/customers');
}

export async function getCustomerDetail(id) {
  if (!id) return { error: 'Customer id is required' };
  return safeFetch(`/api/customers/${encodeURIComponent(id)}`);
}

export async function getCustomerAging(id) {
  if (!id) return { error: 'Customer id is required' };
  return safeFetch(`/api/customers/${encodeURIComponent(id)}/aging`);
}

export async function getCarriers() {
  if (isMockMode()) {
    return [];
  }
  return safeFetch('/api/carriers');
}

export async function createInvoice(payload) {
  try {
    const token = getAccessToken();
    const res = await fetch(apiUrl('/api/invoices'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Create invoice failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('createInvoice error:', err);
    return { error: err.message };
  }
}

export async function getExceptions() {
  if (isMockMode()) {
    return mockExceptions;
  }
  return safeFetch('/api/exceptions');
}

export async function getDashboard() {
  if (isMockMode()) {
    return mockDashboard;
  }
  return safeFetch('/api/dashboard');
}

export async function getReports() {
  if (isMockMode()) {
    return mockReports;
  }
  return safeFetch('/api/reports');
}

export async function login(payload) {
  console.log('Frontend login payload:', payload);
  try {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || `Login failed ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('login error:', err);
    return { error: err.message };
  }
}

export async function connectEdiIntegration(payload) {
  try {
    const res = await fetch(apiUrl('/api/edi/connect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const res = await fetch(apiUrl('/api/invoice-images'), {
      method: 'POST',
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
    const res = await fetch(apiUrl('/api/invoice-images/verify'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { ...headers },
      body
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

export async function register(payload) {
  console.log('Frontend register payload:', payload);
  try {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Register failed ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('register error:', err);
    return { error: err.message };
  }
}

