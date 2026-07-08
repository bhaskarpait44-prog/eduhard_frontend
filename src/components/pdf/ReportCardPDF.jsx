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
    borderWidth: 1.5,
    borderStyle: 'solid',
    borderColor: '#6D28D9',
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
  colSubject: { width: '160pt' },
  colWeightage: { width: '50pt', textAlign: 'center' },
  colTheory: { width: '55pt', textAlign: 'center' },
  colPractical: { width: '55pt', textAlign: 'center' },
  colMax: { width: '55pt', textAlign: 'center' },
  colObtained: { width: '55pt', textAlign: 'center' },
  colGrade: { width: '40pt', textAlign: 'center' },
  colStatus: { width: '45pt', textAlign: 'center' },

  tableFooter: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  colFooterLabel: {
    width: '265pt',
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
    width: '140pt',
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

  // Group results by subject
  const subjectsMap = {};
  results.forEach(row => {
    const subKey = row.subject_id || row.subject;
    if (!subjectsMap[subKey]) {
      subjectsMap[subKey] = {
        subject_id: row.subject_id,
        subject_name: row.subject,
        subject_code: row.code,
        exams: [],
        weighted_max: 0,
        weighted_obtained: 0,
        weighted_passing: 0,
        is_absent: true,
      };
    }
    const sub = subjectsMap[subKey];
    sub.exams.push(row);

    const weight = parseFloat(row.exam_weightage || 100) / 100;
    const totalMarks = parseFloat(row.total_marks || 0);
    sub.weighted_max += totalMarks * weight;
    sub.weighted_obtained += (row.is_absent ? 0 : parseFloat(row.marks_obtained || 0)) * weight;
    sub.weighted_passing += parseFloat(row.passing_marks || 0) * weight;

    if (!row.is_absent) {
      sub.is_absent = false;
    }
  });

  const gradingScale = data.gradingScale || [
    { min: 90, grade: 'A+' },
    { min: 80, grade: 'A' },
    { min: 70, grade: 'B+' },
    { min: 60, grade: 'B' },
    { min: 50, grade: 'C' },
    { min: 40, grade: 'D' },
  ];

  const percentageToGrade = (pct, scale) => {
    for (const band of scale) {
      if (pct >= band.min) return band.grade;
    }
    return 'F';
  };

  Object.values(subjectsMap).forEach(sub => {
    const pct = sub.weighted_max > 0 ? parseFloat(((sub.weighted_obtained / sub.weighted_max) * 100).toFixed(2)) : 0.00;
    sub.final_percentage = pct;
    sub.final_grade = percentageToGrade(pct, gradingScale);
    sub.final_is_pass = sub.weighted_obtained >= sub.weighted_passing;
  });

  const groupedSubjects = Object.values(subjectsMap);

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
              <View style={styles.colSubject}><Text style={styles.tableHeaderCell}>Subject / Exam Name</Text></View>
              <View style={styles.colWeightage}><Text style={styles.tableHeaderCell}>Weightage</Text></View>
              <View style={styles.colTheory}><Text style={styles.tableHeaderCell}>Theory</Text></View>
              <View style={styles.colPractical}><Text style={styles.tableHeaderCell}>Practical</Text></View>
              <View style={styles.colMax}><Text style={styles.tableHeaderCell}>Total</Text></View>
              <View style={styles.colObtained}><Text style={styles.tableHeaderCell}>Obt.</Text></View>
              <View style={styles.colGrade}><Text style={styles.tableHeaderCell}>Grade</Text></View>
              <View style={styles.colStatus}><Text style={styles.tableHeaderCell}>Status</Text></View>
            </View>

            {groupedSubjects.map((sub, sIdx) => {
              return (
                <View key={sIdx} wrap={false}>
                  {/* Subject Header Row */}
                  <View style={[styles.tableRow, { backgroundColor: '#F1F5F9' }]}>
                    <View style={styles.colSubject}>
                      <Text style={[styles.tableCellBold, { color: '#1E3A8A' }]}>
                        {sub.subject_name.toUpperCase()} {sub.subject_code ? `(${sub.subject_code})` : ''}
                      </Text>
                    </View>
                    <View style={styles.colWeightage} />
                    <View style={styles.colTheory} />
                    <View style={styles.colPractical} />
                    <View style={styles.colMax} />
                    <View style={styles.colObtained} />
                    <View style={styles.colGrade} />
                    <View style={styles.colStatus} />
                  </View>

                  {/* Exam Rows */}
                  {sub.exams.map((exam, eIdx) => {
                    const rowStyle = [styles.tableRow, eIdx % 2 === 1 ? styles.tableRowEven : styles.tableRowOdd];
                    return (
                      <View key={eIdx} style={rowStyle}>
                        <View style={styles.colSubject}>
                          <Text style={[styles.tableCell, { paddingLeft: 12, color: '#475569' }]}>
                            {exam.exam_name || 'Exam'}
                          </Text>
                        </View>
                        <View style={styles.colWeightage}>
                          <Text style={styles.tableCell}>
                            {parseFloat(exam.exam_weightage || 100)}%
                          </Text>
                        </View>
                        <View style={styles.colTheory}>
                          <Text style={styles.tableCell}>
                            {(() => {
                              const tTotal = exam.theory_total ? parseFloat(exam.theory_total) : 0;
                              const pTotal = exam.practical_total ? parseFloat(exam.practical_total) : 0;
                              if (exam.is_absent) return tTotal > 0 ? 'ABS' : '—';
                              if (tTotal > 0 && pTotal > 0) return exam.theory_marks_obtained !== null ? exam.theory_marks_obtained : '—';
                              if (tTotal > 0) return exam.marks_obtained !== null ? exam.marks_obtained : '—';
                              return '—';
                            })()}
                          </Text>
                        </View>
                        <View style={styles.colPractical}>
                          <Text style={styles.tableCell}>
                            {(() => {
                              const tTotal = exam.theory_total ? parseFloat(exam.theory_total) : 0;
                              const pTotal = exam.practical_total ? parseFloat(exam.practical_total) : 0;
                              if (exam.is_absent) return pTotal > 0 ? 'ABS' : '—';
                              if (tTotal > 0 && pTotal > 0) return exam.practical_marks_obtained !== null ? exam.practical_marks_obtained : '—';
                              if (pTotal > 0) return exam.marks_obtained !== null ? exam.marks_obtained : '—';
                              return '—';
                            })()}
                          </Text>
                        </View>
                        <View style={styles.colMax}>
                          <Text style={styles.tableCell}>
                            {exam.total_marks ? parseFloat(exam.total_marks).toFixed(0) : '—'}
                          </Text>
                        </View>
                        <View style={styles.colObtained}>
                          <Text style={styles.tableCellBold}>
                            {exam.is_absent ? 'ABS' : (exam.marks_obtained ? parseFloat(exam.marks_obtained).toFixed(1) : '—')}
                          </Text>
                        </View>
                        <View style={styles.colGrade}>
                          <Text style={[styles.tableCellBold, { color: getGradeColor(exam.grade) }]}>
                            {exam.grade || '—'}
                          </Text>
                        </View>
                        <View style={styles.colStatus}>
                          <Text style={[styles.tableCellBold, { color: exam.is_pass ? '#16A34A' : '#DC2626', fontSize: 7.5 }]}>
                            {exam.is_absent ? 'ABS' : (exam.is_pass ? 'PASS' : 'FAIL')}
                          </Text>
                        </View>
                      </View>
                    );
                  })}

                  {/* Subject Weighted Total Row */}
                  <View style={[styles.tableRow, { borderTopWidth: 0.5, borderTopColor: '#CBD5E1', backgroundColor: '#F8FAFC' }]}>
                    <View style={styles.colSubject}>
                      <Text style={[styles.tableCellBold, { paddingLeft: 12 }]}>
                        Weighted Total
                      </Text>
                    </View>
                    <View style={styles.colWeightage}>
                      <Text style={styles.tableCellBold}>100%</Text>
                    </View>
                    
                    {(() => {
                      let weightedTheoryMax = 0, weightedTheoryObt = 0, hasTheory = false;
                      let weightedPracMax = 0, weightedPracObt = 0, hasPrac = false;
                      sub.exams.forEach(e => {
                        const w = parseFloat(e.exam_weightage || 100) / 100;
                        const tTotal = e.theory_total ? parseFloat(e.theory_total) : 0;
                        const pTotal = e.practical_total ? parseFloat(e.practical_total) : 0;
                        
                        if (tTotal > 0) {
                          weightedTheoryMax += tTotal * w;
                          const obt = (tTotal > 0 && pTotal > 0) ? (e.theory_marks_obtained || 0) : (e.marks_obtained || 0);
                          weightedTheoryObt += (e.is_absent ? 0 : parseFloat(obt)) * w;
                          hasTheory = true;
                        }
                        if (pTotal > 0) {
                          weightedPracMax += pTotal * w;
                          const obt = (tTotal > 0 && pTotal > 0) ? (e.practical_marks_obtained || 0) : (e.marks_obtained || 0);
                          weightedPracObt += (e.is_absent ? 0 : parseFloat(obt)) * w;
                          hasPrac = true;
                        }
                      });
                      return (
                        <>
                          <View style={styles.colTheory}>
                            <Text style={styles.tableCell}>
                              {hasTheory ? `${weightedTheoryObt.toFixed(1)}/${weightedTheoryMax.toFixed(1)}` : '—'}
                            </Text>
                          </View>
                          <View style={styles.colPractical}>
                            <Text style={styles.tableCell}>
                              {hasPrac ? `${weightedPracObt.toFixed(1)}/${weightedPracMax.toFixed(1)}` : '—'}
                            </Text>
                          </View>
                        </>
                      );
                    })()}

                    <View style={styles.colMax}>
                      <Text style={styles.tableCellBold}>
                        {sub.weighted_max.toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.colObtained}>
                      <Text style={styles.tableCellBold}>
                        {sub.is_absent ? 'ABS' : sub.weighted_obtained.toFixed(1)}
                      </Text>
                    </View>
                    <View style={styles.colGrade}>
                      <Text style={[styles.tableCellBold, { color: getGradeColor(sub.final_grade) }]}>
                        {sub.is_absent ? '—' : sub.final_grade}
                      </Text>
                    </View>
                    <View style={styles.colStatus}>
                      <Text style={[styles.tableCellBold, { color: sub.final_is_pass ? '#16A34A' : '#DC2626', fontSize: 7.5 }]}>
                        {sub.is_absent ? 'ABS' : (sub.final_is_pass ? 'PASS' : 'FAIL')}
                      </Text>
                    </View>
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
