import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const accentColor = '#4f46e5'; // Indigo

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
  titleContainer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#0f172a',
  },
  sessionSubtitle: {
    fontSize: 12,
    marginTop: 8,
    color: '#475569',
    fontWeight: 'bold',
  },
  overallScoreContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    borderColor: accentColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  scoreLabel: {
    fontSize: 9,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#64748b',
  },
  statusBadge: {
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  // Tables
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
    padding: 6,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    padding: 6,
    alignItems: 'center',
  },
  col1: { flex: 2 },
  col2: { flex: 1, textAlign: 'right' },
  col3: { flex: 0.8, textAlign: 'center' },
  col4: { flex: 0.8, textAlign: 'center' },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: accentColor,
    backgroundColor: '#f5f3ff',
    padding: 5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    width: '31%',
    padding: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  twoColumn: {
    flexDirection: 'row',
    gap: 15,
  },
  column: {
    flex: 1,
  },
  // Visual Bar for Grade Distribution
  barContainer: {
    width: 60,
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: accentColor,
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#94a3b8',
  },
});

const Coalesce = (val, decimals = 1) => {
  const num = Number(val || 0);
  return isNaN(num) ? '0' : num.toFixed(decimals);
};

const CoalesceInt = (val) => {
  const num = Number(val || 0);
  return isNaN(num) ? '0' : Math.round(num).toString();
};

