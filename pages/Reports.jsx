import { Link } from 'react-router-dom';

function Reports() {
  return (
    <div>
      <h1>Reports</h1>
      <p>Reports listing page</p>
      <ul>
        <li><Link to="/reports/1">Report 1</Link></li>
        <li><Link to="/reports/2">Report 2</Link></li>
      </ul>
    </div>
  );
}

export default Reports;
