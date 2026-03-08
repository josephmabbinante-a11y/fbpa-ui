import * as svc from './carrier.service.js';

export async function handleCreateCarrier(req, res, next) {
  try { res.status(201).json(await svc.createCarrier(req.tenantId, req.body || {})); } catch (err) { next(err); }
}

export async function handleApproveCarrier(req, res, next) {
  try { res.json(await svc.approveCarrier(req.params.id, req.tenantId)); } catch (err) { next(err); }
}

export async function handleListCarriers(req, res, next) {
  try { res.json(await svc.listCarriers(req.tenantId)); } catch (err) { next(err); }
}
