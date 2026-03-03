import mockInvoices from '../mock/invoices';
import mockExceptions from '../mock/exceptions';
import mockDashboard from '../mock/dashboard';
import mockReports from '../mock/reports';

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
    console.error('sendCustomerMessage error:', err?.message || JSON.stringify(err));
    return { error: err.message };
  }
}

// Unify mock mode: check both env and DemoContext/localStorage.
function isMockMode() {
  // Only enable mock mode if VITE_MOCK_MODE or demoMode is true
  return import.meta.env.VITE_MOCK_MODE === 'true' ||
    (typeof window !== 'undefined' && localStorage.getItem('demoMode') === 'true');
}

const seedMockCarriers = [
  {
    id: 'cr-mock-1',
    name: 'Prime Logistics',
    mcNumber: 'MC123456',
    taxId: '12-3456789',
    email: 'ops@primelogistics.com',
    phone: '(555) 100-1000',
    paymentTerms: 'Net 30',
    insuranceExpiry: '2026-12-31T00:00:00.000Z',
    status: 'Active',
    totalSpend: 420000,
    openAP: 28000,
    invoiceCount: 128,
  },
  {
    id: 'cr-mock-2',
    name: 'Velocity Van Logistics',
    mcNumber: 'MC654321',
    taxId: '98-7654321',
    email: 'dispatch@velocityvan.com',
    phone: '(555) 200-2000',
    paymentTerms: 'Quick Pay',
    insuranceExpiry: '2026-08-15T00:00:00.000Z',
    status: 'Alert',
    totalSpend: 185000,
    openAP: 47200,
    invoiceCount: 63,
  },
  {
    id: 'cr-mock-3',
    name: 'Polar Freight Solutions',
    mcNumber: 'MC112233',
    taxId: '',
    email: 'carrier@polarfreight.com',
    phone: '(555) 300-3000',
    paymentTerms: 'Net 21',
    insuranceExpiry: '2025-12-01T00:00:00.000Z',
    status: 'Alert',
    totalSpend: 98000,
    openAP: 16500,
    invoiceCount: 39,
  },
];

let mockCarrierStore = [...seedMockCarriers];

// Removed JWT token retrieval

