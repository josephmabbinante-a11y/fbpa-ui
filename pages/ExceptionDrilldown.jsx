import { useParams } from 'react-router-dom';

function ExceptionDrilldown() {
  const { id } = useParams();

  return (
    <div>
      <h1>Exception Drilldown</h1>
      <p>Exception ID: {id}</p>
    </div>
  );
}

export default ExceptionDrilldown;
