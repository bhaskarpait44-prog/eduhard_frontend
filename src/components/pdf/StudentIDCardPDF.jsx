import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { getFileUrl } from '@/utils/helpers';

const accentColor = '#4F46E5';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#111827',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '243pt', // 3.375 inches
    height: '153pt', // 2.125 inches
    border: `1.5pt solid ${accentColor}`,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: accentColor,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 10px',
  },
  logo: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#fff',
    marginRight: 6,
  },
  schoolName: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    flex: 1,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  body: {
    padding: 10,
    flexDirection: 'row',
  },
  photoContainer: {
    width: 60,
    height: 75,
    border: '1pt solid #E5E7EB',
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 5,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  studentName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: accentColor,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: 55,
    color: '#6B7280',
    fontSize: 7,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
  },
  sessionLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  idLabel: {
    position: 'absolute',
    top: 40,
    right: 10,
    fontSize: 6,
    color: '#9CA3AF',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});

const StudentIDCardPDF = ({ data }) => {
  const { school_name, logo_url, first_name, last_name, admission_no, class_name, section_name, roll_number, session_name, photo_url } = data;

  return (
    <Document>
      <Page size={[243, 153]} style={styles.page}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            {logo_url && <Image src={getFileUrl(logo_url)} style={styles.logo} />}
            <Text style={styles.schoolName}>{school_name}</Text>
          </View>

          <Text style={styles.idLabel}>Student Identity Card</Text>

          {/* Body */}
          <View style={styles.body}>
            <View style={styles.photoContainer}>
              {photo_url ? (
                <Image src={getFileUrl(photo_url)} style={styles.photo} />
              ) : (
                <Text style={{ fontSize: 6, color: '#94a3b8', textAlign: 'center' }}>No Photo</Text>
              )}
            </View>

            <View style={styles.details}>
              <Text style={styles.studentName}>{first_name} {last_name}</Text>
              
              <View style={styles.row}>
                <Text style={styles.label}>Adm No.</Text>
                <Text style={styles.value}>: {admission_no}</Text>
              </View>
              
              <View style={styles.row}>
                <Text style={styles.label}>Class/Sec</Text>
                <Text style={styles.value}>: {class_name} {section_name ? `(${section_name})` : ''}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.label}>Roll No.</Text>
                <Text style={styles.value}>: {roll_number || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.sessionLabel}>Academic Session: {session_name}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default StudentIDCardPDF;
