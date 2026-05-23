import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles } from './BaseCertificate';

const MarksheetCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Mark Sheet / Result Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, Admission No. {recipient.admission_no}, 
        appeared in the {extra_data.exam_name} examination for the academic 
        session {extra_data.session} and has passed successfully.
      </Text>

      <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Examination</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.exam_name}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Session</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.session}</Text>
        </View>
      </View>
      
      <Text style={{ marginTop: 20, fontSize: 10, color: '#64748b' }}>
        Detailed subject-wise marks are available in the official result records of the institution.
      </Text>
    </BaseCertificate>
  );
};

export default MarksheetCertificatePDF;
