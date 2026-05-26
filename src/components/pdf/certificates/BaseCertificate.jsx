import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const accentColor = '#0f766e';

export const commonStyles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.6,
  },
  borderOuter: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: accentColor,
  },
  borderInner: {
    position: 'absolute',
    top: 25,
    left: 25,
    right: 25,
    bottom: 25,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: accentColor,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: accentColor,
    paddingBottom: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 20,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  schoolMeta: {
    fontSize: 9,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textDecoration: 'underline',
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    fontSize: 10,
    fontWeight: 'bold',
  },
  body: {
    marginBottom: 30,
    textAlign: 'justify',
    fontSize: 12,
    lineHeight: 1.8,
  },
  extraDataBox: {
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  extraDataRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  extraDataLabel: {
    width: 120,
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  extraDataValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  signatureBox: {
    width: 180,
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginTop: 40,
    paddingTop: 5,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  computerGenerated: {
    position: 'absolute',
    bottom: 35,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#94a3b8',
  },
  revokedWatermark: {
    position: 'absolute',
    top: '40%',
    left: '10%',
    fontSize: 60,
    color: 'rgba(239, 68, 68, 0.1)',
    transform: 'rotate(-30deg)',
    fontWeight: 'bold',
    zIndex: -1,
    width: '100%',
    textAlign: 'center',
  }
});

export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
};

const BaseCertificate = ({ title, data, children, accentOverride }) => {
  const { school, certificate_no, issued_date, status } = data;
  const currentAccent = accentOverride || accentColor;

  return (
    <Document>
      <Page size="A4" style={commonStyles.page}>
        <View style={[commonStyles.borderOuter, accentOverride ? { borderColor: accentOverride } : {}]} />
        <View style={[commonStyles.borderInner, accentOverride ? { borderColor: accentOverride } : {}]} />

        {status === 'revoked' && (
          <Text style={commonStyles.revokedWatermark}>REVOKED</Text>
        )}

        {/* Header */}
        <View style={[commonStyles.header, accentOverride ? { borderBottomColor: accentOverride } : {}]}>
          {school?.logo_url && <Image src={school.logo_url} style={commonStyles.logo} />}
          <View style={commonStyles.schoolInfo}>
            <Text style={[commonStyles.schoolName, accentOverride ? { color: accentOverride } : {}]}>{school?.name || ''}</Text>
            <Text style={commonStyles.schoolMeta}>{school?.address || 'N/A'}</Text>
            <Text style={commonStyles.schoolMeta}>Phone: {school?.phone || 'N/A'} | Email: {school?.email || 'N/A'}</Text>
          </View>
        </View>

        <Text style={commonStyles.title}>{title}</Text>

        <View style={commonStyles.metaRow}>
          <Text>Cert No: {certificate_no}</Text>
          <Text>Date: {formatDate(issued_date)}</Text>
        </View>

        <View style={commonStyles.body}>
          {children}
        </View>

        {/* Signatures */}
        <View style={commonStyles.footer}>
          <View style={commonStyles.signatureBox}>
            <Text style={commonStyles.signatureLine}>Authorized Signatory</Text>
          </View>
          <View style={commonStyles.signatureBox}>
            <Text style={commonStyles.signatureLine}>{school?.principal_name || 'Principal'}</Text>
          </View>
        </View>

        <Text style={commonStyles.computerGenerated}>This is a computer generated certificate.</Text>
      </Page>
    </Document>
  );
};

export default BaseCertificate;
