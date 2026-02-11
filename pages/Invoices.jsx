import { Link } from 'react-router-dom';

function Invoices() {
  return (
    <div>
      <h1>Invoices</h1>
      <p>Invoice management page</p>
      <ul>
        <li><Link to="/invoices/1">Invoice 1</Link></li>
        <li><Link to="/invoices/2">Invoice 2</Link></li>
      </ul>
    </div>
  );
}

export default Invoices;
