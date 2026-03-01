import { useState } from 'react';
import { dispatchLoad, markLoadDelivered, reassignLoad, sendToBidNetwork } from '../../../api/loadsClient';

export default function useLoadActions({ selectedId, refreshList, refreshDetail }) {
  const [actionState, setActionState] = useState({ busy: false, error: '', success: '' });

  const runAction = async (actionFn, successMessage) => {
    if (!selectedId) return;

    setActionState({ busy: true, error: '', success: '' });
    const response = await actionFn();

    if (response?.error) {
      setActionState({ busy: false, error: response.error, success: '' });
      return;
    }

    setActionState({ busy: false, error: '', success: successMessage });
    await Promise.all([refreshList(), refreshDetail(selectedId)]);
  };

  return {
    actionState,
    dispatch: () => runAction(() => dispatchLoad(selectedId, { carrierId: 'CR-18', carrierName: 'Prime Logistics', lockStatus: true }), 'Load dispatched'),
    reassign: () => runAction(() => reassignLoad(selectedId, { carrierId: 'CR-27', carrierName: 'Reassigned Carrier', reason: 'Capacity adjustment' }), 'Carrier reassigned'),
    sendToBidNetwork: () => runAction(() => sendToBidNetwork(selectedId, { network: 'internal' }), 'Sent to bid network'),
    markDelivered: () => runAction(() => markLoadDelivered(selectedId, { deliveredAt: new Date().toISOString(), podReceived: true }), 'Load marked delivered'),
  };
}
