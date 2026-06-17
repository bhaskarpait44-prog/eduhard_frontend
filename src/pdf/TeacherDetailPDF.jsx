import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import SchoolPdfHeader from './components/SchoolPdfHeader';
import PdfFooter from './components/PdfFooter';
import PdfSectionTitle from './components/PdfSectionTitle';

const BRAND = '#4F46E5';
const DARK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const LIGHT = '#F9FAFB';
const WHITE = '#FFFFFF';
const GREEN = '#16A34A';
const RED = '#DC2626';
const BADGE_GREEN_BG = '#DCFCE7';
const BADGE_GREEN_FG = '#15803D';
const BADGE_GREY_BG = '#F3F4F6';
const BADGE_GREY_FG = '#6B7280';
const BADGE_AMBER_BG = '#FEF3C7';
const BADGE_AMBER_FG = '#D97706';
const BADGE_BLUE_BG = '#EFF6FF';
const BADGE_BLUE_FG = '#2563EB';
const BADGE_RED_BG = '#FEE2E2';
const BADGE_RED_FG = '#991B1B';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  idCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LIGHT,
    borderLeftWidth: 4,
    borderLeftColor: BRAND,
    borderRadius: 4,
    padding: 12,
    marginTop: 10,
    marginBottom: 15,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  idCardInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: DARK,
    fontFamily: 'Helvetica-Bold',
  },
  teacherMeta: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },
  teacherSubMeta: {
    fontSize: 9,
    color: MUTED,
    marginTop: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  column: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    minHeight: 18,
  },
  infoLabel: {
    fontSize: 8,
    color: MUTED,
  },
  infoValue: {
    fontSize: 8,
    color: DARK,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    maxWidth: '60%',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 8,
    color: DARK,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  timetableContainer: {
    marginTop: 5,
  },
  timetableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  timetableDayCell: {
    width: 60,
    backgroundColor: BRAND,
    color: WHITE,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    padding: 6,
    justifyContent: 'center',
  },
  timetableSlotCell: {
    flex: 1,
    padding: 6,
    backgroundColor: LIGHT,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
  },
  timetableSubject: {
    fontSize: 8,
    fontWeight: 'bold',
    color: DARK,
    fontFamily: 'Helvetica-Bold',
  },
  timetableMeta: {
    fontSize: 7,
    color: MUTED,
    marginTop: 2,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  pill: {
    flex: 1,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  pillValue: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  pillLabel: {
    fontSize: 7,
    marginTop: 2,
  },
  signatureBlock: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  signatureLine: {
    width: 150,
    borderTopWidth: 1,
    borderTopColor: DARK,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: MUTED,
    textAlign: 'center',
  },
});

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric'
}) : '—';

