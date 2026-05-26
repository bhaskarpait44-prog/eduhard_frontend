import { formatCurrency, formatDate } from '@/utils/helpers'
import { Printer, Download, Mail, Share2 } from 'lucide-react'

/**
 * Professional Fee Receipt Template
 * Optimized for screen viewing and A4/Thermal Printing
 */
const ReceiptPrint = ({ receipt, schoolProfile }) => {
  if (!receipt) return null

  const school = schoolProfile || {}

  const handlePrint = () => {
    window.print()
  }

  // Common styling for both copies
  const ReceiptContent = ({ copyType }) => (
    <div className="bg-white text-slate-900 p-8 border border-slate-200 rounded-lg shadow-sm print:shadow-none print:border-none print:p-0 mb-8 last:mb-0 relative overflow-hidden">
      {/* Watermark */}
      {school.name && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 opacity-[0.03] pointer-events-none select-none">
          <h1 className="text-[120px] font-black uppercase whitespace-nowrap">{school.name}</h1>
        </div>
      )}

      {/* Header Copy Indicator */}
      <div className="absolute top-4 right-6 text-[10px] font-bold uppercase tracking-widest text-slate-400 print:text-slate-500">
        {copyType} Copy
      </div>

      {/* Brand Header */}
      <div className="flex justify-between items-start border-b-2 border-brand/10 pb-6 mb-6">
        <div className="flex gap-4 items-center">
          <div className="w-16 h-16 bg-brand/5 rounded-2xl flex items-center justify-center border border-brand/10">
            <span className="text-2xl font-black text-brand tracking-tighter">
              {school.name ? school.name.charAt(0) + '.' : 'E.'}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{school.name || ''}</h1>
            <p className="text-[10px] font-medium leading-relaxed max-w-[240px] text-slate-500 italic mt-0.5">
              {school.address || ''}
            </p>
            <div className="flex gap-3 mt-1.5 text-[9px] font-semibold text-slate-400">
              <span>{school.phone || ''}</span>
              {school.phone && school.email && <span className="opacity-30">•</span>}
              <span>{school.email || ''}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-md mb-2">
            FEE RECEIPT
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt No</p>
          <p className="text-sm font-black text-slate-900">#{receipt.receipt_no || `RCPT-${receipt.id}`}</p>
        </div>
      </div>

      {/* Information Grid */}
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Student Details</h3>
          <div className="space-y-1">
            <p className="text-sm font-bold text-slate-900">{receipt.student_name}</p>
            <p className="text-[11px] font-medium text-slate-500">
              Adm No: <span className="text-slate-700 font-bold">{receipt.admission_no}</span>
            </p>
            <p className="text-[11px] font-medium text-slate-500">
              Class: <span className="text-slate-700 font-bold">{receipt.class_name} {receipt.section_name && `• Sec ${receipt.section_name}`}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Info</h3>
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-slate-500">
              Date: <span className="text-slate-700 font-bold">{formatDate(receipt.payment_date, 'long')}</span>
            </p>
            <p className="text-[11px] font-medium text-slate-500 capitalize">
              Mode: <span className="text-slate-700 font-bold">{receipt.payment_mode}</span>
            </p>
            {receipt.transaction_ref && (
              <p className="text-[11px] font-medium text-slate-500">
                Ref: <span className="text-slate-700 font-bold font-mono">{receipt.transaction_ref}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-8 border-collapse">
        <thead>
          <tr className="bg-slate-50 border-y border-slate-200">
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</th>
            <th className="text-right py-2.5 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100">
            <td className="py-4 px-3">
              <p className="text-[11px] font-bold text-slate-900">{receipt.fee_name || 'Academic Fee Payment'}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">Payment received towards student fee account</p>
            </td>
            <td className="py-4 px-3 text-right">
              <span className="text-[11px] font-black text-slate-900">{formatCurrency(receipt.amount)}</span>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td className="py-4 px-3 text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Grand Total</span>
            </td>
            <td className="py-4 px-3 text-right bg-slate-900 rounded-b-xl">
              <span className="text-lg font-black text-white">{formatCurrency(receipt.amount)}</span>
            </td>
          </tr>
        </tfoot>
      </table>

      {/* Bottom Footer */}
      <div className="flex justify-between items-end mt-12 pt-8 border-t border-slate-100">
        <div className="max-w-[280px]">
          <h4 className="text-[10px] font-bold text-slate-900 uppercase mb-1.5 tracking-tight">Terms & Conditions</h4>
          <ul className="text-[8px] text-slate-400 space-y-0.5 leading-relaxed list-disc pl-3">
            <li>Fee once paid is non-refundable under any circumstances.</li>
            <li>This is a computer-generated receipt and requires no physical signature.</li>
            <li>Please keep this copy for your future reference and records.</li>
          </ul>
        </div>
        <div className="flex flex-col items-center min-w-[140px]">
          <div className="w-24 h-12 border-b border-slate-300 mb-2 relative">
             {/* Simple visual for signature */}
             <div className="absolute bottom-1 left-2 w-20 h-8 opacity-10">
               <svg viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M10 30C30 10 70 50 90 20" stroke="black" strokeWidth="2" strokeLinecap="round"/>
               </svg>
             </div>
          </div>
          <p className="text-[9px] font-bold text-slate-900 uppercase">Authorized Signatory</p>
          <p className="text-[7px] text-slate-400 uppercase tracking-widest mt-0.5">Academic Year 2023-24</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="receipt-print-page max-w-4xl mx-auto py-6 px-4">
      {/* Action Buttons (Visible only on screen) */}
      <div className="flex justify-end gap-3 mb-8 print:hidden">
        <button
          onClick={() => {}} // Placeholder for download
          className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
        >
          <Download size={14} />
          Download PDF
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <Printer size={14} />
          Print Receipt
        </button>
      </div>

      {/* Printable Area */}
      <div id="printable-receipt-area" className="print:m-0 print:p-0">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page { size: A4; margin: 10mm; }
            body { background: white !important; }
            .receipt-print-page { padding: 0 !important; max-width: none !important; }
            .copy-separator { border-top: 1px dashed #cbd5e1 !important; margin: 40px 0 !important; page-break-before: always; }
          }
        `}} />
        
        {/* Original Copy */}
        <ReceiptContent copyType="Original" />

        {/* Separator for print (Dashed line) */}
        <div className="copy-separator border-t-2 border-dashed border-slate-200 my-10 relative print:my-0 print:border-none">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] print:hidden">
            Cut Along This Line
          </div>
        </div>

        {/* Office Copy */}
        <ReceiptContent copyType="Office" />
      </div>
    </div>
  )
}

export default ReceiptPrint
