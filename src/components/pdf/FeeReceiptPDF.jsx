import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

const formatCurrency = (amount) => {
  const parsed = parseFloat(amount);
  if (isNaN(parsed)) return '₹0.00';
  return '₹' + parsed.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 30,
    paddingRight: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  copyContainer: {
    position: 'relative',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    height: 365,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  watermark: {
    position: 'absolute',
    top: '35%',
    left: '10%',
    width: '80%',
    opacity: 0.02,
    zIndex: -1,
    transform: 'rotate(-30deg)',
  },
  watermarkText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  copyIndicator: {
    position: 'absolute',
    top: 12,
    right: 15,
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 5,
  },
  logoAndSchool: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    width: 44,
    height: 44,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  schoolAddress: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
    maxHeight: 18,
    overflow: 'hidden',
  },
  schoolContact: {
    flexDirection: 'row',
    marginTop: 2,
  },
  schoolContactText: {
    fontSize: 7.5,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  receiptHeaderRight: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#0f172a',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 5,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 7.5,
    fontWeight: 'bold',
  },
  receiptNoLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  receiptNoValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginVertical: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoCol: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  studentName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#334155',
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  colDescription: {
    flex: 1,
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#64748b',
  },
  colAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#64748b',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  descriptionContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  itemSubtext: {
    fontSize: 7,
    color: '#94a3b8',
    marginTop: 1,
  },
  itemAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 5,
  },
  grandTotalLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 1,
    marginRight: 10,
  },
  grandTotalBox: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  grandTotalValue: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 10,
  },
  termsContainer: {
    flex: 1,
    marginRight: 20,
  },
  termsTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  termsItem: {
    fontSize: 6,
    color: '#94a3b8',
    marginBottom: 1,
    lineHeight: 1.2,
  },
  signatureContainer: {
    alignItems: 'center',
    minWidth: 110,
  },
  signatureLine: {
    width: 80,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    marginBottom: 4,
    height: 15,
  },
  signatureLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  academicYear: {
    fontSize: 6,
    color: '#94a3b8',
    marginTop: 1,
    letterSpacing: 0.5,
  },
  separatorContainer: {
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  dashedLine: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  separatorTextContainer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
  },
  separatorText: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#94a3b8',
    letterSpacing: 2,
  }
});

