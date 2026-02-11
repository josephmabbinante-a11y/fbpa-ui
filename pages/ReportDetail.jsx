import { useParams } from 'react-router-dom';

function ReportDetail() {
  const { reportId } = useParams();

  return (
    <div>
      <h1>Report Detail</h1>
      <p>Report ID: {reportId}</p>
    </div>
  );
}

export default ReportDetail;
