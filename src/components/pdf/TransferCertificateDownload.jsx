import { PDFDownloadLink } from '@react-pdf/renderer';
import TransferCertificatePDF from './certificates/TransferCertificatePDF';
import { FileText } from 'lucide-react';

const TransferCertificateDownload = ({ data, fileName = 'TransferCertificate.pdf' }) => {
  if (!data) return null;

  return (
    <PDFDownloadLink
      document={<TransferCertificatePDF data={data} />}
      fileName={fileName}
      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-95"
    >
      {({ loading }) => (
        <>
          <FileText size={14} />
          {loading ? 'Preparing...' : 'Download Transfer Certificate'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default TransferCertificateDownload;
