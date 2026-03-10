import express from 'express';

const router = express.Router();

const emailTemplates = [
  {
    id: 'et-1',
    audience: 'customer',
    name: 'Pickup Confirmation',
    subject: 'Load {{loadId}} pickup confirmed',
    body: 'Hello {{customerName}},\n\nYour load {{loadId}} has been confirmed for pickup at {{origin}} on {{pickupAt}}.\n\nThanks,\nOperations',
    tags: ['pickup', 'confirmation'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'et-2',
    audience: 'carrier',
    name: 'Dispatch Instructions',
    subject: 'Dispatch details for load {{loadId}}',
    body: 'Hi {{carrierName}},\n\nPlease review dispatch details for load {{loadId}}:\nOrigin: {{origin}}\nDestination: {{destination}}\nPickup: {{pickupAt}}\nDelivery: {{deliveryAt}}\n\nReply with ETA updates.',
    tags: ['dispatch', 'instructions'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const validAudiences = new Set(['customer', 'carrier']);

function normalizeTemplate(payload = {}) {
  const audience = String(payload.audience || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  const subject = String(payload.subject || '').trim();
  const body = String(payload.body || '').trim();
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : String(payload.tags || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

  return { audience, name, subject, body, tags };
}

router.get('/', (req, res) => {
  const audience = String(req.query.audience || '').trim().toLowerCase();
  const q = String(req.query.q || '').trim().toLowerCase();

  let items = [...emailTemplates];

  if (audience && validAudiences.has(audience)) {
    items = items.filter((template) => template.audience === audience);
  }

  if (q) {
    items = items.filter((template) => [template.name, template.subject, template.body, ...(template.tags || [])]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q)));
  }

  items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

  return res.json({ items });
});

router.post('/', (req, res) => {
  const normalized = normalizeTemplate(req.body || {});

  if (!validAudiences.has(normalized.audience)) {
    return res.status(400).json({ error: 'audience must be customer or carrier' });
  }
  if (!normalized.name) return res.status(400).json({ error: 'name is required' });
  if (!normalized.subject) return res.status(400).json({ error: 'subject is required' });
  if (!normalized.body) return res.status(400).json({ error: 'body is required' });

  const now = new Date().toISOString();
  const template = {
    id: `et-${Date.now()}`,
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };

  emailTemplates.unshift(template);
  return res.status(201).json({ template });
});

router.patch('/:templateId', (req, res) => {
  const idx = emailTemplates.findIndex((row) => row.id === req.params.templateId);
  if (idx < 0) return res.status(404).json({ error: 'Template not found' });

  const normalized = normalizeTemplate({
    ...emailTemplates[idx],
    ...(req.body || {}),
  });

  if (!validAudiences.has(normalized.audience)) {
    return res.status(400).json({ error: 'audience must be customer or carrier' });
  }
  if (!normalized.name) return res.status(400).json({ error: 'name is required' });
  if (!normalized.subject) return res.status(400).json({ error: 'subject is required' });
  if (!normalized.body) return res.status(400).json({ error: 'body is required' });

  emailTemplates[idx] = {
    ...emailTemplates[idx],
    ...normalized,
    updatedAt: new Date().toISOString(),
  };

  return res.json({ template: emailTemplates[idx] });
});

router.delete('/:templateId', (req, res) => {
  const idx = emailTemplates.findIndex((row) => row.id === req.params.templateId);
  if (idx < 0) return res.status(404).json({ error: 'Template not found' });

  const [removed] = emailTemplates.splice(idx, 1);
  return res.json({ removed });
});

export default router;
