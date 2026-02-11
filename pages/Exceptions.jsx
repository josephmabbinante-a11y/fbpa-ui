import { Link } from 'react-router-dom';

function Exceptions() {
  return (
    <div>
      <h1>Exceptions</h1>
      <p>Exception tracking page</p>
      <ul>
        <li><Link to="/exceptions/1">Exception 1</Link></li>
        <li><Link to="/exceptions/2">Exception 2</Link></li>
      </ul>
    </div>
  );
}

export default Exceptions;
