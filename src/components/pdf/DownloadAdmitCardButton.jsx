import React from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download } from 'lucide-react'
import Button from '@/components/ui/Button'
import AdmitCardPDF from './AdmitCardPDF'

const DownloadAdmitCardButton = ({
  selectedStudents,
  exam,
  subjects,
  schoolName,
  balances,
  pdfFileName,
  markAsPrinted
}) => {
  return (
    <PDFDownloadLink
      document={
        <AdmitCardPDF 
          students={selectedStudents} 
          exam={exam}
          subjects={subjects}
          schoolName={schoolName}
          balances={balances}
        />
      }
      fileName={pdfFileName}
    >
      {({ loading }) => (
        <Button 
          variant="primary" 
          icon={Download} 
          loading={loading}
          onClick={() => setTimeout(markAsPrinted, 1000)}
          style={!loading ? { backgroundColor: '#16a34a' } : undefined}
        >
          {loading ? 'Generating...' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
}

export default DownloadAdmitCardButton
