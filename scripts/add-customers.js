/* global process */
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

async function run() {
  const desiredCount = Math.max(1, Number.parseInt(process.argv[2] || '3', 10) || 3);
  const preferUrl = String(process.env.BASE_URL || '').trim();

  let baseUrl = preferUrl || '';
  let spawnedServer = null;

  let serverReady = false;

  if (baseUrl) {
    serverReady = await waitForServer(baseUrl, 10);
  } else {
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
    throw new Error('Could not reach backend server for customer create flow');
  }

  const results = [];

  try {
    for (let i = 1; i <= desiredCount; i += 1) {
      const unique = `${Date.now()}-${i}`;
      const payload = {
        name: `Automation Customer ${unique}`,
        contact: `Ops Team ${i}`,
        email: `auto-customer-${unique}@example.test`,
        phone: `555-11${String(i).padStart(2, '0')}`,
        address: `${100 + i} Automation Way, Dallas, TX`,
      };

      const created = await requestJson(`${baseUrl}/api/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (created.status === 201 && created.body?.id) {
        results.push({ ok: true, id: created.body.id, name: created.body.name });
      } else {
        results.push({ ok: false, error: created.body?.error || `HTTP ${created.status}` });
      }
    }

    const passed = results.filter((item) => item.ok).length;
    const failed = results.length - passed;

    console.log(`\nCustomer add run complete on ${baseUrl}`);
    console.log(`Requested: ${desiredCount} | Completed: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    results.forEach((item) => {
      if (item.ok) {
        console.log(`✔ customer ${item.id} (${item.name})`);
      } else {
        console.log(`✖ create customer failed: ${item.error}`);
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
