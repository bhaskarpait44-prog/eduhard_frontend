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

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 15,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    minHeight: 22,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    minHeight: 45,
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
    fontSize: 7.5,
    color: DARK,
    textAlign: 'center',
  },
  periodLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 6,
    color: MUTED,
    marginTop: 1.5,
    textAlign: 'center',
  },
  slotSubject: {
    fontSize: 7.5,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
  },
  slotSubtext: {
    fontSize: 6.5,
    color: MUTED,
    marginTop: 1,
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 10,
    color: MUTED,
    marginTop: 50,
  },
  // Column Widths Grid
  colPeriod: { width: '80pt' },
  colDay: { width: '110pt' },
  // Column Widths List
  colListNo: { width: '25pt', textAlign: 'center' },
  colListDay: { width: '70pt' },
  colListPeriod: { width: '90pt' },
  colListClass: { width: '110pt' },
  colListSubject: { width: '110pt' },
  colListTeacher: { width: '120pt' },
  colListRoom: { width: '55pt', textAlign: 'center' },
});

export const TimetablePDF = ({ mode, slots, periodTimes, school, session, sections, filterClassName, filterTeacherName }) => {
  const isFiltered = filterClassName || filterTeacherName;

  if (mode === 'all_classes' && Array.isArray(sections)) {
    const periods = Object.keys(periodTimes).map(Number).sort((a, b) => a - b);

    return (
      <Document>
        {sections.map((sec) => {
          const classSlots = slots.filter(
            (s) => String(s.class_id) === String(sec.class_id) && String(s.section_id) === String(sec.section_id)
          );
          const filterSubtitle = `Class Timetable: ${sec.class_name}${sec.class_stream ? ` (${sec.class_stream.toUpperCase()})` : ''} - Section ${sec.section_name}`;

          return (
            <Page key={`${sec.class_id}-${sec.section_id}`} size="A4" orientation="landscape" style={styles.page}>
              <SchoolPdfHeader 
                school={school} 
                title="Weekly Timetable" 
                subtitle={`Session: ${session?.name || 'N/A'}  ·  ${filterSubtitle}`} 
              />

              {classSlots.length === 0 ? (
                <Text style={styles.emptyState}>No timetable slots scheduled for this section.</Text>
              ) : (
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <View style={styles.colPeriod}>
                      <Text style={styles.tableHeaderCell}>Period</Text>
                    </View>
                    {DAYS.map((day) => (
                      <View key={day} style={styles.colDay}>
                        <Text style={styles.tableHeaderCell}>{DAY_LABELS[day]}</Text>
                      </View>
                    ))}
                  </View>

                  {periods.map((p, idx) => {
                    const isEven = idx % 2 === 0;
                    const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd];
                    const time = periodTimes[p] || { start: '—', end: '—' };

                    return (
                      <View key={p} style={rowStyle} wrap={false}>
                        <View style={styles.colPeriod}>
                          <Text style={styles.periodLabel}>Period {p}</Text>
                          <Text style={styles.timeLabel}>{time.start} – {time.end}</Text>
                        </View>
                        {DAYS.map((day) => {
                          const daySlots = classSlots.filter(s => s.day_of_week === day && Number(s.period_number) === p);
                          return (
                            <View key={day} style={styles.colDay}>
                              {daySlots.map((slot) => (
                                <View key={slot.id} style={{ marginVertical: 2 }}>
                                  <Text style={styles.slotSubject}>{slot.subject_name}</Text>
                                  <Text style={styles.slotSubtext}>{slot.teacher_name}</Text>
                                  {slot.room_number && (
                                    <Text style={[styles.slotSubtext, { fontSize: 6 }]}>Room {slot.room_number}</Text>
                                  )}
                                </View>
                              ))}
                            </View>
                          );
                        })}
                      </View>
                    );
                  })}
                </View>
              )}

              <PdfFooter />
            </Page>
          );
        })}
      </Document>
    );
  }

  if (isFiltered) {
    const periods = Object.keys(periodTimes).map(Number).sort((a, b) => a - b);
    let filterSubtitle = 'Weekly Schedule';
    if (filterClassName) filterSubtitle = `Class Timetable: ${filterClassName}`;
    else if (filterTeacherName) filterSubtitle = `Teacher Timetable: ${filterTeacherName}`;

    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <SchoolPdfHeader 
            school={school} 
            title="Weekly Timetable" 
            subtitle={`Session: ${session?.name || 'N/A'}  ·  ${filterSubtitle}`} 
          />

          {slots.length === 0 ? (
            <Text style={styles.emptyState}>No timetable slots scheduled.</Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.colPeriod}>
                  <Text style={styles.tableHeaderCell}>Period</Text>
                </View>
                {DAYS.map((day) => (
                  <View key={day} style={styles.colDay}>
                    <Text style={styles.tableHeaderCell}>{DAY_LABELS[day]}</Text>
                  </View>
                ))}
              </View>

              {periods.map((p, idx) => {
                const isEven = idx % 2 === 0;
                const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd];
                const time = periodTimes[p] || { start: '—', end: '—' };

                return (
                  <View key={p} style={rowStyle} wrap={false}>
                    <View style={styles.colPeriod}>
                      <Text style={styles.periodLabel}>Period {p}</Text>
                      <Text style={styles.timeLabel}>{time.start} – {time.end}</Text>
                    </View>
                    {DAYS.map((day) => {
                      const daySlots = slots.filter(s => s.day_of_week === day && Number(s.period_number) === p);
                      return (
                        <View key={day} style={styles.colDay}>
                          {daySlots.map((slot) => (
                            <View key={slot.id} style={{ marginVertical: 2 }}>
                              <Text style={styles.slotSubject}>{slot.subject_name}</Text>
                              {filterTeacherName ? (
                                <Text style={styles.slotSubtext}>
                                  {slot.class_name} ({slot.section_name})
                                </Text>
                              ) : (
                                <Text style={styles.slotSubtext}>{slot.teacher_name}</Text>
                              )}
                              {slot.room_number && (
                                <Text style={[styles.slotSubtext, { fontSize: 6 }]}>Room {slot.room_number}</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      );
                    })}
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

  // Unfiltered mode (List View)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SchoolPdfHeader 
          school={school} 
          title="Timetable Master Schedule" 
          subtitle={`Session: ${session?.name || 'N/A'}  ·  Total: ${slots.length} periods`} 
        />

        {slots.length === 0 ? (
          <Text style={styles.emptyState}>No timetable slots scheduled.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colListNo}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>#</Text>
              </View>
              <View style={styles.colListDay}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>Day</Text>
              </View>
              <View style={styles.colListPeriod}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>Period & Time</Text>
              </View>
              <View style={styles.colListClass}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>Class</Text>
              </View>
              <View style={styles.colListSubject}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>Subject</Text>
              </View>
              <View style={styles.colListTeacher}>
                <Text style={[styles.tableHeaderCell, { textAlign: 'left' }]}>Teacher</Text>
              </View>
              <View style={styles.colListRoom}>
                <Text style={styles.tableHeaderCell}>Room</Text>
              </View>
            </View>

            {slots.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const rowStyle = [styles.tableRow, isEven ? styles.tableRowEven : styles.tableRowOdd, { minHeight: 25 }];
              const time = periodTimes[item.period_number] || { start: item.start_time?.slice(0, 5), end: item.end_time?.slice(0, 5) };

              return (
                <View key={item.id} style={rowStyle} wrap={false}>
                  <View style={styles.colListNo}>
                    <Text style={[styles.tableCell, { textAlign: 'left' }]}>{idx + 1}</Text>
                  </View>
                  <View style={styles.colListDay}>
                    <Text style={[styles.tableCell, { textAlign: 'left', textTransform: 'capitalize' }]}>
                      {item.day_of_week}
                    </Text>
                  </View>
                  <View style={styles.colListPeriod}>
                    <Text style={[styles.tableCell, { textAlign: 'left', fontFamily: 'Helvetica-Bold' }]}>
                      Period {item.period_number}
                    </Text>
                    <Text style={[styles.tableCell, { textAlign: 'left', fontSize: 6.5, color: MUTED }]}>
                      {time.start} – {time.end}
                    </Text>
                  </View>
                  <View style={styles.colListClass}>
                    <Text style={[styles.tableCell, { textAlign: 'left' }]}>
                      {item.class_name}
                      {item.class_stream ? ` (${item.class_stream.toUpperCase()})` : ''}
                      {` — ${item.section_name}`}
                    </Text>
                  </View>
                  <View style={styles.colListSubject}>
                    <Text style={[styles.tableCell, { textAlign: 'left', fontFamily: 'Helvetica-Bold' }]}>
                      {item.subject_name}
                    </Text>
                  </View>
                  <View style={styles.colListTeacher}>
                    <Text style={[styles.tableCell, { textAlign: 'left' }]}>{item.teacher_name}</Text>
                  </View>
                  <View style={styles.colListRoom}>
                    <Text style={styles.tableCell}>{item.room_number || '—'}</Text>
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
