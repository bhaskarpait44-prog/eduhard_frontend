import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const accentColor = '#0f766e';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  borderContainer: {
    border: '2pt solid #0f766e',
    height: '100%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 2,
  },
  schoolMeta: {
    fontSize: 8,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#0f172a',
  },
  infoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
  infoBox: {
    width: '33.33%',
    marginBottom: 8,
  },
  label: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    padding: 6,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 6,
  },
  colSubject: { flex: 2 },
  colMarks: { flex: 1, textAlign: 'center' },
  colGrade: { flex: 0.5, textAlign: 'center' },
  
  summarySection: {
    marginTop: 15,
    flexDirection: 'row',
    gap: 15,
  },
  resultBox: {
    flex: 2,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
  },
  attendanceBox: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    backgroundColor: '#f8fafc',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  remarksSection: {
    marginTop: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    minHeight: 60,
  },
  remarksTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: 120,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginTop: 35,
    textAlign: 'center',
    paddingTop: 4,
    fontSize: 8,
    color: '#64748b',
  },
});

const ReportCardPDF = ({ data }) => {
  const { school, student, enrollment, session, results, attendance, finalResult, remarks } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderContainer}>
          {/* Header */}
          <View style={styles.header}>
            {school.logo_url && <Image src={school.logo_url} style={styles.logo} />}
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school.name}</Text>
              <Text style={styles.schoolMeta}>{school.address}</Text>
              <Text style={styles.schoolMeta}>Phone: {school.phone} | Email: {school.email}</Text>
            </View>
            <View style={{ textAlign: 'right' }}>
              <Text style={{ ...styles.label, marginBottom: 0 }}>Academic Session</Text>
              <Text style={{ ...styles.value, fontSize: 12 }}>{session.name}</Text>
            </View>
          </View>

          <Text style={styles.title}>Report Card</Text>

          {/* Student Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Student Name</Text>
              <Text style={styles.value}>{student.first_name} {student.last_name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Admission No.</Text>
              <Text style={styles.value}>{student.admission_no}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Roll No.</Text>
              <Text style={styles.value}>{enrollment.roll_number || '-'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Class</Text>
              <Text style={styles.value}>{enrollment.class_name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Section</Text>
              <Text style={styles.value}>{enrollment.section_name || '-'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>{student.dob || '-'}</Text>
            </View>
          </View>

          {/* Marks Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colSubject}>Subject Name</Text>
              <Text style={styles.colMarks}>Theory</Text>
              <Text style={styles.colMarks}>Practical</Text>
              <Text style={styles.colMarks}>Obtained</Text>
              <Text style={styles.colMarks}>Max</Text>
              <Text style={styles.colGrade}>Grade</Text>
            </View>
            {results.map((res, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colSubject}>{res.subject}</Text>
                <Text style={styles.colMarks}>{res.is_absent ? 'ABS' : (res.theory_marks_obtained ?? '-')}</Text>
                <Text style={styles.colMarks}>{res.is_absent ? 'ABS' : (res.practical_marks_obtained ?? '-')}</Text>
                <Text style={styles.colMarks}>{res.is_absent ? 'ABS' : parseFloat(res.marks_obtained).toFixed(1)}</Text>
                <Text style={styles.colMarks}>{parseFloat(res.total_marks).toFixed(0)}</Text>
                <Text style={styles.colGrade}>{res.grade}</Text>
              </View>
            ))}
          </View>

          {/* Result & Attendance Summary */}
          <View style={styles.summarySection}>
            <View style={styles.resultBox}>
              <View style={styles.summaryRow}>
                <Text style={{ fontWeight: 'bold' }}>Final Result Summary</Text>
              </View>
              <View style={{ ...styles.summaryRow, marginTop: 5 }}>
                <Text>Marks Obtained: {parseFloat(finalResult.marks_obtained).toFixed(1)} / {parseFloat(finalResult.total_marks).toFixed(0)}</Text>
                <Text>Percentage: {finalResult.percentage}%</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Final Grade: {finalResult.grade}</Text>
                <Text style={{ color: finalResult.result === 'pass' ? '#16a34a' : '#dc2626', fontWeight: 'bold' }}>
                  Result: {finalResult.result.toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.attendanceBox}>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Attendance</Text>
              <View style={styles.summaryRow}>
                <Text>Working Days:</Text>
                <Text>{attendance?.workingDays || '-'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text>Days Present:</Text>
                <Text>{attendance?.presentCount || '-'}</Text>
              </View>
              <View style={{ ...styles.summaryRow, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 2, paddingTop: 2 }}>
                <Text style={{ fontWeight: 'bold' }}>Percentage:</Text>
                <Text style={{ fontWeight: 'bold' }}>{attendance?.percentage || 0}%</Text>
              </View>
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.remarksSection}>
            <Text style={styles.remarksTitle}>Class Teacher's Remarks</Text>
            <Text style={{ fontStyle: 'italic', fontSize: 10 }}>{remarks}</Text>
          </View>

          {/* Signatures */}
          <View style={styles.footer}>
            <View>
              <Text style={styles.signatureLine}>Class Teacher</Text>
            </View>
            <View>
              <Text style={styles.signatureLine}>Principal</Text>
              <Text style={{ fontSize: 7, textAlign: 'center', marginTop: 2 }}>{school.principal_name}</Text>
            </View>
            <View>
              <Text style={styles.signatureLine}>Parent/Guardian</Text>
            </View>
          </View>

          <Text style={{ position: 'absolute', bottom: 10, left: 20, right: 20, textAlign: 'center', fontSize: 7, color: '#94a3b8' }}>
            This is a computer generated report card and does not require a physical signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReportCardPDF;
