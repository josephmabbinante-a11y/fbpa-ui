import * as loadService from './load.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleListLoads(req, res, next) {
  try { res.json(await loadService.listLoads(req.tenantId)); } catch (err) { next(err); }
}

export async function handleCreateLoad(req, res, next) {
  try { res.status(201).json(await loadService.createLoad(req.tenantId, req.body || {})); } catch (err) { next(err); }
}

export async function handleUpdateLoad(req, res, next) {
  try { res.json(await loadService.updateLoad(req.params.id, req.tenantId, req.body || {})); } catch (err) { next(err); }
}

export async function handlePostLoad(req, res, next) {
  try { res.json(await loadService.postLoad(req.params.id, req.tenantId)); } catch (err) { next(err); }
}

export async function handleAwardLoad(req, res, next) {
  try {
    const { carrierId, bidId } = req.body || {};
    if (!carrierId || !bidId) throw new AppError('carrierId and bidId required', 400, 'VALIDATION_ERROR');
    res.json(await loadService.awardLoad(req.params.id, req.tenantId, carrierId, bidId));
  } catch (err) { next(err); }
}
