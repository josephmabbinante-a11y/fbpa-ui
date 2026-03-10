import { spawn } from 'node:child_process';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function waitForServer(baseUrl, attempts = 25) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(`${baseUrl}/api/health`);
      if (res.ok) return true;
    } catch {
      // server may still be booting
    }
    await delay(500);
  }
  return false;
}

function nextIso(hoursFromNow) {
  return new Date(Date.now() + (hoursFromNow * 60 * 60 * 1000)).toISOString();
}

async function createLoad(baseUrl, idx) {
  const payload = {
    customerName: `Transit Test Customer ${idx}`,
    equipment: idx % 2 === 0 ? 'van' : 'reefer',
    miles: 650 + (idx * 125),
    revenue: 3200 + (idx * 450),
    carrierCost: 2400 + (idx * 320),
    origin: { city: idx % 2 === 0 ? 'Dallas' : 'Phoenix', state: idx % 2 === 0 ? 'TX' : 'AZ' },
    destination: { city: idx % 2 === 0 ? 'Atlanta' : 'Salt Lake City', state: idx % 2 === 0 ? 'GA' : 'UT' },
    pickupAt: nextIso(2 + idx),
    deliveryAt: nextIso(30 + idx),
  };

  return requestJson(`${baseUrl}/api/loads/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function dispatchLoad(baseUrl, loadId, idx) {
  return requestJson(`${baseUrl}/api/loads/${encodeURIComponent(loadId)}/dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      carrierId: `CR-T${100 + idx}`,
      carrierName: `Transit Carrier ${idx}`,
    }),
  });
}

async function markDelivered(baseUrl, loadId) {
  return requestJson(`${baseUrl}/api/loads/${encodeURIComponent(loadId)}/mark-delivered`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deliveredAt: new Date().toISOString() }),
  });
}

async function getLoad(baseUrl, loadId) {
  return requestJson(`${baseUrl}/api/loads/${encodeURIComponent(loadId)}`);
}

async function run() {
  const desiredCount = Math.max(1, Number.parseInt(process.argv[2] || '3', 10) || 3);
  const preferUrl = process.env.BASE_URL || 'http://localhost:4000';

  let baseUrl = preferUrl;
  let spawnedServer = null;

  let serverReady = await waitForServer(baseUrl, 5);

  if (!serverReady) {
    const randomPort = String(4200 + Math.floor(Math.random() * 300));
    baseUrl = `http://localhost:${randomPort}`;
    spawnedServer = spawn('node', ['server/index.js'], {
      env: { ...process.env, PORT: randomPort },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    spawnedServer.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
    spawnedServer.stderr.on('data', (chunk) => process.stderr.write(`[server:err] ${chunk}`));

    serverReady = await waitForServer(baseUrl, 30);
  }

  if (!serverReady) {
    throw new Error('Could not reach backend server for load transit flow');
  }

  const results = [];

  try {
    for (let i = 1; i <= desiredCount; i += 1) {
      const created = await createLoad(baseUrl, i);
      const loadId = created.body?.load?.id;
      if (created.status !== 201 || !loadId) {
        results.push({ step: `create-${i}`, ok: false, details: created.body });
        continue;
      }

      const dispatched = await dispatchLoad(baseUrl, loadId, i);
      if (dispatched.status >= 400) {
        results.push({ step: `dispatch-${loadId}`, ok: false, details: dispatched.body });
        continue;
      }

      const delivered = await markDelivered(baseUrl, loadId);
      if (delivered.status >= 400) {
        results.push({ step: `deliver-${loadId}`, ok: false, details: delivered.body });
        continue;
      }

      const finalLoad = await getLoad(baseUrl, loadId);
      const finalStatus = finalLoad.body?.load?.status;
      const ok = finalStatus === 'delivered';
      results.push({
        step: `flow-${loadId}`,
        ok,
        status: finalStatus,
        customer: finalLoad.body?.load?.customer?.name,
      });
    }

    const passed = results.filter((item) => item.ok).length;
    const failed = results.length - passed;

    console.log(`\nLoad transit run complete on ${baseUrl}`);
    console.log(`Requested: ${desiredCount} | Completed: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    results.forEach((item) => {
      if (item.ok) {
        console.log(`✔ ${item.step} -> ${item.status}`);
      } else {
        console.log(`✖ ${item.step}`);
      }
    });

    if (failed > 0) process.exitCode = 1;
  } finally {
    if (spawnedServer) {
      spawnedServer.kill('SIGTERM');
      await delay(250);
      if (!spawnedServer.killed) spawnedServer.kill('SIGKILL');
    }
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
