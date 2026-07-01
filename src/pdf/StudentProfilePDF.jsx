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
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 4,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: '148pt',
    marginBottom: 8,
  },
  label: {
    fontSize: 7.5,
    color: MUTED,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 2,
  },
  value: {
    fontSize: 9,
    color: DARK,
  },
  addressBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
    marginTop: 5,
  },
  addressCol: {
    flex: 1,
    backgroundColor: LIGHT,
    borderRadius: 4,
    padding: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  addressTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: BRAND,
    marginBottom: 4,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND,
    height: 20,
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
    minHeight: 22,
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 8,
    color: DARK,
  },
  colParticular: { width: '100pt' },
  colMother: { width: '140pt' },
  colFather: { width: '140pt' },
  colGuardian: { width: '140pt' },
});

export const StudentProfilePDF = ({ student, school }) => {
  const enrollment = student?.current_enrollment || {};
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SchoolPdfHeader 
          school={school} 
          title="Student Profile Report" 
          subtitle={`Admission No: ${student.admission_no || 'N/A'}  ·  Class: ${enrollment.class || 'N/A'}`} 
        />

        {/* 01. Identity & Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>01. Identity & Basic Info</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.value}>{`${student.first_name || ''} ${student.last_name || ''}`.toUpperCase().trim() || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.value}>{student.gender || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Date of Birth</Text>
              <Text style={styles.value}>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-IN') : 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Aadhaar Card No</Text>
              <Text style={styles.value}>{student.aadhar_no || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Blood Group</Text>
              <Text style={styles.value}>{student.blood_group || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Religion</Text>
              <Text style={styles.value}>{student.religion || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Caste / Category</Text>
              <Text style={styles.value}>{student.caste || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Nationality</Text>
              <Text style={styles.value}>{student.nationality || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Mother Tongue</Text>
              <Text style={styles.value}>{student.mother_tongue || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Identification Marks</Text>
              <Text style={styles.value}>{student.identification_marks || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Pen No</Text>
              <Text style={styles.value}>{student.pen_no || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>APAAR ID</Text>
              <Text style={styles.value}>{student.apaar_id || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* 02. Current Enrollment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>02. Current Enrollment</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Class & Section</Text>
              <Text style={styles.value}>{`${enrollment.class || 'N/A'} - ${enrollment.section || 'N/A'}`}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Roll Number</Text>
              <Text style={styles.value}>{enrollment.roll_number || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Stream</Text>
              <Text style={styles.value}>{enrollment.stream || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Medium</Text>
              <Text style={styles.value}>{student.medium || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Joining Type</Text>
              <Text style={styles.value}>{enrollment.joining_type || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Hostel Required</Text>
              <Text style={styles.value}>{student.is_hostel ? 'Yes' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Distance from School</Text>
              <Text style={styles.value}>{student.distance_km ? `${student.distance_km} km` : 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Prev. Year Attendance</Text>
              <Text style={styles.value}>{student.prev_attendance_days ? `${student.prev_attendance_days} days` : 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* 03. Contact & Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>03. Contact & Address</Text>
          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Student Phone Number</Text>
              <Text style={styles.value}>{student.phone || 'N/A'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.label}>Student Email</Text>
              <Text style={styles.value}>{student.email || 'N/A'}</Text>
            </View>
          </View>
          <View style={styles.addressBox}>
            <View style={styles.addressCol}>
              <Text style={styles.addressTitle}>Current Address</Text>
              <Text style={styles.value}>{student.address || 'N/A'}</Text>
              <Text style={[styles.value, { marginTop: 2, fontSize: 8, color: MUTED }]}>
                {`P.S: ${student.police_station || 'N/A'}  ·  P.O: ${student.post_office || 'N/A'}`}
              </Text>
              <Text style={[styles.value, { fontSize: 8, color: MUTED }]}>
                {`${student.city || ''}, ${student.state || ''} - ${student.pincode || ''}`}
              </Text>
            </View>
            <View style={styles.addressCol}>
              <Text style={styles.addressTitle}>Permanent Address</Text>
              {student.is_permanent_same ? (
                <Text style={[styles.value, { color: MUTED, fontSize: 8.5, fontStyle: 'italic' }]}>Same as Current Address</Text>
              ) : (
                <>
                  <Text style={styles.value}>{student.perm_address || 'N/A'}</Text>
                  <Text style={[styles.value, { marginTop: 2, fontSize: 8, color: MUTED }]}>
                    {`P.S: ${student.perm_police_station || 'N/A'}  ·  P.O: ${student.perm_post_office || 'N/A'}`}
                  </Text>
                  <Text style={[styles.value, { fontSize: 8, color: MUTED }]}>
                    {`${student.perm_city || ''}, ${student.perm_state || ''} - ${student.perm_pincode || ''}`}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* 04. Parents' / Guardian's Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>04. Parents' / Guardian's Profile</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={styles.colParticular}><Text style={styles.tableHeaderCell}>Particular</Text></View>
              <View style={styles.colMother}><Text style={styles.tableHeaderCell}>Mother</Text></View>
              <View style={styles.colFather}><Text style={styles.tableHeaderCell}>Father</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableHeaderCell}>Guardian</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Name</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_name || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.father_name || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>{student.guardian_name || 'N/A'}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Phone No</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_phone || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.father_phone || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>{student.guardian_phone || 'N/A'}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Email</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_email || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.parent_email || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>{student.guardian_email || 'N/A'}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Aadhaar No</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_aadhar || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.father_aadhar || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>{student.guardian_aadhar || 'N/A'}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Occupation</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_occupation || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.father_occupation || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>{student.guardian_occupation || 'N/A'}</Text></View>
            </View>
            <View style={styles.tableRow}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Qualification</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_qualification || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.father_qualification || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>{student.guardian_qualification || 'N/A'}</Text></View>
            </View>
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={styles.colParticular}><Text style={[styles.tableCell, { fontFamily: 'Helvetica-Bold' }]}>Annual Income</Text></View>
              <View style={styles.colMother}><Text style={styles.tableCell}>{student.mother_annual_income || 'N/A'}</Text></View>
              <View style={styles.colFather}><Text style={styles.tableCell}>{student.father_annual_income || 'N/A'}</Text></View>
              <View style={styles.colGuardian}><Text style={styles.tableCell}>N/A</Text></View>
            </View>
          </View>
        </View>

        <PdfFooter />
      </Page>
    </Document>
  );
};
