import * as saiaAuctionService from './saiaAuction.service.js';

export async function handleQuoteSaiaAuction(req, res, next) {
  try {
    const load = req.body || {};
    const result = await saiaAuctionService.quoteSaiaForAuction(load);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function handleGetSaiaAuctionCircuit(req, res, next) {
  try {
    res.json(saiaAuctionService.getSaiaAuctionCircuitState());
  } catch (err) {
    next(err);
  }
}
