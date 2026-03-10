import { spawn } from 'node:child_process';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDbConnected(baseUrl, attempts = 30) {
  let lastHealth = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) {
        const body = await res.json();
        lastHealth = body;
        if (body.dbStatus === 'connected') {
          return body;
        }
      }
    } catch {
      // Server may still be starting up.
    }
    await delay(1000);
  }
  return lastHealth;
}

async function requestJson(path, options = {}) {
  const res = await fetch(path, options);
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

async function run() {
  const port = String(4200 + Math.floor(Math.random() * 200));
  const baseUrl = `http://localhost:${port}`;
  const server = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  server.stderr.on('data', (chunk) => process.stderr.write(`[server:err] ${chunk}`));

  try {
    const health = await waitForDbConnected(baseUrl);
    if (!health) {
      throw new Error(`Server did not become healthy on ${baseUrl}`);
    }
    if (health.dbStatus !== 'connected') {
      throw new Error(`MongoDB is not connected (dbStatus=${health.dbStatus}). Fix MONGODB_URI/Atlas access and retry.`);
    }

    const unique = Date.now();
    const arInvoiceNumber = `AR-IT-${unique}`;
    const apInvoiceNumber = `AP-IT-${unique}`;
    const customerName = `Acme Logistics ${unique}`;
    const carrierName = `Rapid Carrier ${unique}`;

    const arResp = await requestJson(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'AR',
        invoice: {
          invoiceNumber: arInvoiceNumber,
          amount: 1250.75,
          status: 'Pending',
          dueDate: '2026-03-01',
          paymentTerms: 'Net 30',
        },
        customer: {
          name: customerName,
          email: `billing-${unique}@acme-logistics.test`,
          phone: '555-0101',
          company: customerName,
          industry: 'Freight',
          billingAddress: '100 Main St',
          taxId: '',
        },
      }),
    });

    const apResp = await requestJson(`${baseUrl}/api/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'AP',
        invoice: {
          invoiceNumber: apInvoiceNumber,
          amount: 980.25,
          status: 'Pending',
          dueDate: '2026-03-05',
          paymentTerms: 'Net 15',
        },
        carrier: {
          name: carrierName,
          email: `ap-${unique}@rapid-carrier.test`,
          phone: '555-0202',
          paymentTerms: 'Net 15',
          mcNumber: '',
          taxId: '',
        },
      }),
    });

    const customersResp = await requestJson(`${baseUrl}/api/customers`);
    const carriersResp = await requestJson(`${baseUrl}/api/carriers`);
    const exceptionsResp = await requestJson(`${baseUrl}/api/exceptions`);

    const failures = [];

    if (arResp.status !== 201) failures.push(`Expected AR invoice create 201, got ${arResp.status}`);
    if (apResp.status !== 201) failures.push(`Expected AP invoice create 201, got ${apResp.status}`);

    if (!arResp.body?.customer?.id) failures.push('Expected AR flow to auto-create a customer');
    if (!apResp.body?.carrier?.id) failures.push('Expected AP flow to auto-create a carrier');

    const arWarnings = Array.isArray(arResp.body?.warnings) ? arResp.body.warnings.length : 0;
    const apWarnings = Array.isArray(apResp.body?.warnings) ? apResp.body.warnings.length : 0;
    if (arWarnings !== 1) failures.push(`Expected AR warnings length 1, got ${arWarnings}`);
    if (apWarnings !== 2) failures.push(`Expected AP warnings length 2, got ${apWarnings}`);

    const customers = Array.isArray(customersResp.body) ? customersResp.body : [];
    const carriers = Array.isArray(carriersResp.body?.carriers) ? carriersResp.body.carriers : [];
    const exceptions = Array.isArray(exceptionsResp.body?.exceptions) ? exceptionsResp.body.exceptions : [];

    if (!customers.some((c) => c.name === customerName)) {
      failures.push('Created customer was not found in /api/customers');
    }
    if (!carriers.some((c) => c.name === carrierName)) {
      failures.push('Created carrier was not found in /api/carriers');
    }

    const testExceptionCount = exceptions.filter(
      (e) => e.invoiceNumber === arInvoiceNumber || e.invoiceNumber === apInvoiceNumber
    ).length;
    if (testExceptionCount !== 3) {
      failures.push(`Expected 3 exceptions for test invoices, got ${testExceptionCount}`);
    }

    if (failures.length > 0) {
      console.error('Backend create-flow test FAILED');
      failures.forEach((f) => console.error(`- ${f}`));
      process.exitCode = 1;
      return;
    }

    console.log('Backend create-flow test PASSED');
    console.log(`AR invoice: ${arResp.body?.invoice?.id}`);
    console.log(`AP invoice: ${apResp.body?.invoice?.id}`);
    console.log(`Warnings: AR=${arWarnings}, AP=${apWarnings}`);
    console.log(`Exceptions linked to test invoices: ${testExceptionCount}`);
  } finally {
    server.kill('SIGTERM');
    await delay(250);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
