import React from 'react';
import LoadCommandPage from './Loads/LoadCommandPage';
import ErrorBoundary from '../components/ErrorBoundary';

// Only render LoadCommandPage for /loads route
export default function Loads(props) {
  return (
    <ErrorBoundary>
      <LoadCommandPage {...props} />
    </ErrorBoundary>
  );
}
