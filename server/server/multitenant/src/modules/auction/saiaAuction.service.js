import { requestSaiaRateQuote, getSaiaCircuitState } from '../../../services/carriers/saia/saiaClient.js';
import { mapInternalLoadToSaiaPayload } from '../../../services/carriers/saia/saiaRateService.js';

export async function quoteSaiaForAuction(load, options = {}) {
  const saiaPayload = mapInternalLoadToSaiaPayload(load);
  return requestSaiaRateQuote(saiaPayload, options);
}

export function getSaiaAuctionCircuitState() {
  return getSaiaCircuitState();
}