const ReceiptCopy = ({ copyType, receipt, school, items }) => {
  const schoolNameFirstLetter = school.name ? school.name.charAt(0) + '.' : 'E.';

  return (
    <View style={styles.copyContainer}>
      {/* Watermark */}
      {school.name && (
        <View style={styles.watermark}>
          <Text style={styles.watermarkText}>{school.name.toUpperCase()}</Text>
        </View>
      )}

      {/* Copy Type Indicator */}
      <Text style={styles.copyIndicator}>{copyType.toUpperCase()} COPY</Text>

      <View>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoAndSchool}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>{schoolNameFirstLetter}</Text>
            </View>
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school.name || ''}</Text>
              <Text style={styles.schoolAddress}>{school.address || ''}</Text>
              <View style={styles.schoolContact}>
                <Text style={styles.schoolContactText}>
                  {school.phone || ''} {school.phone && school.email ? ' • ' : ''} {school.email || ''}
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.receiptHeaderRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>FEE RECEIPT</Text>
            </View>
            <Text style={styles.receiptNoLabel}>Receipt No</Text>
            <Text style={styles.receiptNoValue}>#{receipt.receipt_no}</Text>
          </View>
        </View>

        {/* Divider Line */}
        <View style={styles.divider} />

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {/* Student Details */}
          <View style={styles.infoCol}>
            <Text style={styles.sectionTitle}>STUDENT DETAILS</Text>
            <Text style={styles.studentName}>{receipt.student_name}</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Adm No: </Text>
              <Text style={styles.infoValue}>{receipt.admission_no}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Class: </Text>
              <Text style={styles.infoValue}>
                {receipt.class_name} {receipt.section_name ? ` • Sec ${receipt.section_name}` : ''}
              </Text>
            </View>
          </View>

          {/* Payment Info */}
          <View style={[styles.infoCol, { alignItems: 'flex-end', textAlign: 'right' }]}>
            <Text style={styles.sectionTitle}>PAYMENT INFO</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date: </Text>
              <Text style={styles.infoValue}>
                {new Date(receipt.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Mode: </Text>
              <Text style={[styles.infoValue, { textTransform: 'capitalize' }]}>{receipt.payment_mode}</Text>
            </View>
            {receipt.transaction_ref && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ref: </Text>
                <Text style={styles.infoValue}>{receipt.transaction_ref}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>DESCRIPTION</Text>
            <Text style={styles.colAmount}>AMOUNT</Text>
          </View>
          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.descriptionContainer}>
                <Text style={styles.itemName}>{item.head_name}</Text>
                <Text style={styles.itemSubtext}>Payment received towards student fee account</Text>
              </View>
              <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
            </View>
          ))}
          {receipt.late_fee_amount > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.descriptionContainer}>
                <Text style={styles.itemName}>Late Fee</Text>
              </View>
              <Text style={styles.itemAmount}>{formatCurrency(receipt.late_fee_amount)}</Text>
            </View>
          )}
          {receipt.concession_amount > 0 && (
            <View style={styles.tableRow}>
              <View style={styles.descriptionContainer}>
                <Text style={styles.itemName}>Concession / Discount</Text>
              </View>
              <Text style={styles.itemAmount}>-{formatCurrency(receipt.concession_amount)}</Text>
            </View>
          )}
        </View>

        {/* Grand Total Area */}
        <View style={styles.grandTotalContainer}>
          <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalValue}>{formatCurrency(receipt.amount)}</Text>
          </View>
        </View>
      </View>

      {/* Footer Area */}
      <View style={styles.footer}>
        <View style={styles.termsContainer}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsItem}>• Fee once paid is non-refundable under any circumstances.</Text>
          <Text style={styles.termsItem}>• This is a computer-generated receipt and requires no physical signature.</Text>
          <Text style={styles.termsItem}>• Please keep this copy for your future reference and records.</Text>
        </View>
        <View style={styles.signatureContainer}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Authorized Signatory</Text>
          <Text style={styles.academicYear}>Academic Year 2026-27</Text>
        </View>
      </View>
    </View>
  );
};

const FeeReceiptPDF = ({ data }) => {
  if (!data) return null;
  const { school = {}, receipt = {} } = data;

  const getFeeMonthLabel = (dateStr) => {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length < 2) return '';
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = months[monthIndex];
    return monthName ? `${monthName} ${year}` : '';
  };

  const formattedFeeName = `${receipt.fee_name || 'Academic Fee Payment'}${receipt.due_date ? ` (${getFeeMonthLabel(receipt.due_date)})` : ''}`;

  const items = (receipt.items && receipt.items.length > 0)
    ? receipt.items.map(item => ({
        ...item,
        head_name: `${item.head_name || 'Fee Item'}${receipt.due_date ? ` (${getFeeMonthLabel(receipt.due_date)})` : ''}`
      }))
    : [{ head_name: formattedFeeName, amount: receipt.amount }];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Original Copy */}
        <ReceiptCopy copyType="Original" receipt={receipt} school={school} items={items} />

        {/* Separator (Dashed line) */}
        <View style={styles.separatorContainer}>
          <View style={styles.dashedLine} />
          <View style={styles.separatorTextContainer}>
            <Text style={styles.separatorText}>CUT ALONG THIS LINE</Text>
          </View>
        </View>

        {/* Office Copy */}
        <ReceiptCopy copyType="Office" receipt={receipt} school={school} items={items} />
      </Page>
    </Document>
  );
};

export default FeeReceiptPDF;
