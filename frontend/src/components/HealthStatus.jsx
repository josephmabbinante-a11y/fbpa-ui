import React from 'react';
import api from '../services/api';

const HealthStatus = () => {
  const [status, setStatus] = React.useState('');

  React.useEffect(() => {
    api.get('/health')
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div>
      <h2>API Health Status: {status}</h2>
    </div>
  );
};

export default HealthStatus;
