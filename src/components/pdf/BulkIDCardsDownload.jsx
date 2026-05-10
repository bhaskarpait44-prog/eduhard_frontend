import { PDFDownloadLink } from '@react-pdf/renderer';
import BulkStudentIDCardsPDF from './BulkStudentIDCardsPDF';
import { Users } from 'lucide-react';

const BulkIDCardsDownload = ({ data, fileName = 'BulkIDCards.pdf' }) => {
  if (!data || data.length === 0) return null;

  return (
    <PDFDownloadLink
      document={<BulkStudentIDCardsPDF students={data} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      {({ loading }) => (
        <>
          <Users size={14} />
          {loading ? 'Generating...' : 'Download Bulk ID Cards'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default BulkIDCardsDownload;