export const TeacherDetailPDF = ({ teacher, school, assignments = [], timetable = [], leaves = [] }) => {
  const initials = teacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const leaveSummary = {
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected' || l.status === 'cancelled').length,
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const maxPeriods = timetable.length > 0 ? Math.max(...timetable.map(t => t.period_number)) : 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SchoolPdfHeader school={school} title="Teacher Report" subtitle={`Report Date: ${fmt(new Date())}`} />

        {/* Identity Card */}
        <View style={styles.idCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.idCardInfo}>
            <Text style={styles.teacherName}>{teacher.name || '—'}</Text>
            <Text style={styles.teacherMeta}>{teacher.designation || '—'} · {teacher.department || '—'}</Text>
            <Text style={styles.teacherSubMeta}>Employee ID: {teacher.employee_id || '—'}</Text>
            <Text style={styles.teacherSubMeta}>Joined: {fmt(teacher.joining_date)} · {teacher.years_of_experience || 0} years experience</Text>
          </View>
          <Text style={[styles.statusBadge, teacher.is_active ? { backgroundColor: BADGE_GREEN_BG, color: BADGE_GREEN_FG } : { backgroundColor: BADGE_GREY_BG, color: BADGE_GREY_FG }]}>
            {teacher.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>

        {/* Two Column Panels */}
        <View style={styles.twoColumnContainer}>
          <View style={styles.column}>
            <PdfSectionTitle title="Personal Details" />
            <View style={[styles.infoRow, { backgroundColor: LIGHT }]}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{teacher.email || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{teacher.phone || '—'}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: LIGHT }]}>
              <Text style={styles.infoLabel}>DOB</Text>
              <Text style={styles.infoValue}>{fmt(teacher.date_of_birth)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{teacher.gender ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1) : '—'}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: LIGHT }]}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue}>{teacher.address || '—'}</Text>
            </View>
          </View>

          <View style={styles.column}>
            <PdfSectionTitle title="Academic Background" />
            <View style={[styles.infoRow, { backgroundColor: LIGHT }]}>
              <Text style={styles.infoLabel}>Qualification</Text>
              <Text style={styles.infoValue}>{teacher.highest_qualification || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Specialization</Text>
              <Text style={styles.infoValue}>{teacher.specialization || '—'}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: LIGHT }]}>
              <Text style={styles.infoLabel}>University</Text>
              <Text style={styles.infoValue}>{teacher.university_name || '—'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Grad. Year</Text>
              <Text style={styles.infoValue}>{teacher.graduation_year || '—'}</Text>
            </View>
            <View style={[styles.infoRow, { backgroundColor: LIGHT }]}>
              <Text style={styles.infoLabel}>Experience</Text>
              <Text style={styles.infoValue}>{teacher.years_of_experience ? `${teacher.years_of_experience} years` : '—'}</Text>
            </View>
          </View>
        </View>

        {/* Assignments */}
        <PdfSectionTitle title="Current Assignments" />
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '100pt' }]}>Class</Text>
            <Text style={[styles.tableHeaderCell, { width: '80pt' }]}>Section</Text>
            <Text style={[styles.tableHeaderCell, { width: '150pt' }]}>Subject</Text>
            <Text style={[styles.tableHeaderCell, { width: '70pt' }]}>Code</Text>
            <Text style={[styles.tableHeaderCell, { width: '100pt' }]}>Role</Text>
          </View>
          {assignments.length === 0 ? (
            <Text style={{ fontSize: 9, color: MUTED, padding: 10, textAlign: 'center' }}>No assignments for current session.</Text>
          ) : (
            assignments.map((a, index) => (
              <View key={a.id} style={[styles.tableRow, !a.is_active && { opacity: 0.5 }]}>
                <Text style={[styles.tableCell, { width: '100pt' }]}>{a.class_name || '—'}</Text>
                <Text style={[styles.tableCell, { width: '80pt' }]}>{a.section_name || '—'}</Text>
                <Text style={[styles.tableCell, { width: '150pt' }]}>{a.subject_name || '—'}</Text>
                <Text style={[styles.tableCell, { width: '70pt' }]}>{a.subject_code || '—'}</Text>
                <View style={{ width: '100pt' }}>
                  <Text style={[
                    styles.typeBadge, 
                    a.is_class_teacher 
                      ? { backgroundColor: BADGE_AMBER_BG, color: BADGE_AMBER_FG }
                      : { backgroundColor: BADGE_BLUE_BG, color: BADGE_BLUE_FG }
                  ]}>
                    {a.is_class_teacher ? 'Class Teacher' : 'Subject Teacher'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Timetable */}
        <PdfSectionTitle title="Weekly Timetable" />
        {timetable.length === 0 ? (
          <Text style={{ fontSize: 9, color: MUTED, padding: 10, textAlign: 'center' }}>No timetable slots found for current session.</Text>
        ) : (
          <View style={styles.timetableContainer}>
            {days.map(day => {
              const slots = timetable.filter(t => t.day_of_week === day).sort((a, b) => a.period_number - b.period_number);
              if (slots.length === 0) return null;
              return (
                <View key={day} style={styles.timetableRow}>
                  <View style={styles.timetableDayCell}>
                    <Text>{day.charAt(0).toUpperCase() + day.slice(1, 3)}</Text>
                  </View>
                  {Array.from({ length: maxPeriods }).map((_, i) => {
                    const period = i + 1;
                    const slot = slots.find(s => s.period_number === period);
                    return (
                      <View key={period} style={styles.timetableSlotCell}>
                        {slot ? (
                          <>
                            <Text style={styles.timetableSubject}>{slot.subject_name}</Text>
                            <Text style={styles.timetableMeta}>{slot.class_name}-{slot.section_name}</Text>
                          </>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        {/* Leave Summary */}
        <PdfSectionTitle title="Leave Record" />
        <View style={styles.pillsRow}>
          <View style={[styles.pill, { backgroundColor: BADGE_GREEN_BG }]}>
            <Text style={[styles.pillValue, { color: BADGE_GREEN_FG }]}>{leaveSummary.approved}</Text>
            <Text style={[styles.pillLabel, { color: BADGE_GREEN_FG }]}>Approved</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: BADGE_AMBER_BG }]}>
            <Text style={[styles.pillValue, { color: BADGE_AMBER_FG }]}>{leaveSummary.pending}</Text>
            <Text style={[styles.pillLabel, { color: BADGE_AMBER_FG }]}>Pending</Text>
          </View>
          <View style={[styles.pill, { backgroundColor: BADGE_RED_BG }]}>
            <Text style={[styles.pillValue, { color: BADGE_RED_FG }]}>{leaveSummary.rejected}</Text>
            <Text style={[styles.pillLabel, { color: BADGE_RED_FG }]}>Rejected</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableHeader, { backgroundColor: MUTED }]}>
            <Text style={[styles.tableHeaderCell, { width: '80pt' }]}>Applied</Text>
            <Text style={[styles.tableHeaderCell, { width: '80pt' }]}>Type</Text>
            <Text style={[styles.tableHeaderCell, { width: '70pt' }]}>From</Text>
            <Text style={[styles.tableHeaderCell, { width: '70pt' }]}>To</Text>
            <Text style={[styles.tableHeaderCell, { width: '40pt' }]}>Days</Text>
            <Text style={[styles.tableHeaderCell, { width: '70pt' }]}>Status</Text>
          </View>
          {leaves.length === 0 ? (
            <Text style={{ fontSize: 9, color: MUTED, padding: 10, textAlign: 'center' }}>No leave applications on record.</Text>
          ) : (
            leaves.slice(0, 10).map((l, index) => (
              <View key={l.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '80pt' }]}>{fmt(l.created_at)}</Text>
                <Text style={[styles.tableCell, { width: '80pt' }]}>{l.leave_type.replace(/_/g, ' ').toUpperCase()}</Text>
                <Text style={[styles.tableCell, { width: '70pt' }]}>{fmt(l.from_date)}</Text>
                <Text style={[styles.tableCell, { width: '70pt' }]}>{fmt(l.to_date)}</Text>
                <Text style={[styles.tableCell, { width: '40pt' }]}>{l.days_count}</Text>
                <View style={{ width: '70pt' }}>
                  <Text style={[
                    styles.typeBadge,
                    l.status === 'approved' ? { backgroundColor: BADGE_GREEN_BG, color: BADGE_GREEN_FG } :
                    l.status === 'pending' ? { backgroundColor: BADGE_AMBER_BG, color: BADGE_AMBER_FG } :
                    { backgroundColor: BADGE_RED_BG, color: BADGE_RED_FG }
                  ]}>
                    {l.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Signature Block */}
        <View style={styles.signatureBlock}>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Teacher Signature</Text>
          </View>
          <View>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Principal / Admin</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: MUTED, marginTop: 15 }}>Date: ___________________</Text>

        <PdfFooter />
      </Page>
    </Document>
  );
};
