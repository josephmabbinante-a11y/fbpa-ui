import React from 'react';

const Gauge = ({ value = 0, label = '', min = 0, max = 100 }) => {
  // Placeholder for gauge visualization
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 32, fontWeight: 'bold' }}>{value}</div>
      <div>{label}</div>
    </div>
  );
};

export default Gauge;
