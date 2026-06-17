import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';

const BRAND = '#4F46E5';
const DARK = '#111827';
const MUTED = '#6B7280';

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    borderBottomStyle: 'solid',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  logoFallback: {
    width: 48,
    height: 48,
    backgroundColor: BRAND,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  schoolInfo: {
    flexDirection: 'column',
  },
  schoolName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: DARK,
    fontFamily: 'Helvetica-Bold',
  },
  schoolAddress: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    fontFamily: 'Helvetica',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 12,
    fontWeight: 'bold',
    color: BRAND,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
    fontFamily: 'Helvetica',
  },
  dateLine: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    fontFamily: 'Helvetica',
  },
});

const SchoolPdfHeader = ({ school, title, subtitle }) => {
  const date = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const initials = school?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        {school?.logo_url ? (
          <Image src={school.logo_url} style={styles.logo} />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.logoFallbackText}>{initials}</Text>
          </View>
        )}
        <View style={styles.schoolInfo}>
          <Text style={styles.schoolName}>{school?.name || 'School Name'}</Text>
          <Text style={styles.schoolAddress}>
            {[
              school?.branch_name,
              school?.address,
              school?.phone,
              school?.email
            ].filter(Boolean).join('  ·  ')}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.dateLine}>Generated: {date}</Text>
      </View>
    </View>
  );
};

export default SchoolPdfHeader;
