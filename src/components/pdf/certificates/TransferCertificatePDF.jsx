import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles, formatDate } from './BaseCertificate';

const TransferCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Transfer Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, ward of {recipient.father_name}, 
        bearing Admission No. {recipient.admission_no}, was a student of this school 
        in Class {recipient.class_name}. The student has left the school on {formatDate(extra_data.leaving_date)} 
        due to {extra_data.reason || 'parental request'}.
      </Text>
      
      <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Last Class</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.last_class}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Conduct</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.conduct}</Text>
        </View>
      </View>
    </BaseCertificate>
  );
};

export default TransferCertificatePDF;
