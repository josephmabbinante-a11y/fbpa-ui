import * as bidService from './bid.service.js';
import { AppError } from '../../utils/errorHandler.js';

export async function handleListBids(req, res, next) {
  try { res.json(await bidService.listBids(req.params.loadId, req.tenantId)); } catch (err) { next(err); }
}

export async function handleSubmitBid(req, res, next) {
  try {
    const { carrierId, bidAmount, message } = req.body || {};
    if (!carrierId || !bidAmount) throw new AppError('carrierId and bidAmount required', 400, 'VALIDATION_ERROR');
    res.status(201).json(await bidService.submitBid(req.params.loadId, req.tenantId, carrierId, bidAmount, message));
  } catch (err) { next(err); }
}

export async function handleAcceptBid(req, res, next) {
  try { res.json(await bidService.acceptBid(req.params.id, req.tenantId)); } catch (err) { next(err); }
}

export async function handleRejectBid(req, res, next) {
  try { res.json(await bidService.rejectBid(req.params.id, req.tenantId)); } catch (err) { next(err); }
}
