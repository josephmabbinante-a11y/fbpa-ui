import { useParams } from 'react-router-dom';

function CarrierScorecard() {
  const { carrier } = useParams();

  return (
    <div>
      <h1>Carrier Scorecard</h1>
      <p>Carrier: {carrier}</p>
    </div>
  );
}

export default CarrierScorecard;
