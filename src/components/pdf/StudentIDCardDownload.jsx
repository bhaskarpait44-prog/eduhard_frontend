import { PDFDownloadLink } from '@react-pdf/renderer';
import StudentIDCardPDF from './StudentIDCardPDF';
import { IdCard } from 'lucide-react';

const StudentIDCardDownload = ({ data, fileName = 'StudentIDCard.pdf' }) => {
  if (!data) return null;

  return (
    <PDFDownloadLink
      document={<StudentIDCardPDF data={data} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      {({ loading }) => (
        <>
          <IdCard size={14} />
          {loading ? 'Preparing...' : 'Download ID Card'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default StudentIDCardDownload;
