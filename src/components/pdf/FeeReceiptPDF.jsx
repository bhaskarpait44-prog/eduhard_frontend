import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const accentColor = '#0f766e';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 4,
  },
  schoolMeta: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 11,
    color: '#1e293b',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 8,
  },
  tableCol: {
    flex: 1,
  },
  tableColRight: {
    textAlign: 'right',
    width: 80,
  },
  summarySection: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBox: {
    width: 200,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: accentColor,
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: accentColor,
  },
  footer: {
    marginTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginTop: 40,
    textAlign: 'center',
    paddingTop: 5,
    fontSize: 9,
    color: '#64748b',
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    fontSize: 60,
    color: '#f1f5f9',
    transform: 'rotate(-45deg)',
    zIndex: -1,
  }
});

const FeeReceiptPDF = ({ data }) => {
  const { school, receipt } = data;
  const items = receipt.items || [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.watermark}>
          <Text>PAID</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          {school.logo_url && <Image src={school.logo_url} style={styles.logo} />}
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{school.name}</Text>
            <Text style={styles.schoolMeta}>{school.address}</Text>
            <Text style={styles.schoolMeta}>Phone: {school.phone} | Email: {school.email}</Text>
          </View>
        </View>

        <Text style={styles.receiptTitle}>Fee Receipt</Text>

        {/* Student & Receipt Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Receipt Number</Text>
              <Text style={styles.value}>{receipt.receipt_no}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{new Date(receipt.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
            </View>
          </View>
          <View style={{ ...styles.row, marginTop: 15 }}>
            <View style={styles.column}>
              <Text style={styles.label}>Student Name</Text>
              <Text style={styles.value}>{receipt.student_name}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Admission No.</Text>
              <Text style={styles.value}>{receipt.admission_no}</Text>
            </View>
          </View>
          <View style={{ ...styles.row, marginTop: 5 }}>
            <View style={styles.column}>
              <Text style={styles.label}>Class & Section</Text>
              <Text style={styles.value}>{receipt.class_name} {receipt.section_name ? `- ${receipt.section_name}` : ''}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Roll No.</Text>
              <Text style={styles.value}>{receipt.roll_no || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Fee Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableCol, fontWeight: 'bold' }}>Description</Text>
            <Text style={{ ...styles.tableColRight, fontWeight: 'bold' }}>Amount (INR)</Text>
          </View>
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol}>{item.head_name}</Text>
              <Text style={styles.tableColRight}>{parseFloat(item.amount).toFixed(2)}</Text>
            </View>
          ))}
          {receipt.late_fee_amount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Late Fee</Text>
              <Text style={styles.tableColRight}>{parseFloat(receipt.late_fee_amount).toFixed(2)}</Text>
            </View>
          )}
          {receipt.concession_amount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableCol}>Concession / Discount</Text>
              <Text style={styles.tableColRight}>-{parseFloat(receipt.concession_amount).toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text>Total Payable:</Text>
              <Text>INR {(parseFloat(receipt.amount_due) + parseFloat(receipt.late_fee_amount) - parseFloat(receipt.concession_amount)).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Amount Paid:</Text>
              <Text>INR {parseFloat(receipt.amount).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Due:</Text>
              <Text style={styles.totalValue}>INR {parseFloat(receipt.balance_after).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Details */}
        <View style={{ ...styles.section, marginTop: 20 }}>
          <Text style={styles.label}>Payment Details</Text>
          <Text style={styles.value}>
            Mode: {receipt.payment_mode.toUpperCase()} 
            {receipt.transaction_ref ? ` | Ref: ${receipt.transaction_ref}` : ''}
          </Text>
        </View>

        {/* Footer / Signatures */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.signatureLine}>Parent's Signature</Text>
          </View>
          <View>
            <Text style={styles.signatureLine}>Accountant / Cashier</Text>
            <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 2 }}>{receipt.received_by_name || 'Authorized Signatory'}</Text>
          </View>
          <View>
            <Text style={styles.signatureLine}>Principal</Text>
            <Text style={{ fontSize: 8, textAlign: 'center', marginTop: 2 }}>{school.principal_name}</Text>
          </View>
        </View>

        <Text style={{ position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#94a3b8' }}>
          Computer generated receipt. No signature required for validation.
        </Text>
      </Page>
    </Document>
  );
};

export default FeeReceiptPDF;
