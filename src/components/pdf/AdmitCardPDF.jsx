import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer'
import { formatCurrency, formatTime } from '@/utils/helpers'

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: 10,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  admitCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 10,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  infoItem: {
    width: '50%',
    marginBottom: 6,
  },
  label: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 5,
  },
  col1: { width: '40%' },
  col2: { width: '25%' },
  col3: { width: '20%' },
  col4: { width: '15%', textAlign: 'right' },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#475569',
  },
  tableCellText: {
    fontSize: 9,
  },
  feeWarning: {
    marginTop: 20,
    padding: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    borderRadius: 4,
    color: '#92400e',
    fontSize: 9,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    textAlign: 'center',
    paddingTop: 5,
  },
  date: {
    fontSize: 9,
    color: '#64748b',
  }
})

const AdmitCardPDF = ({ students, exam, subjects, schoolName, balances }) => {
  const today = new Date().toLocaleDateString('en-IN')

  return (
    <Document>
      {students.map((student) => {
        const balance = balances[student.id] || 0
        return (
          <Page key={student.id} size="A5" style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.schoolName}>{schoolName}</Text>
              <Text style={{ fontSize: 8, color: '#64748b' }}>Examination Admit Card</Text>
            </View>

            <Text style={styles.admitCardTitle}>ADMIT CARD</Text>

            {/* Exam & Session Info */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>EXAM</Text>
                <Text style={styles.value}>{exam.name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>SESSION</Text>
                <Text style={styles.value}>{exam.session_name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>CLASS</Text>
                <Text style={styles.value}>{exam.class_name}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 }} />

            {/* Student Info */}
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.label}>STUDENT NAME</Text>
                <Text style={styles.value}>{student.student_name || `${student.first_name} ${student.last_name}`}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>ROLL NO</Text>
                <Text style={styles.value}>{student.roll_number || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>FATHER'S NAME</Text>
                <Text style={styles.value}>{student.father_name || '-'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.label}>ADMISSION NO</Text>
                <Text style={styles.value}>{student.admission_no}</Text>
              </View>
            </View>

            {/* Subjects Table */}
            <View style={styles.section}>
              <Text style={[styles.label, { marginBottom: 5 }]}>SUBJECTS & SCHEDULE</Text>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <View style={styles.col1}><Text style={styles.tableHeaderText}>Subject</Text></View>
                  <View style={styles.col2}><Text style={styles.tableHeaderText}>Date</Text></View>
                  <View style={styles.col3}><Text style={styles.tableHeaderText}>Time</Text></View>
                  <View style={styles.col4}><Text style={styles.tableHeaderText}>Max</Text></View>
                </View>
                {subjects.length > 0 ? (
                  subjects.map((sub, idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <View style={styles.col1}><Text style={styles.tableCellText}>{sub.name}</Text></View>
                      <View style={styles.col2}><Text style={styles.tableCellText}>{sub.exam_date || 'TBD'}</Text></View>
                      <View style={styles.col3}><Text style={styles.tableCellText}>{formatTime(sub.start_time)}</Text></View>
                      <View style={styles.col4}><Text style={styles.tableCellText}>{sub.combined_total_marks || sub.total_marks || '-'}</Text></View>
                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <View style={{ width: '100%' }}><Text style={[styles.tableCellText, { textAlign: 'center' }]}>Refer to timetable</Text></View>
                  </View>
                )}
              </View>
            </View>

            {/* Fee Warning */}
            {balance > 0 && (
              <View style={styles.feeWarning}>
                <Text>⚠️ Fee Pending — {formatCurrency(balance)} due</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.date}>Date: {today}</Text>
              <View style={styles.signatureLine}>
                <Text style={{ fontSize: 9 }}>Authorized Signature</Text>
              </View>
            </View>
          </Page>
        )
      })}
    </Document>
  )
}

export default AdmitCardPDF