const ComplianceReportPDF = ({ report, school, userName, overallScore }) => {
  if (!report || !school) return null;
  
  const generatedDate = new Date().toLocaleDateString();

  const getStatusText = (score) => {
    if (score >= 90) return "Institutional Excellence";
    if (score >= 70) return "Borderline Compliance";
    return "Immediate Action Required";
  };

  const getStatusSymbol = (rate, type) => {
    const thresholds = {
      attendance: { ok: 85, warn: 75 },
      retention: { ok: 90, warn: 80 },
      pass_rate: { ok: 70, warn: 60 },
      fee: { ok: 90, warn: 80 },
      staff_attendance: { ok: 90, warn: 80 }
    };
    const t = thresholds[type] || { ok: 70, warn: 60 };
    if (rate >= t.ok) return "PASS";
    if (rate >= t.warn) return "WARN";
    return "FAIL";
  };

  const maxGradeCount = Math.max(1, ...(report.academic?.grade_distribution?.map(g => g.count) || [0]));

  return (
    <Document>
      {/* PAGE 1: COVER & SUMMARY */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {school?.logo_url && (
            <Image src={school.logo_url} style={styles.logo} />
          )}
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>{school?.name || 'EduHard Academy'}</Text>
            <Text style={styles.schoolMeta}>{school?.address || ''}</Text>
            <Text style={styles.schoolMeta}>
              {school?.phone ? `Phone: ${school.phone}` : ''} {school?.email ? `| Email: ${school.email}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.reportTitle}>Accreditation & Compliance Report</Text>
          <Text style={styles.sessionSubtitle}>Session: {report?.session?.name || 'N/A'}</Text>
          <Text style={{ fontSize: 8, color: '#64748b', marginTop: 4 }}>
            Period: {report?.session?.start_date ? new Date(report.session.start_date).toLocaleDateString() : ''} to {report?.session?.end_date ? new Date(report.session.end_date).toLocaleDateString() : ''}
          </Text>
        </View>

        <View style={styles.overallScoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreValue}>{overallScore || 0}%</Text>
            <Text style={styles.scoreLabel}>Overall Score</Text>
          </View>
          <View style={[styles.statusBadge, { 
            backgroundColor: overallScore >= 90 ? '#ecfdf5' : overallScore >= 70 ? '#fffbeb' : '#fef2f2',
            color: overallScore >= 90 ? '#065f46' : overallScore >= 70 ? '#92400e' : '#991b1b'
          }]}>
            <Text>{getStatusText(overallScore)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary Table</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.col1, styles.tableHeaderText]}>Section Domain</Text>
              <Text style={[styles.col2, styles.tableHeaderText]}>Key Metric %</Text>
              <Text style={[styles.col3, styles.tableHeaderText]}>Status</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.col1}>1. Enrollment & Retention</Text>
              <Text style={styles.col2}>{Coalesce(report.enrollment?.retention_rate)}%</Text>
              <Text style={styles.col3}>{getStatusSymbol(report.enrollment?.retention_rate, 'retention')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.col1}>2. Attendance Compliance</Text>
              <Text style={styles.col2}>{Coalesce(report.attendance?.overall_rate)}%</Text>
              <Text style={styles.col3}>{getStatusSymbol(report.attendance?.overall_rate, 'attendance')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.col1}>3. Academic Performance</Text>
              <Text style={styles.col2}>{Coalesce(report.academic?.pass_rate)}%</Text>
              <Text style={styles.col3}>{getStatusSymbol(report.academic?.pass_rate, 'pass_rate')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.col1}>4. Fee Collection</Text>
              <Text style={styles.col2}>{Coalesce(report.fee?.collection_rate)}%</Text>
              <Text style={styles.col3}>{getStatusSymbol(report.fee?.collection_rate, 'fee')}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.col1}>5. Staff & Payroll</Text>
              <Text style={styles.col2}>{Coalesce(report.staff?.staff_attendance_rate)}%</Text>
              <Text style={styles.col3}>{getStatusSymbol(report.staff?.staff_attendance_rate, 'staff_attendance')}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 8, color: '#94a3b8' }}>Generated on {generatedDate} by {userName || 'Administrator'}</Text>
        </View>

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
          `EduHard School Management System - Confidential - Page ${pageNumber} of ${totalPages}`
        )} />
      </Page>

      {/* PAGE 2: ENROLLMENT & ATTENDANCE */}
      <Page size="A4" style={styles.page}>
        <View style={styles.twoColumn}>
          {/* Enrollment */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>1. Enrollment Summary</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Enrolled</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.enrollment?.total_enrolled)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>New Adms.</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.enrollment?.new_admissions)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Dropouts</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.enrollment?.students_left)}</Text>
              </View>
              <View style={[styles.statBox, { width: '48%' }]}>
                <Text style={styles.statLabel}>Retention Rate</Text>
                <Text style={styles.statValue}>{Coalesce(report.enrollment?.retention_rate)}%</Text>
              </View>
              <View style={[styles.statBox, { width: '48%' }]}>
                <Text style={styles.statLabel}>Prev Adms.</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.enrollment?.prev_new_admissions)}</Text>
              </View>
            </View>

            <Text style={[styles.statLabel, { marginTop: 10 }]}>Gender Breakdown</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, styles.tableHeaderText]}>Gender</Text>
                <Text style={[styles.col2, styles.tableHeaderText]}>Count</Text>
              </View>
              {report.enrollment?.gender_breakdown?.map((g, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.col1, { textTransform: 'capitalize' }]}>{g.gender}</Text>
                  <Text style={styles.col2}>{g.count}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Attendance */}
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>2. Attendance Compliance</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { width: '48%' }]}>
                <Text style={styles.statLabel}>Overall Rate</Text>
                <Text style={styles.statValue}>{Coalesce(report.attendance?.overall_rate)}%</Text>
              </View>
              <View style={[styles.statBox, { width: '48%' }]}>
                <Text style={styles.statLabel}>At-Risk (&lt;75%)</Text>
                <Text style={[styles.statValue, { color: report.attendance?.at_risk_count > 0 ? '#ef4444' : '#0f172a' }]}>
                  {CoalesceInt(report.attendance?.at_risk_count)}
                </Text>
              </View>
            </View>

            <Text style={[styles.statLabel, { marginTop: 10 }]}>Class-wise Attendance</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, styles.tableHeaderText]}>Class Name</Text>
                <Text style={[styles.col2, styles.tableHeaderText]}>Rate %</Text>
              </View>
              {report.attendance?.class_wise?.map((c, i) => (
                <View key={i} style={[styles.tableRow, Number(c.rate) < 75 ? { backgroundColor: '#fee2e2' } : {}]}>
                  <Text style={styles.col1}>{c.class_name}</Text>
                  <Text style={styles.col2}>{Coalesce(c.rate)}%</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
          `EduHard School Management System - Confidential - Page ${pageNumber} of ${totalPages}`
        )} />
      </Page>

      {/* PAGE 3: ACADEMIC PERFORMANCE */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>3. Academic Performance</Text>
        <View style={[styles.statsGrid, { marginBottom: 15 }]}>
          <View style={[styles.statBox, { width: '32%' }]}>
            <Text style={styles.statLabel}>Exams</Text>
            <Text style={styles.statValue}>{CoalesceInt(report.academic?.exams_conducted)}</Text>
          </View>
          <View style={[styles.statBox, { width: '32%' }]}>
            <Text style={styles.statLabel}>Pass Rate</Text>
            <Text style={styles.statValue}>{Coalesce(report.academic?.pass_rate)}%</Text>
          </View>
          <View style={[styles.statBox, { width: '32%' }]}>
            <Text style={styles.statLabel}>Avg Marks</Text>
            <Text style={styles.statValue}>{Coalesce(report.academic?.avg_marks)}%</Text>
          </View>
        </View>

        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.statLabel}>Subject-wise Pass Rates</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.col1, styles.tableHeaderText]}>Subject</Text>
                <Text style={[styles.col2, styles.tableHeaderText]}>Pass %</Text>
              </View>
              {report.academic?.subject_wise?.map((s, i) => {
                const rate = Number(s.pass_rate || 0);
                const color = rate >= 70 ? '#059669' : rate >= 60 ? '#d97706' : '#dc2626';
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.col1}>{s.subject_name}</Text>
                    <Text style={[styles.col2, { color, fontWeight: 'bold' }]}>{rate.toFixed(1)}%</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.statLabel}>Grade Distribution</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[{ flex: 1 }, styles.tableHeaderText]}>Grade</Text>
                <Text style={[{ flex: 1, textAlign: 'center' }, styles.tableHeaderText]}>Count</Text>
                <Text style={[{ flex: 2, textAlign: 'center' }, styles.tableHeaderText]}>Chart</Text>
              </View>
              {report.academic?.grade_distribution?.map((g, i) => {
                const widthPercent = Math.max(5, (g.count / maxGradeCount) * 100);
                return (
                  <View key={i} style={styles.tableRow}>
                    <Text style={{ flex: 1, fontWeight: 'bold' }}>{g.grade}</Text>
                    <Text style={{ flex: 1, textAlign: 'center' }}>{g.count}</Text>
                    <View style={[{ flex: 2, alignItems: 'center' }]}>
                      <View style={styles.barContainer}>
                        <View style={[styles.barFill, { width: `${widthPercent}%` }]} />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
          `EduHard School Management System - Confidential - Page ${pageNumber} of ${totalPages}`
        )} />
      </Page>

      {/* PAGE 4: FINANCE, STAFF, LIBRARY, GOVERNANCE */}
      <Page size="A4" style={styles.page}>
        {/* 4. FEE COLLECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Fee Collection Compliance</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { width: '48%' }]}>
              <Text style={styles.statLabel}>Total Invoiced</Text>
              <Text style={styles.statValue}>INR {Number(report.fee?.total_invoiced || 0).toLocaleString()}</Text>
            </View>
            <View style={[styles.statBox, { width: '48%' }]}>
              <Text style={styles.statLabel}>Total Collected</Text>
              <Text style={styles.statValue}>INR {Number(report.fee?.total_collected || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Collection Rate</Text>
              <Text style={styles.statValue}>{Coalesce(report.fee?.collection_rate)}%</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Defaulters</Text>
              <Text style={styles.statValue}>{CoalesceInt(report.fee?.defaulter_count)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Outstanding</Text>
              <Text style={[styles.statValue, { color: '#ef4444' }]}>INR {Number(report.fee?.outstanding_amount || 0).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* 5. STAFF & PAYROLL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Staff & Payroll</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Teaching</Text>
              <Text style={styles.statValue}>{CoalesceInt(report.staff?.teaching_staff_count)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Non-Teaching</Text>
              <Text style={styles.statValue}>{CoalesceInt(report.staff?.non_teaching_staff_count)}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Attendance</Text>
              <Text style={styles.statValue}>{Coalesce(report.staff?.staff_attendance_rate)}%</Text>
            </View>
            <View style={[styles.statBox, { width: '100%' }]}>
              <Text style={styles.statLabel}>Payroll Disbursement Rate</Text>
              <Text style={styles.statValue}>{Coalesce(report.staff?.payroll_disbursement_rate)}%</Text>
            </View>
          </View>
        </View>

        {/* 6, 7, 8 */}
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            <Text style={styles.sectionTitle}>6. Library</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { width: '45%' }]}>
                <Text style={styles.statLabel}>Books</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.library?.total_books)}</Text>
              </View>
              <View style={[styles.statBox, { width: '45%' }]}>
                <Text style={styles.statLabel}>Issues</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.library?.total_issues)}</Text>
              </View>
              <View style={[styles.statBox, { width: '45%' }]}>
                <Text style={styles.statLabel}>Borrowers</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.library?.active_borrowers)}</Text>
              </View>
              <View style={[styles.statBox, { width: '45%' }]}>
                <Text style={styles.statLabel}>Overdue</Text>
                <Text style={[styles.statValue, { color: report.library?.overdue_books > 0 ? '#ef4444' : '#0f172a' }]}>
                  {CoalesceInt(report.library?.overdue_books)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.column}>
            <Text style={styles.sectionTitle}>7. Audit & 8. Certs</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { width: '45%' }]}>
                <Text style={styles.statLabel}>Audit Logs</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.audit?.total_admin_actions)}</Text>
              </View>
              <View style={[styles.statBox, { width: '45%' }]}>
                <Text style={styles.statLabel}>Admins</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.audit?.unique_admins)}</Text>
              </View>
              <View style={[styles.statBox, { width: '100%' }]}>
                <Text style={styles.statLabel}>Certificates Issued</Text>
                <Text style={styles.statValue}>{CoalesceInt(report.certificates?.count)}</Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
          `EduHard School Management System - Confidential - Page ${pageNumber} of ${totalPages}`
        )} />
      </Page>
    </Document>
  );
};

export default ComplianceReportPDF;
