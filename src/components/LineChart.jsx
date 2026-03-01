import React from 'react';

const LineChart = ({ data = [], label = '' }) => {
  // Placeholder for line chart visualization
  return (
    <div style={{ textAlign: 'center' }}>
      <div>{label}</div>
      <div style={{ height: 80, background: '#222', borderRadius: 8 }}>
        {/* Chart would render here */}
      </div>
    </div>
  );
};

export default LineChart;
