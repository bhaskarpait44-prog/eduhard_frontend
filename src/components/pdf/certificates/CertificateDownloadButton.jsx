import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import TransferCertificatePDF from './TransferCertificatePDF'
import BonafideCertificatePDF from './BonafideCertificatePDF'
import CharacterCertificatePDF from './CharacterCertificatePDF'
import MigrationCertificatePDF from './MigrationCertificatePDF'
import MarksheetCertificatePDF from './MarksheetCertificatePDF'
import SportsCertificatePDF from './SportsCertificatePDF'
import StudyCertificatePDF from './StudyCertificatePDF'
import ExperienceCertificatePDF from './ExperienceCertificatePDF'

const PDF_COMPONENTS = {
  transfer: TransferCertificatePDF,
  bonafide: BonafideCertificatePDF,
  character: CharacterCertificatePDF,
  migration: MigrationCertificatePDF,
  marksheet: MarksheetCertificatePDF,
  sports: SportsCertificatePDF,
  study: StudyCertificatePDF,
  experience: ExperienceCertificatePDF,
}

const CertificateDownloadButton = ({ certType, data, fileName }) => {
  const PdfComponent = PDF_COMPONENTS[certType]
  if (!PdfComponent || !data) return null

  return (
    <PDFDownloadLink
      document={<PdfComponent data={data} />}
      fileName={fileName || `${certType}-certificate.pdf`}
    >
      {({ loading }) => (
        <button 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
          style={{ 
            backgroundColor: loading ? '#94a3b8' : '#0f766e', 
            color: '#fff' 
          }}
        >
          <Download size={14} />
          {loading ? 'Preparing...' : 'Download PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}

export default CertificateDownloadButton
