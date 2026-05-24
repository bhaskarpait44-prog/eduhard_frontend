import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, AlertCircle } from 'lucide-react'
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

const CertificateDownloadButton = ({ certType, data, fileName, disabled }) => {
  const PdfComponent = PDF_COMPONENTS[certType]
  if (!PdfComponent || !data) return null

  // Bug 4 Fix: Disable and style differently if revoked
  if (disabled) {
    return (
      <button 
        disabled
        title="Certificate Revoked"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300"
      >
        <AlertCircle size={14} />
        Revoked
      </button>
    )
  }

  return (
    <PDFDownloadLink
      document={<PdfComponent data={data} />}
      fileName={fileName || `${certType}-certificate.pdf`}
    >
      {({ loading }) => (
        <button 
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:transform active:scale-95"
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
