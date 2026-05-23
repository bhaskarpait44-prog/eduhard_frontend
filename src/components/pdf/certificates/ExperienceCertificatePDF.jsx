import { Text, View } from '@react-pdf/renderer';
import BaseCertificate, { commonStyles } from './BaseCertificate';

const ExperienceCertificatePDF = ({ data }) => {
  const { recipient, extra_data } = data;

  return (
    <BaseCertificate title="Experience / Service Certificate" data={data}>
      <Text>
        This is to certify that {recipient.name}, holding Employee ID {recipient.employee_id}, 
        served as {extra_data.designation || recipient.designation} in this institution 
        from {extra_data.join_date} to {extra_data.leaving_date}.
      </Text>
      
      <Text style={{ marginTop: 10 }}>
        During the period of service, the employee demonstrated professionalism and dedication.
        {extra_data.reason ? ` Reason for leaving: ${extra_data.reason}.` : ''}
      </Text>

      <View style={[commonStyles.extraDataBox, { marginTop: 20 }]}>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Designation</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.designation || recipient.designation}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Joining Date</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.join_date}</Text>
        </View>
        <View style={commonStyles.extraDataRow}>
          <Text style={commonStyles.extraDataLabel}>Relieving Date</Text>
          <Text style={commonStyles.extraDataValue}>: {extra_data.leaving_date}</Text>
        </View>
      </View>
    </BaseCertificate>
  );
};

export default ExperienceCertificatePDF;
