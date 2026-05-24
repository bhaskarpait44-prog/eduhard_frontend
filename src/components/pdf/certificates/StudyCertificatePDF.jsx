import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles } from './BaseCertificate';

const StudyCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Study Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, ward of {recipient.father_name}, 
        bearing Admission No. {recipient.admission_no}, is studying in Class {extra_data.class || recipient.class_name} 
        in the academic year {extra_data.year}.
      </Text>
      
      <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Purpose</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.scheme_name}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Academic Year</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.year}</Text>
        </View>
      </View>
      
      <Text style={{ marginTop: 20 }}>
        This certificate is issued for the purpose of {extra_data.scheme_name}.
      </Text>
    </BaseCertificate>
  );
};

export default StudyCertificatePDF;
