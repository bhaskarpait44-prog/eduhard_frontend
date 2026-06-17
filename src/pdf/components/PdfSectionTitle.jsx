import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const BRAND = '#4F46E5';

const styles = StyleSheet.create({
  sectionTitleContainer: {
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: BRAND,
    paddingBottom: 2,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
});

const PdfSectionTitle = ({ title }) => (
  <View style={styles.sectionTitleContainer}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

export default PdfSectionTitle;
