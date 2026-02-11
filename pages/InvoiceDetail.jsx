import { useParams } from 'react-router-dom';

function InvoiceDetail() {
  const { id } = useParams();

  return (
    <div>
      <h1>Invoice Detail</h1>
      <p>Invoice ID: {id}</p>
    </div>
  );
}

export default InvoiceDetail;
