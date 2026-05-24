import { Text, View, StyleSheet } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles, formatDate } from './BaseCertificate';

const styles = StyleSheet.create({
  accentBox: {
    ...commonStyles.extraDataBox,
    marginTop: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  }
});

const SportsCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate 
      title="Sports / Achievement Certificate" 
      data={data} 
      accentOverride="#f59e0b"
    >
      <Text style={{ textAlign: 'center', fontSize: 16, marginBottom: 15, color: '#f59e0b', fontWeight: 'bold' }}>
        Certificate of Achievement
      </Text>
      
      <Text style={{ textAlign: 'center' }}>
        This certificate is proudly awarded to
      </Text>
      
      <Text style={{ textAlign: 'center', fontSize: 18, marginVertical: 10, fontWeight: 'bold' }}>
        {recipient.name}
      </Text>
      
      <Text style={{ textAlign: 'center' }}>
        ward of {recipient.father_name}, of Class {recipient.class_name} for outstanding 
        achievement in {extra_data.event_name} held on {formatDate(extra_data.event_date)}.
      </Text>

      <Text style={{ textAlign: 'center', marginTop: 10 }}>
        The student secured {extra_data.position} position / achieved {extra_data.achievement}.
      </Text>

      <View style={styles.accentBox}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Event Name</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.event_name}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Event Date</Text>
          <Text style={commonStyles.extraDataValue}>: {formatDate(extra_data.event_date)}</Text>
        </View>

        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Position</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.position}</Text>
        </View>
      </View>
    </BaseCertificate>
  );
};

export default SportsCertificatePDF;
