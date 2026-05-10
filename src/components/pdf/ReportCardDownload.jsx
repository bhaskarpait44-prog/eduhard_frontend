import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportCardPDF from './ReportCardPDF';
import { Download } from 'lucide-react';

const ReportCardDownload = ({ data, fileName = 'ReportCard.pdf' }) => {
  if (!data) return null;

  return (
    <PDFDownloadLink
      document={<ReportCardPDF data={data} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      {({ loading }) => (
        <>
          <Download size={14} />
          {loading ? 'Preparing...' : 'Download Report Card'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default ReportCardDownload;
