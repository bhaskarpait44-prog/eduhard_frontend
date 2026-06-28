import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import SchoolPdfHeader from './components/SchoolPdfHeader';
import PdfFooter from './components/PdfFooter';

const BRAND = '#0F766E';
const DARK = '#111827';
const MUTED = '#6B7280';
const BORDER = '#E5E7EB';
const LIGHT = '#F9FAFB';
const WHITE = '#FFFFFF';

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
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    minHeight: 24,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 8.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    minHeight: 35,
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 6,
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
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 0.2,
    borderBottomColor: BORDER,
  },
  subjectRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  subjectText: {
    fontSize: 8,
    color: DARK,
    fontFamily: 'Helvetica-Bold',
  },
  teacherText: {
    fontSize: 8,
    color: MUTED,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 10,
    color: MUTED,
    marginTop: 50,
  },
  // Column Widths
  colClass: { width: '130pt' },
  colClassTeacher: { width: '130pt' },
  colSubjects: { width: '275pt' },
});

export const TeacherAssignmentListPDF = ({ groups, school, session }) => {
  const totalClasses = groups.length;
  let totalAssignments = 0;
  groups.forEach((g) => {
    if (g.classTeacher) totalAssignments++;
    totalAssignments += g.subjectTeachers.length;
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SchoolPdfHeader 
          school={school} 
          title="Teacher Assignments Report" 
          subtitle={`Session: ${session?.name || 'N/A'}  ·  Total: ${totalClasses} classes/sections`} 
        />

        <View style={styles.statsBar}>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{totalClasses}</Text>
            <Text style={styles.statLabel}>Classes & Sections</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statValue}>{totalAssignments}</Text>
            <Text style={styles.statLabel}>Total Assignments</Text>
          </View>
        </View>

        {groups.length === 0 ? (
          <Text style={styles.emptyState}>No teaching assignments match the selected filters.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colClass}>
                <Text style={styles.tableHeaderCell}>Class & Section</Text>
              </View>
              <View style={styles.colClassTeacher}>
                <Text style={styles.tableHeaderCell}>Class Teacher</Text>
              </View>
              <View style={styles.colSubjects}>
                <Text style={styles.tableHeaderCell}>Subject Teacher Assignments</Text>
              </View>
            </View>

            {groups.map((group, idx) => {
              const isEven = idx % 2 === 0;
              const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd];

              return (
                <View key={group.key} style={rowStyle} wrap={false}>
                  <View style={styles.colClass}>
                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>
                      {group.class_name}
                      {group.class_stream ? ` (${group.class_stream.toUpperCase()})` : ''}
                      {` — ${group.section_name}`}
                    </Text>
                  </View>
                  <View style={styles.colClassTeacher}>
                    <Text style={styles.tableCell}>
                      {group.classTeacher ? group.classTeacher.teacher_name : 'Not Assigned'}
                    </Text>
                  </View>
                  <View style={styles.colSubjects}>
                    {group.subjectTeachers.length === 0 ? (
                      <Text style={[styles.tableCell, { color: MUTED, fontStyle: 'italic' }]}>No subjects assigned</Text>
                    ) : (
                      group.subjectTeachers.map((st, sIdx) => {
                        const isLast = sIdx === group.subjectTeachers.length - 1;
                        return (
                          <View key={st.id} style={isLast ? styles.subjectRowLast : styles.subjectRow}>
                            <Text style={styles.subjectText}>{st.subject_name}</Text>
                            <Text style={styles.teacherText}>{st.teacher_name}</Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <PdfFooter />
      </Page>
    </Document>
  );
};
