import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles } from './BaseCertificate';

const BonafideCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Bonafide Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, ward of {recipient.father_name}, 
        bearing Admission No. {recipient.admission_no}, is a bona fide student of this school 
        studying in Class {recipient.class_name}.
      </Text>
      
      <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Purpose</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.purpose}</Text>
        </View>
      </View>
      
      <Text style={{ marginTop: 20 }}>
        This certificate is being issued for the purpose of {extra_data.purpose}.
      </Text>
    </BaseCertificate>
  );
};

export default BonafideCertificatePDF;
