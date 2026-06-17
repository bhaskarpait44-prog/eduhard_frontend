import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import SchoolPdfHeader from './components/SchoolPdfHeader';
import PdfFooter from './components/PdfFooter';

const BRAND = '#4F46E5';
const DARK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const LIGHT = '#F9FAFB';
const WHITE = '#FFFFFF';
const BADGE_GREEN_BG = '#DCFCE7';
const BADGE_GREEN_FG = '#15803D';
const BADGE_GREY_BG = '#F3F4F6';
const BADGE_GREY_FG = '#6B7280';

const AVATAR_COLORS = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DC2626', '#7C3AED'];
const getAvatarColor = (name = '') => {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  statsBar: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    marginBottom: 15,
  },
  statPill: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 4,
    padding: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
  },
  statLabel: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    height: 22,
    alignItems: 'center',
    paddingHorizontal: 4,
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
    minHeight: 25,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableRowEven: {
    backgroundColor: WHITE,
  },
  tableRowOdd: {
    backgroundColor: LIGHT,
  },
  tableCell: {
    fontSize: 8.5,
    color: DARK,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: WHITE,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 7,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 10,
    color: MUTED,
    marginTop: 50,
  },
  // Column Widths
  colNo: { width: '25pt', textAlign: 'center' },
  colAvatar: { width: '30pt', alignItems: 'center' },
  colName: { width: '140pt' },
  colEmpId: { width: '75pt' },
  colDept: { width: '100pt' },
  colDesig: { width: '110pt' },
  colEmail: { width: '155pt' },
  colPhone: { width: '85pt' },
  colStatus: { width: '62pt', alignItems: 'center' },
});

export const TeacherListPDF = ({ teachers, school, session }) => {
  const activeCount = teachers.filter(t => t.is_active).length;
  const inactiveCount = teachers.length - activeCount;
  const deptCount = new Set(teachers.map(t => t.department).filter(Boolean)).size;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <SchoolPdfHeader 
          school={school} 
          title="Teacher Directory" 
          subtitle={`Session: ${session?.name || 'N/A'}  ·  Total: ${teachers.length} teachers`} 
        />

        <View style={styles.statsBar}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{teachers.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{deptCount}</Text>
            <Text style={styles.statLabel}>Departments</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{inactiveCount}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
            <Text style={[styles.tableHeaderCell, styles.colAvatar]}> </Text>
            <Text style={[styles.tableHeaderCell, styles.colName]}>Teacher Name</Text>
            <Text style={[styles.tableHeaderCell, styles.colEmpId]}>Employee ID</Text>
            <Text style={[styles.tableHeaderCell, styles.colDept]}>Department</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesig]}>Designation</Text>
            <Text style={[styles.tableHeaderCell, styles.colEmail]}>Email</Text>
            <Text style={[styles.tableHeaderCell, styles.colPhone]}>Phone</Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
          </View>

          {teachers.length === 0 ? (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1, textAlign: 'center', marginTop: 20 }]}>No teachers found.</Text>
            </View>
          ) : (
            teachers.map((teacher, index) => {
              const initials = teacher.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return (
                <View key={teacher.id} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowOdd : styles.tableRowEven]}>
                  <Text style={[styles.tableCell, styles.colNo]}>{index + 1}</Text>
                  <View style={[styles.colAvatar]}>
                    <View style={[styles.avatarContainer, { backgroundColor: getAvatarColor(teacher.name) }]}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, styles.colName]}>{teacher.name || '—'}</Text>
                  <Text style={[styles.tableCell, styles.colEmpId]}>{teacher.employee_id || '—'}</Text>
                  <Text style={[styles.tableCell, styles.colDept]}>{teacher.department || '—'}</Text>
                  <Text style={[styles.tableCell, styles.colDesig]}>{teacher.designation || '—'}</Text>
                  <Text style={[styles.tableCell, styles.colEmail]}>{teacher.email || '—'}</Text>
                  <Text style={[styles.tableCell, styles.colPhone]}>{teacher.phone || '—'}</Text>
                  <View style={styles.colStatus}>
                    <Text style={[
                      styles.statusBadge, 
                      teacher.is_active 
                        ? { backgroundColor: BADGE_GREEN_BG, color: BADGE_GREEN_FG }
                        : { backgroundColor: BADGE_GREY_BG, color: BADGE_GREY_FG }
                    ]}>
                      {teacher.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
};
