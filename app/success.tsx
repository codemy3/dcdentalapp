import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SuccessScreen() {
  const router = useRouter();

  return (
    <View style={styles.successContainer}>
      <View style={styles.successCard}>
        <View style={styles.iconCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
        
        <Text style={styles.successTitle}>Appointment Request Sent!</Text>
        
        <Text style={styles.successMessage}>
          Thank you for choosing Discovery Coast Dental & Medical Centre.
        </Text>
        
        <Text style={styles.successDesc}>
          We have received your appointment request and will contact you within 24 hours to confirm your booking.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            📧 Check your email for confirmation details
          </Text>
          <Text style={styles.infoText}>
            📞 Call us at (07) 4974 9006 for urgent matters
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.buttonText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push('/appointment')}
        >
          <Text style={styles.secondaryButtonText}>Book Another Appointment</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  successContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  successCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#10b981', // Success green
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successIcon: { 
    fontSize: 50,
    color: '#fff',
    fontWeight: 'bold',
  },
  successTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#0a2540', // Dark Navy
    marginBottom: 12, 
    textAlign: 'center' 
  },
  successMessage: { 
    fontSize: 16, 
    color: '#005a9c', // Royal Blue
    textAlign: 'center', 
    marginBottom: 16,
    fontWeight: '600',
  },
  successDesc: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#005a9c', // Royal Blue
  },
  infoText: {
    fontSize: 13,
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  primaryButton: { 
    backgroundColor: '#ff6b35', // Bright Orange
    padding: 16,
    paddingHorizontal: 40, 
    borderRadius: 12, 
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    borderWidth: 2,
    borderColor: '#005a9c', // Royal Blue
  },
  secondaryButtonText: {
    color: '#005a9c', // Royal Blue
    fontSize: 16,
    fontWeight: 'bold',
  },
});