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
    fontSize: 11,
    fontWeight: 'bold',
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
  },
  statLabel: {
    fontSize: 7.5,
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
    height: 22,
    alignItems: 'center',
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
    minHeight: 25,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tableRowEven: {
    backgroundColor: WHITE,
  },
  tableRowOdd: {
    backgroundColor: LIGHT,
  },
  tableCell: {
    fontSize: 8,
    color: DARK,
  },
  statusText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 10,
    color: MUTED,
    marginTop: 50,
  },
  // Column Widths Daily
  colDailyNo: { width: '30pt', textAlign: 'center' },
  colDailyName: { width: '185pt' },
  colDailyStatus: { width: '80pt' },
  colDailyRemarks: { width: '240pt' },
  // Column Widths Monthly
  colMonthNo: { width: '30pt', textAlign: 'center' },
  colMonthName: { width: '220pt' },
  colMonthStats: { width: '285pt', flexDirection: 'row', gap: 12 },
});

export const StaffAttendancePDF = ({ mode, data, school, dateStr, monthName, year }) => {
  if (mode === 'daily') {
    const present = data.filter(d => d.status === 'present').length;
    const absent = data.filter(d => d.status === 'absent').length;
    const late = data.filter(d => d.status === 'late').length;
    const halfDay = data.filter(d => d.status === 'half_day').length;
    const leave = data.filter(d => d.status === 'leave').length;

    const getStatusColor = (status) => {
      if (status === 'present') return '#16A34A';
      if (status === 'absent') return '#DC2626';
      if (status === 'late') return '#D97706';
      if (status === 'half_day') return '#2563EB';
      return '#7C3AED'; // leave
    };

    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <SchoolPdfHeader 
            school={school} 
            title="Daily Staff Attendance Report" 
            subtitle={`Date: ${dateStr}  ·  Total: ${data.length} staff members`} 
          />

          <View style={styles.statsBar}>
            <View style={styles.statPill}>
              <Text style={styles.statValue}>{data.length}</Text>
              <Text style={styles.statLabel}>Total Staff</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: '#DC2626' }]}>{absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: '#D97706' }]}>{late}</Text>
              <Text style={styles.statLabel}>Late</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: '#2563EB' }]}>{halfDay}</Text>
              <Text style={styles.statLabel}>Half Day</Text>
            </View>
            <View style={styles.statPill}>
              <Text style={[styles.statValue, { color: '#7C3AED' }]}>{leave}</Text>
              <Text style={styles.statLabel}>Leave</Text>
            </View>
          </View>

          {data.length === 0 ? (
            <Text style={styles.emptyState}>No staff records found for this date.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.colDailyNo}>
                  <Text style={styles.tableHeaderCell}>#</Text>
                </View>
                <View style={styles.colDailyName}>
                  <Text style={styles.tableHeaderCell}>Staff Member</Text>
                </View>
                <View style={styles.colDailyStatus}>
                  <Text style={styles.tableHeaderCell}>Status</Text>
                </View>
                <View style={styles.colDailyRemarks}>
                  <Text style={styles.tableHeaderCell}>Remarks</Text>
                </View>
              </View>

              {data.map((item, idx) => {
                const isEven = idx % 2 === 0;
                const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd];

                return (
                  <View key={`${item.type}-${item.staff_id}`} style={rowStyle} wrap={false}>
                    <View style={styles.colDailyNo}>
                      <Text style={styles.tableCell}>{idx + 1}</Text>
                    </View>
                    <View style={styles.colDailyName}>
                      <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{item.name}</Text>
                      <Text style={[styles.tableCell, { fontSize: 7, color: MUTED }]}>
                        {item.employee_id}  ·  {item.designation}
                      </Text>
                    </View>
                    <View style={styles.colDailyStatus}>
                      <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {item.status ? item.status.replace('_', ' ').toUpperCase() : 'PRESENT'}
                      </Text>
                    </View>
                    <View style={styles.colDailyRemarks}>
                      <Text style={styles.tableCell}>{item.remarks || '—'}</Text>
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
  }

  // Monthly mode
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SchoolPdfHeader 
          school={school} 
          title="Monthly Attendance Register Summary" 
          subtitle={`Month: ${monthName} ${year}  ·  Total: ${data.length} staff members`} 
        />

        {data.length === 0 ? (
          <Text style={styles.emptyState}>No monthly register records found.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colMonthNo}>
                <Text style={styles.tableHeaderCell}>#</Text>
              </View>
              <View style={styles.colMonthName}>
                <Text style={styles.tableHeaderCell}>Staff Member</Text>
              </View>
              <View style={styles.colMonthStats}>
                <Text style={[styles.tableHeaderCell, { width: '45pt', textAlign: 'center' }]}>Present</Text>
                <Text style={[styles.tableHeaderCell, { width: '45pt', textAlign: 'center' }]}>Absent</Text>
                <Text style={[styles.tableHeaderCell, { width: '45pt', textAlign: 'center' }]}>Late</Text>
                <Text style={[styles.tableHeaderCell, { width: '45pt', textAlign: 'center' }]}>Half Day</Text>
                <Text style={[styles.tableHeaderCell, { width: '45pt', textAlign: 'center' }]}>Leave</Text>
                <Text style={[styles.tableHeaderCell, { width: '50pt', textAlign: 'center' }]}>Attendance %</Text>
              </View>
            </View>

            {data.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd];
              
              const totalDays = item.present + item.absent + item.late + item.half_day + item.leave;
              const attendancePct = totalDays > 0 
                ? Math.round(((item.present + item.late + (item.half_day * 0.5)) / totalDays) * 100) 
                : 0;

              return (
                <View key={`${item.type}-${item.staff_id}`} style={rowStyle} wrap={false}>
                  <View style={styles.colMonthNo}>
                    <Text style={styles.tableCell}>{idx + 1}</Text>
                  </View>
                  <View style={styles.colMonthName}>
                    <Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>{item.name}</Text>
                    <Text style={[styles.tableCell, { fontSize: 7, color: MUTED }]}>
                      {item.employee_id}  ·  {item.designation}
                    </Text>
                  </View>
                  <View style={styles.colMonthStats}>
                    <Text style={[styles.tableCell, { width: '45pt', textAlign: 'center', color: '#16A34A', fontFamily: 'Helvetica-Bold' }]}>
                      {item.present}
                    </Text>
                    <Text style={[styles.tableCell, { width: '45pt', textAlign: 'center', color: '#DC2626', fontFamily: 'Helvetica-Bold' }]}>
                      {item.absent}
                    </Text>
                    <Text style={[styles.tableCell, { width: '45pt', textAlign: 'center', color: '#D97706', fontFamily: 'Helvetica-Bold' }]}>
                      {item.late}
                    </Text>
                    <Text style={[styles.tableCell, { width: '45pt', textAlign: 'center', color: '#2563EB', fontFamily: 'Helvetica-Bold' }]}>
                      {item.half_day}
                    </Text>
                    <Text style={[styles.tableCell, { width: '45pt', textAlign: 'center', color: '#7C3AED', fontFamily: 'Helvetica-Bold' }]}>
                      {item.leave}
                    </Text>
                    <Text style={[styles.tableCell, { width: '50pt', textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                      {attendancePct}%
                    </Text>
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
