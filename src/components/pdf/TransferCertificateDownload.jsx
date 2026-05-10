import { PDFDownloadLink } from '@react-pdf/renderer';
import TransferCertificatePDF from './TransferCertificatePDF';
import { ScrollText } from 'lucide-react';

const TransferCertificateDownload = ({ data, fileName = 'TransferCertificate.pdf' }) => {
  if (!data) return null;

  return (
    <PDFDownloadLink
      document={<TransferCertificatePDF data={data} />}
      fileName={fileName}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
    >
      {({ loading }) => (
        <>
          <ScrollText size={14} />
          {loading ? 'Preparing...' : 'Download TC'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default TransferCertificateDownload;
