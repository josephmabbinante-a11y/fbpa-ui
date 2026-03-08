import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useVehicleSocket = (onUpdate) => {
  useEffect(() => {
    const socket = io('http://localhost:4000');
    socket.on('vehicleLocationUpdate', onUpdate);
    return () => {
      socket.disconnect();
    };
  }, [onUpdate]);
};
