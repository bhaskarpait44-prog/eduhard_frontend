import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles } from './BaseCertificate';

const CharacterCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Character Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, ward of {recipient.father_name}, 
        bearing Admission No. {recipient.admission_no}, was a student of this institution.
      </Text>
      
      <Text style={{ marginTop: 10 }}>
        During the period of study, the student maintained {extra_data.conduct_grade} conduct and behavior.
      </Text>

      {extra_data.remarks && (
        <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
          <View style={commonStyles.extraDataRow}>
            <Text style={commonStyles.extraDataLabel}>Remarks</Text>
            <Text style={commonStyles.extraDataValue}>: {extra_data.remarks}</Text>
          </View>
        </View>
      )}
    </BaseCertificate>
  );
};

export default CharacterCertificatePDF;
