import { PDFDownloadLink } from '@react-pdf/renderer';
import FeeReceiptPDF from './FeeReceiptPDF';
import { Download } from 'lucide-react';

const FeeReceiptDownload = ({ data, fileName = 'FeeReceipt.pdf' }) => {
  if (!data) return null;

  return (
    <PDFDownloadLink
      document={<FeeReceiptPDF data={data} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      {({ loading }) => (
        <>
          <Download size={14} />
          {loading ? 'Preparing...' : 'Download Receipt'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default FeeReceiptDownload;
