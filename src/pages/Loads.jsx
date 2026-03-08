import React from 'react';
import LoadCommandPage from './Loads/LoadCommandPage';

// Only render LoadCommandPage for /loads route
export default function Loads(props) {
  // You can add route checks or props here if needed
  return <LoadCommandPage {...props} />;
}
