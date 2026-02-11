import { Link } from 'react-router-dom';

function CarriersPerformance() {
  return (
    <div>
      <h1>Carriers Performance</h1>
      <p>Carrier performance overview</p>
      <ul>
        <li><Link to="/carriers/carrier1">Carrier 1</Link></li>
        <li><Link to="/carriers/carrier2">Carrier 2</Link></li>
      </ul>
    </div>
  );
}

export default CarriersPerformance;
