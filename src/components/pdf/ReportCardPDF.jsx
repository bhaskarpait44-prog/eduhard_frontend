import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const accentColor = '#6D28D9';
const DARK = '#0F172A';
const MUTED = '#64748B';
const BORDER = '#CBD5E1';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: DARK,
    backgroundColor: '#FFFFFF',
  },
  borderContainer: {
    border: '1.5pt solid #6D28D9',
    height: '100%',
    padding: 20,
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6D28D9',
    fontFamily: 'Helvetica-Bold',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#6D28D9',
    marginBottom: 2,
  },
  schoolMeta: {
    fontSize: 7.5,
    color: MUTED,
    marginTop: 1,
  },
  sessionContainer: {
    textAlign: 'right',
  },
  sessionLabel: {
    fontSize: 7,
    textTransform: 'uppercase',
    color: MUTED,
    fontFamily: 'Helvetica-Bold',
  },
  sessionValue: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: DARK,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    borderWidth: 0.5,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  infoBox: {
    width: '33.33%',
    padding: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    borderRightWidth: 0.5,
    borderRightColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  infoBoxLabel: {
    fontSize: 6.5,
    color: MUTED,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  infoBoxValue: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  table: {
    marginTop: 5,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tableRowOdd: {
    backgroundColor: '#FFFFFF',
  },
  tableRowEven: {
    backgroundColor: '#F8FAFC',
  },
  tableCell: {
    fontSize: 8,
    color: DARK,
  },
  tableCellBold: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  colSr: { width: '25pt', textAlign: 'center' },
  colSubject: { width: '150pt' },
  colMax: { width: '50pt', textAlign: 'center' },
  colTheory: { width: '55pt', textAlign: 'center' },
  colPractical: { width: '55pt', textAlign: 'center' },
  colTotal: { width: '55pt', textAlign: 'center' },
  colGrade: { width: '45pt', textAlign: 'center' },
  colRemarks: { width: '75pt' },

  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  colFooterLabel: {
    width: '280pt',
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  colFooterValue: {
    width: '110pt',
    fontSize: 8.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
  },
  colFooterGrade: {
    width: '120pt',
    fontSize: 8.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#0f766e',
    textAlign: 'center',
  },

  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 15,
  },
  resultCard: {
    padding: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  attendanceCard: {
    padding: 10,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  summaryTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2.5,
  },
  summaryText: {
    fontSize: 8,
    color: '#475569',
  },
  summaryValue: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: DARK,
  },
  resultBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  remarksCard: {
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 6,
    padding: 10,
    marginBottom: 20,
    minHeight: 45,
  },
  remarksText: {
    fontSize: 8.5,
    fontStyle: 'italic',
    color: '#334155',
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
  },
  signatureBox: {
    alignItems: 'center',
    width: '30%',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 0.5,
    borderTopColor: '#94A3B8',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: 'uppercase',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
});

function gradeRemark(grade) {
  if (grade === 'A+' || grade === 'A') return 'Excellent';
  if (grade === 'B+' || grade === 'B') return 'Very Good';
  if (grade === 'C') return 'Good';
  if (grade === 'D') return 'Needs Attention';
  return 'Unsatisfactory';
}

function getGradeColor(grade) {
  if (grade === 'A+' || grade === 'A') return '#16A34A';
  if (grade === 'B+' || grade === 'B') return '#2563EB';
  if (grade === 'C') return '#D97706';
  if (grade === 'D') return '#EA580C';
  return '#DC2626';
}

const ReportCardPDF = ({ data }) => {
  if (!data) return null;

  const school = data.school || {};
  const student = data.student || {};
  const enrollment = data.enrollment || {};
  const session = data.session || {};
  const results = data.results || [];
  const attendance = data.attendance || {};
  const finalResult = data.finalResult || {};
  const remarksText = data.remarks || '';

  const studentName = student.first_name 
    ? `${student.first_name} ${student.last_name || ''}`.trim() 
    : (student.name || '');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.borderContainer}>
          {/* Header */}
          <View style={styles.header}>
            {school.logo_url ? (
              <Image src={school.logo_url} style={styles.logo} />
            ) : (
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>EC</Text>
              </View>
            )}
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{school.name || 'EduCore School'}</Text>
              <Text style={styles.schoolMeta}>{school.address || 'Main Campus'}</Text>
              <Text style={styles.schoolMeta}>
                Phone: {school.phone || '—'}  |  Email: {school.email || '—'}
              </Text>
            </View>
            <View style={styles.sessionContainer}>
              <Text style={styles.sessionLabel}>Academic Session</Text>
              <Text style={styles.sessionValue}>{session.name || '—'}</Text>
            </View>
          </View>

          <Text style={styles.title}>
            {data.exam_name ? `Report Card — ${data.exam_name}` : 'Final Report Card'}
          </Text>

          {/* Student Info */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Student Name</Text>
              <Text style={styles.infoBoxValue}>{studentName || '—'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Admission No.</Text>
              <Text style={styles.infoBoxValue}>{student.admission_no || '—'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Roll No.</Text>
              <Text style={styles.infoBoxValue}>{enrollment.roll_number || '—'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Class</Text>
              <Text style={styles.infoBoxValue}>{enrollment.class_name || '—'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Section</Text>
              <Text style={styles.infoBoxValue}>{enrollment.section_name || '—'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxLabel}>Date of Birth</Text>
              <Text style={styles.infoBoxValue}>{student.dob || '—'}</Text>
            </View>
          </View>

          {/* Marks Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colSr}><Text style={styles.tableHeaderCell}>Sr</Text></View>
              <View style={styles.colSubject}><Text style={styles.tableHeaderCell}>Subject</Text></View>
              <View style={styles.colMax}><Text style={styles.tableHeaderCell}>Max</Text></View>
              <View style={styles.colTheory}><Text style={styles.tableHeaderCell}>Theory</Text></View>
              <View style={styles.colPractical}><Text style={styles.tableHeaderCell}>Practical</Text></View>
              <View style={styles.colTotal}><Text style={styles.tableHeaderCell}>Total</Text></View>
              <View style={styles.colGrade}><Text style={styles.tableHeaderCell}>Grade</Text></View>
              <View style={styles.colRemarks}><Text style={styles.tableHeaderCell}>Remarks</Text></View>
            </View>

            {results.map((res, idx) => {
              const isEven = idx % 2 === 1;
              const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd];

              return (
                <View key={idx} style={rowStyle} wrap={false}>
                  <View style={styles.colSr}>
                    <Text style={styles.tableCell}>{idx + 1}</Text>
                  </View>
                  <View style={styles.colSubject}>
                    <Text style={styles.tableCellBold}>{res.subject}</Text>
                  </View>
                  <View style={styles.colMax}>
                    <Text style={styles.tableCell}>
                      {res.total_marks ? parseFloat(res.total_marks).toFixed(0) : '—'}
                    </Text>
                  </View>
                  <View style={styles.colTheory}>
                    <Text style={styles.tableCell}>
                      {(() => {
                        const tTotal = res.theory_total ? parseFloat(res.theory_total) : 0;
                        const pTotal = res.practical_total ? parseFloat(res.practical_total) : 0;
                        if (res.is_absent) return tTotal > 0 ? 'ABS' : '—';
                        if (tTotal > 0 && pTotal > 0) return res.theory_marks_obtained !== null ? res.theory_marks_obtained : '—';
                        if (tTotal > 0) return res.marks_obtained !== null ? res.marks_obtained : '—';
                        return '—';
                      })()}
                    </Text>
                  </View>
                  <View style={styles.colPractical}>
                    <Text style={styles.tableCell}>
                      {(() => {
                        const tTotal = res.theory_total ? parseFloat(res.theory_total) : 0;
                        const pTotal = res.practical_total ? parseFloat(res.practical_total) : 0;
                        if (res.is_absent) return pTotal > 0 ? 'ABS' : '—';
                        if (tTotal > 0 && pTotal > 0) return res.practical_marks_obtained !== null ? res.practical_marks_obtained : '—';
                        if (pTotal > 0) return res.marks_obtained !== null ? res.marks_obtained : '—';
                        return '—';
                      })()}
                    </Text>
                  </View>
                  <View style={styles.colTotal}>
                    <Text style={styles.tableCellBold}>
                      {res.is_absent ? 'ABS' : (res.marks_obtained ? parseFloat(res.marks_obtained).toFixed(1) : '—')}
                    </Text>
                  </View>
                  <View style={styles.colGrade}>
                    <Text style={[styles.tableCellBold, { color: getGradeColor(res.grade) }]}>
                      {res.grade || '—'}
                    </Text>
                  </View>
                  <View style={styles.colRemarks}>
                    <Text style={[styles.tableCell, { fontSize: 7, color: '#475569' }]}>
                      {res.grade ? gradeRemark(res.grade) : '—'}
                    </Text>
                  </View>
                </View>
              );
            })}

            {/* Total Footer Row */}
            <View style={styles.tableFooter}>
              <View style={styles.colFooterLabel}>
                <Text>Total / Percentage</Text>
              </View>
              <View style={styles.colFooterValue}>
                <Text>
                  {finalResult.marks_obtained ? parseFloat(finalResult.marks_obtained).toFixed(1) : '—'} / {finalResult.total_marks ? parseFloat(finalResult.total_marks).toFixed(0) : '—'}
                </Text>
              </View>
              <View style={styles.colFooterGrade}>
                <Text style={{ color: accentColor }}>
                  {finalResult.percentage ? `${finalResult.percentage}%` : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Final Result Summary */}
          <View style={[styles.resultCard, { marginBottom: 15 }]}>
            <Text style={styles.summaryTitle}>Final Result Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Grade Obtained:</Text>
              <Text style={styles.summaryValue}>{finalResult.grade || '—'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>Status:</Text>
              <Text style={[
                styles.resultBadge, 
                { color: finalResult.result === 'pass' ? '#16A34A' : '#DC2626' }
              ]}>
                {finalResult.result ? finalResult.result.toUpperCase() : '—'}
              </Text>
            </View>
          </View>

          {/* Remarks */}
          <View style={styles.remarksCard}>
            <Text style={styles.summaryTitle}>Class Teacher's Remarks</Text>
            <Text style={styles.remarksText}>{remarksText || 'No remarks provided.'}</Text>
          </View>

          <Text style={{ position: 'absolute', bottom: 10, left: 20, right: 20, textAlign: 'center', fontSize: 6.5, color: '#94A3B8' }}>
            This is a computer generated report card and does not require a physical signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReportCardPDF;
