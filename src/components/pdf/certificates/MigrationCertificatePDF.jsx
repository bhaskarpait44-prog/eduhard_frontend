import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles } from './BaseCertificate';

const MigrationCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Migration Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, ward of {recipient.father_name}, 
        bearing Admission No. {recipient.admission_no}, was a student of this school 
        affiliated with {extra_data.from_board}.
      </Text>
      
      <Text style={{ marginTop: 10 }}>
        The student is migrating to {extra_data.to_board}. The last examination was passed 
        in the year {extra_data.last_exam_year}.
      </Text>

      <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>From Board</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.from_board}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>To Board</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.to_board}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Exam Year</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.last_exam_year}</Text>
        </View>
      </View>
    </BaseCertificate>
  );
};

export default MigrationCertificatePDF;
