import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const accentColor = '#0f766e';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    lineHeight: 1.6,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: accentColor,
    paddingBottom: 20,
    marginBottom: 30,
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
  tcTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    textDecoration: 'underline',
    textTransform: 'uppercase',
    color: '#0f172a',
  },
  body: {
    marginBottom: 40,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
  },
  label: {
    width: 180,
    fontWeight: 'bold',
    color: '#64748b',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  value: {
    flex: 1,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statement: {
    marginTop: 20,
    textAlign: 'justify',
  },
  footer: {
    marginTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureBox: {
    width: 150,
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
  issueDate: {
    marginTop: 40,
    fontSize: 10,
    color: '#64748b',
  },
  referenceNo: {
    position: 'absolute',
    top: 100,
    right: 50,
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94a3b8',
  }
});

const TransferCertificatePDF = ({ data }) => {
  const { 
    first_name, last_name, admission_no, date_of_birth, gender, father_name, mother_name,
    class_name, section_name, roll_number, joined_date, left_date, leaving_type,
    school_name, logo_url, school_address, school_phone, principal_name, session_name
  } = data;

  const fullName = `${first_name} ${last_name}`;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.referenceNo}>Ref No: TC/{admission_no}/{new Date().getFullYear()}</Text>

        {/* Header */}
        <View style={styles.header}>
          {logo_url && <Image src={logo_url} style={styles.logo} />}
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{school_name}</Text>
            <Text style={styles.schoolMeta}>{school_address}</Text>
            <Text style={styles.schoolMeta}>Phone: {school_phone}</Text>
          </View>
        </View>

        <Text style={styles.tcTitle}>Transfer Certificate</Text>

        <View style={styles.body}>
          <View style={styles.row}>
            <Text style={styles.label}>1. Name of the Student</Text>
            <Text style={styles.value}>: {fullName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>2. Admission Number</Text>
            <Text style={styles.value}>: {admission_no}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>3. Father's/Guardian's Name</Text>
            <Text style={styles.value}>: {father_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>4. Mother's Name</Text>
            <Text style={styles.value}>: {mother_name || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>5. Date of Birth</Text>
            <Text style={styles.value}>: {new Date(date_of_birth).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>6. Nationality</Text>
            <Text style={styles.value}>: Indian</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>7. Date of Admission</Text>
            <Text style={styles.value}>: {new Date(joined_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>8. Class at time of leaving</Text>
            <Text style={styles.value}>: {class_name} {section_name ? `(${section_name})` : ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>9. Session</Text>
            <Text style={styles.value}>: {session_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>10. Date of Leaving</Text>
            <Text style={styles.value}>: {left_date ? new Date(left_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>11. Reason for Leaving</Text>
            <Text style={styles.value}>: {leaving_type ? leaving_type.replace(/_/g, ' ').toUpperCase() : 'Parental Request'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>12. Conduct & Character</Text>
            <Text style={styles.value}>: GOOD</Text>
          </View>
        </View>

        <View style={styles.statement}>
          <Text>
            Certified that the above information is in accordance with the school records. 
            The student has paid all dues to the school up to the date of leaving.
          </Text>
        </View>

        <Text style={styles.issueDate}>Date of Issue: {today}</Text>

        {/* Signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Prepared By</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Class Teacher</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Principal</Text>
            <Text style={{ fontSize: 8, marginTop: 4 }}>{principal_name}</Text>
          </View>
        </View>

        <Text style={{ position: 'absolute', bottom: 30, left: 50, right: 50, textAlign: 'center', fontSize: 8, color: '#94a3b8' }}>
          Valid only with the official school seal.
        </Text>
      </Page>
    </Document>
  );
};

export default TransferCertificatePDF;