async function safeFetch(path, options) {
  try {
    const headers = {
      ...(options && options.headers ? options.headers : {}),
    };
    const res = await fetch(apiUrl(path), { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || `Request failed with ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error("safeFetch error:", path, err?.message || JSON.stringify(err));
    const isNetworkError = err instanceof TypeError && String(err.message || '').toLowerCase().includes('fetch');
    if (isNetworkError) {
      return { error: 'Unable to reach API server. Start backend on port 4000 and retry.' };
    }
    return { error: err.message };
  }
}

async function fetchJsonWithFallback(paths, options, failurePrefix) {
  let lastError = null;

  for (const path of paths) {
    try {
      const res = await fetch(apiUrl(path), options);
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `${failurePrefix} ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(failurePrefix);
}


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

export async function getCarriers(params = {}) {
  if (isMockMode()) {
    const rawLimit = Number.parseInt(String(params?.limit || ''), 10);
    const hasLimit = Number.isFinite(rawLimit) && rawLimit > 0;
    const limit = hasLimit ? rawLimit : null;
    const carriers = limit ? mockCarrierStore.slice(0, limit) : mockCarrierStore;
    return {
      carriers,
      total: mockCarrierStore.length,
      returned: carriers.length,
      limited: Boolean(limit),
      source: 'mock',
    };
  }

  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return safeFetch(`/api/carriers${suffix}`);
}

export async function createCarrier(payload) {
  if (isMockMode()) {
    const name = String(payload?.name || '').trim();
    if (!name) return { error: 'Name is required' };

    const newCarrier = {
      id: `cr-mock-${Date.now()}`,
      name,
      mcNumber: String(payload?.mcNumber || '').trim(),
      taxId: String(payload?.taxId || '').trim(),
      email: String(payload?.email || '').trim(),
      phone: String(payload?.phone || '').trim(),
      paymentTerms: String(payload?.paymentTerms || '').trim() || 'Net 30',
      insuranceExpiry: payload?.insuranceExpiry || null,
      status: 'Active',
      totalSpend: 0,
      openAP: 0,
      invoiceCount: 0,
    };

    mockCarrierStore = [newCarrier, ...mockCarrierStore];
    return newCarrier;
  }

  return safeFetch('/api/carriers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function updateCarrier(carrierId, payload) {
  if (!carrierId) {
    return { error: 'carrierId is required' };
  }

  if (isMockMode()) {
    const index = mockCarrierStore.findIndex((carrier) => carrier.id === carrierId);
    if (index < 0) {
      return { error: 'Carrier not found' };
    }

    const next = {
      ...mockCarrierStore[index],
      ...payload,
      id: mockCarrierStore[index].id,
    };
    mockCarrierStore = mockCarrierStore.map((carrier, candidateIndex) => (
      candidateIndex === index ? next : carrier
    ));
    return next;
  }

  return safeFetch(`/api/carriers/${encodeURIComponent(carrierId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function purgeCarriers() {
  if (isMockMode()) {
    const deletedCount = mockCarrierStore.length;
    mockCarrierStore = [];
    return {
      message: `Purged ${deletedCount} carriers`,
      deletedCount,
      source: 'mock',
    };
  }

  return safeFetch('/api/carriers/purge', {
    method: 'DELETE',
  });
}

export async function searchCarrierSafer(params = {}) {
  const dotNumber = String(params.dotNumber || '').trim();
  const mcNumber = String(params.mcNumber || '').trim();
  if (!dotNumber && !mcNumber) {
    return { error: 'Provide a DOT or MC number for SAFER search' };
  }

  if (isMockMode()) {
    const normalizedDot = dotNumber.replace(/\D/g, '') || '1234567';
    const normalizedMc = (mcNumber.replace(/\D/g, '') || '765432');
    return {
      snapshot: {
        legalName: `Mock Carrier ${normalizedDot || normalizedMc}`,
        dbaName: 'Mock Freight Network',
        dotNumber: normalizedDot,
        mcNumber: `MC${normalizedMc}`,
        phone: '(555) 999-0000',
        physicalAddress: '123 Mock St, Orlando, FL 32801',
        mailingAddress: 'PO Box 100, Orlando, FL 32802',
        entityType: 'Carrier',
        operatingStatus: 'AUTHORIZED FOR Property',
        outOfServiceDate: '',
        powerUnits: '42',
        drivers: '55',
        mcs150Date: '2026-01-15',
        mappedStatus: 'Active',
      },
      sourceUrl: 'https://safer.fmcsa.dot.gov/',
      fetchedAt: new Date().toISOString(),
      query: {
        dotNumber: normalizedDot,
        mcNumber: mcNumber || '',
      },
    };
  }

  const query = new URLSearchParams();
  if (dotNumber) query.set('dotNumber', dotNumber);
  if (mcNumber) query.set('mcNumber', mcNumber);

  return safeFetch(`/api/carriers/fmcsa/snapshot?${query.toString()}`);
}

export async function importCarrierFromSafer(params = {}) {
  const payload = {
    dotNumber: String(params.dotNumber || '').trim(),
    mcNumber: String(params.mcNumber || '').trim(),
  };

  if (!payload.dotNumber && !payload.mcNumber) {
    return { error: 'Provide a DOT or MC number to import from SAFER' };
  }

  if (isMockMode()) {
    const dotNumber = payload.dotNumber.replace(/\D/g, '') || '1234567';
    const mcNumber = payload.mcNumber.replace(/\D/g, '') || '765432';
    const normalizedMc = `MC${mcNumber}`;
    const existingIndex = mockCarrierStore.findIndex((carrier) => String(carrier.mcNumber || '').toUpperCase() === normalizedMc.toUpperCase());

    const importedCarrier = {
      id: existingIndex >= 0 ? mockCarrierStore[existingIndex].id : `cr-mock-${Date.now()}`,
      name: `Mock Carrier ${dotNumber}`,
      mcNumber: normalizedMc,
      dotNumber,
      taxId: existingIndex >= 0 ? mockCarrierStore[existingIndex].taxId : '11-1111111',
      email: existingIndex >= 0 ? mockCarrierStore[existingIndex].email : `ops+${dotNumber}@mockcarrier.com`,
      phone: existingIndex >= 0 ? mockCarrierStore[existingIndex].phone : '(555) 999-0000',
      paymentTerms: existingIndex >= 0 ? mockCarrierStore[existingIndex].paymentTerms : 'Net 30',
      insuranceExpiry: existingIndex >= 0 ? mockCarrierStore[existingIndex].insuranceExpiry : '2026-12-31T00:00:00.000Z',
      status: 'Active',
      totalSpend: existingIndex >= 0 ? Number(mockCarrierStore[existingIndex].totalSpend || 0) : 0,
      openAP: existingIndex >= 0 ? Number(mockCarrierStore[existingIndex].openAP || 0) : 0,
      invoiceCount: existingIndex >= 0 ? Number(mockCarrierStore[existingIndex].invoiceCount || 0) : 0,
    };

    if (existingIndex >= 0) {
      mockCarrierStore = mockCarrierStore.map((carrier, index) => (index === existingIndex ? importedCarrier : carrier));
      return { carrier: importedCarrier, created: false, snapshot: importedCarrier, source: { provider: 'mock-safer' } };
    }

    mockCarrierStore = [importedCarrier, ...mockCarrierStore];
    return { carrier: importedCarrier, created: true, snapshot: importedCarrier, source: { provider: 'mock-safer' } };
  }

  return safeFetch('/api/carriers/fmcsa/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function uploadCarriersCsv(file) {
  if (!file) {
    return { error: 'Select a CSV file first' };
  }

  const tryBackendUpload = async () => {
    try {
      const fd = new FormData();
      fd.append('file', file);

      const res = await fetch(apiUrl('/api/carriers/upload-csv'), {
        method: 'POST',
        body: fd,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Carrier CSV upload failed ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      return { error: err.message };
    }
  };

  if (isMockMode()) {
    const backendResult = await tryBackendUpload();
    if (!backendResult?.error) {
      return backendResult;
    }

    const MAX_MOCK_FILE_SIZE_BYTES = 2 * 1024 * 1024;
    if (Number(file.size || 0) > MAX_MOCK_FILE_SIZE_BYTES) {
      return {
        error: 'Large CSV detected in Mock Mode. Start backend API and retry, or reduce file size for mock import.',
      };
    }

    try {
      const csvText = await file.text();
      const lines = String(csvText || '').split(/\r?\n/).filter((line) => line.trim() !== '');
      if (lines.length < 2) {
        return { error: 'CSV must include a header row and at least one data row' };
      }

      const MAX_MOCK_ROWS = 20000;
      if (lines.length - 1 > MAX_MOCK_ROWS) {
        return {
          error: `Mock import supports up to ${MAX_MOCK_ROWS.toLocaleString()} rows. Use backend API for larger files.`,
        };
      }

      const parseLine = (line) => {
        const values = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i += 1) {
          const char = line[i];
          if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
              current += '"';
              i += 1;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }

        values.push(current.trim());
        return values;
      };

      const headers = parseLine(lines[0]).map((header) => String(header || '').trim().toLowerCase());
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors = [];

      for (let index = 1; index < lines.length; index += 1) {
        const cells = parseLine(lines[index]);
        const row = headers.reduce((acc, header, headerIndex) => {
          acc[header] = String(cells[headerIndex] || '').trim();
          return acc;
        }, {});

        const name = row.name || row.carrier || row.company || row.legalname || '';
        const rawMc = row.mcnumber || row.mc || row.docket || '';
        const mcNumber = rawMc ? (rawMc.toUpperCase().startsWith('MC') ? rawMc.toUpperCase() : `MC${rawMc.replace(/\D/g, '')}`) : '';
        const dotNumber = (row.dotnumber || row.dot || row.usdot || '').replace(/\D/g, '');

        if (!name && !mcNumber && !dotNumber) {
          skipped += 1;
          continue;
        }

        try {
          const existingIndex = mockCarrierStore.findIndex((carrier) => {
            const byMc = mcNumber && String(carrier.mcNumber || '').toUpperCase() === mcNumber.toUpperCase();
            const byDot = dotNumber && String(carrier.dotNumber || '').replace(/\D/g, '') === dotNumber;
            return byMc || byDot;
          });

          const statusValue = String(row.status || 'Active').toLowerCase();
          let status = 'Active';
          if (statusValue.includes('inactive')) status = 'Inactive';
          if (statusValue.includes('alert') || statusValue.includes('issue')) status = 'Alert';

          const nextCarrier = {
            id: existingIndex >= 0 ? mockCarrierStore[existingIndex].id : `cr-mock-${Date.now()}-${index}`,
            name: name || (existingIndex >= 0 ? mockCarrierStore[existingIndex].name : `Carrier ${index}`),
            mcNumber: mcNumber || (existingIndex >= 0 ? mockCarrierStore[existingIndex].mcNumber : ''),
            dotNumber: dotNumber || (existingIndex >= 0 ? mockCarrierStore[existingIndex].dotNumber : ''),
            taxId: row.taxid || row.tax_id || row.ein || (existingIndex >= 0 ? mockCarrierStore[existingIndex].taxId : ''),
            email: row.email || (existingIndex >= 0 ? mockCarrierStore[existingIndex].email : ''),
            phone: row.phone || row.phonenumber || (existingIndex >= 0 ? mockCarrierStore[existingIndex].phone : ''),
            paymentTerms: row.paymentterms || row.payment_terms || (existingIndex >= 0 ? mockCarrierStore[existingIndex].paymentTerms : 'Net 30'),
            insuranceExpiry: row.insuranceexpiry || row.insurance_expiry || (existingIndex >= 0 ? mockCarrierStore[existingIndex].insuranceExpiry : null),
            status,
            totalSpend: existingIndex >= 0 ? Number(mockCarrierStore[existingIndex].totalSpend || 0) : 0,
            openAP: existingIndex >= 0 ? Number(mockCarrierStore[existingIndex].openAP || 0) : 0,
            invoiceCount: existingIndex >= 0 ? Number(mockCarrierStore[existingIndex].invoiceCount || 0) : 0,
          };

          if (existingIndex >= 0) {
            mockCarrierStore = mockCarrierStore.map((carrier, candidateIndex) => (
              candidateIndex === existingIndex ? nextCarrier : carrier
            ));
            updated += 1;
          } else {
            mockCarrierStore = [nextCarrier, ...mockCarrierStore];
            imported += 1;
          }
        } catch (err) {
          errors.push({ line: index + 1, error: err.message || 'Unable to process row' });
        }
      }

      return {
        imported,
        updated,
        skipped,
        errorCount: errors.length,
        errors,
      };
    } catch (err) {
      return { error: err.message || 'Failed to parse carrier CSV' };
    }
  }

  try {
    return await tryBackendUpload();
  } catch (err) {
    console.error('uploadCarriersCsv error:', err?.message || JSON.stringify(err));
    return { error: err.message };
  }
}

export async function listEmailTemplates(params = {}) {
  const query = new URLSearchParams();
  if (params.audience) query.set('audience', params.audience);
  if (params.q) query.set('q', params.q);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return safeFetch(`/api/email-templates${suffix}`);
}

export async function createEmailTemplate(payload) {
  return safeFetch('/api/email-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function updateEmailTemplate(templateId, payload) {
  if (!templateId) return { error: 'templateId is required' };
  return safeFetch(`/api/email-templates/${encodeURIComponent(templateId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function deleteEmailTemplate(templateId) {
  if (!templateId) return { error: 'templateId is required' };
  return safeFetch(`/api/email-templates/${encodeURIComponent(templateId)}`, {
    method: 'DELETE',
  });
}

export async function sendEmailMessage(payload) {
  return safeFetch('/api/messages/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function getTrackerCredits() {
  return safeFetch('/api/tracker/credits');
}

export async function getTrackerEvents(phone) {
  const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
  return safeFetch(`/api/tracker/events${query}`);
}

export async function getTrackerPositions(phone) {
  const query = phone ? `?phone=${encodeURIComponent(phone)}` : '';
  return safeFetch(`/api/tracker/positions${query}`);
}

export async function sendTrackerMessage(payload) {
  return safeFetch('/api/tracker/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function addTrackerCredits(amount) {
  return safeFetch('/api/tracker/credits/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
}

export async function generateLoadDocument(type, payload) {
  const normalizedType = String(type || '').trim().toLowerCase();
  if (!normalizedType) return { error: 'Document type is required' };

  return safeFetch(`/api/documents/${encodeURIComponent(normalizedType)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
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
    console.error('createInvoice error:', err?.message || JSON.stringify(err));
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
    console.error('login error:', err?.message || JSON.stringify(err));
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
    console.error('connectEdiIntegration error:', err?.message || JSON.stringify(err));
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
    console.error('uploadInvoiceImage error:', err?.message || JSON.stringify(err));
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
    console.error('verifyInvoiceImage error:', err?.message || JSON.stringify(err));
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
    console.error('uploadInvoiceFile error:', err?.message || JSON.stringify(err));
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

export async function getRateFeatureSchema() {
  return safeFetch('/api/rate-logic/feature-schema');
}

export async function getRateGeoByZip3(zip3) {
  const normalized = String(zip3 || '').replace(/\D/g, '').slice(0, 3);
  if (!normalized || normalized.length < 3) {
    return { error: 'zip3 must contain 3 digits' };
  }
  return safeFetch(`/api/rate-logic/geo/zip3/${encodeURIComponent(normalized)}`);
}

export async function predictDeterministicRate(payload) {
  return safeFetch('/api/rate-logic/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function logQuoteOutcome(payload) {
  return safeFetch('/api/rate-logic/quote-outcomes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function listQuoteOutcomes(limit = 100) {
  return safeFetch(`/api/rate-logic/quote-outcomes?limit=${encodeURIComponent(String(limit))}`);
}

export async function getRateLogicMetrics() {
  return safeFetch('/api/rate-logic/metrics');
}

export async function quoteSaiaCarrierRate(payload) {
  return safeFetch('/auction/saia/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function getSaiaHealth() {
  return safeFetch('/health/saia');
}

export async function exportTrainingDatasetJson() {
  return safeFetch('/api/rate-logic/training-dataset/export');
}

export async function register(payload) {
  console.log('Frontend register payload:', payload);
  try {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      throw new Error(errorData?.error || `Register failed ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.error('register error:', err?.message || JSON.stringify(err));
    return { error: err.message };
  }
}

export async function getUsers() {
  try {
    return await fetchJsonWithFallback(
      ['/api/auth/users', '/auth/users'],
      undefined,
      'Get users failed'
    );
  } catch (err) {
    console.error('getUsers error:', err?.message || JSON.stringify(err));
    return { error: err.message };
  }
}

export async function updateUser(userId, payload) {
  try {
    const userPath = encodeURIComponent(userId);
    return await fetchJsonWithFallback(
      [`/api/auth/users/${userPath}`, `/auth/users/${userPath}`],
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
      'Update user failed'
    );
  } catch (err) {
    console.error('updateUser error:', err?.message || JSON.stringify(err));
    return { error: err.message };
  }
}

// Document API client for Uploads page
// These are mock implementations; replace with real API calls as needed.


export async function listDocuments({ q = '' } = {}) {
  try {
    const res = await fetch(`/api/documents?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}


export async function deleteDocument(docId) {
  try {
    const res = await fetch(`/api/documents/${encodeURIComponent(docId)}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete document');
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}


export function downloadDocument(docId) {
  window.open(`/api/documents/${encodeURIComponent(docId)}/download`, '_blank');
}

