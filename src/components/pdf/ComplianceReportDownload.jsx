import { PDFDownloadLink } from '@react-pdf/renderer';
import ComplianceReportPDF from './ComplianceReportPDF';
import { Download } from 'lucide-react';

const ComplianceReportDownload = ({ report, school, userName, overallScore, fileName }) => {
  if (!report || !school) return null;

  const defaultFileName = `Compliance_Report_${report.session.name.replace(/\//g, '-')}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <ComplianceReportPDF 
          report={report} 
          school={school} 
          userName={userName} 
          overallScore={overallScore} 
        />
      }
      fileName={fileName || defaultFileName}
      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
    >
      {({ loading }) => (
        <>
          <Download size={16} />
          {loading ? 'Preparing PDF...' : 'Download PDF'}
        </>
      )}
    </PDFDownloadLink>
  );
};

export default ComplianceReportDownload;
