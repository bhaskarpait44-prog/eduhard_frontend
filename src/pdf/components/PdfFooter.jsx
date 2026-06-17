import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const MUTED = '#6B7280';
const BORDER = '#E5E7EB';

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: MUTED,
    fontFamily: 'Helvetica',
  },
});

const PdfFooter = () => (
  <View style={styles.footer} fixed>
    <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    <Text>EduHard School Management</Text>
  </View>
);

export default PdfFooter;
