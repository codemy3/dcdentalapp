import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface AppointmentConfirmationProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  appointmentDetails: {
    doctorName: string;
    specialization: string;
    service: string;
    date: string;
    time: string;
    patientName: string;
    patientPhone: string;
    patientEmail: string;
  };
}

export function AppointmentConfirmation({
  visible,
  onClose,
  onConfirm,
  appointmentDetails,
}: AppointmentConfirmationProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Confirm Appointment</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>📋 Appointment Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Doctor:</Text>
              <Text style={styles.value}>{appointmentDetails.doctorName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Specialization:</Text>
              <Text style={styles.value}>{appointmentDetails.specialization}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Service:</Text>
              <Text style={styles.value}>{appointmentDetails.service}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Date:</Text>
              <Text style={styles.value}>{appointmentDetails.date}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Time:</Text>
              <Text style={styles.value}>{appointmentDetails.time}</Text>
            </View>

            <Text style={styles.sectionTitle}>👤 Your Information</Text>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>{appointmentDetails.patientName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>{appointmentDetails.patientPhone}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{appointmentDetails.patientEmail}</Text>
            </View>

            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                ℹ️ You will receive a confirmation email once the doctor approves your appointment.
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '95%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 10,
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    maxWidth: '60%',
    textAlign: 'right',
  },
  noteContainer: {
    backgroundColor: '#e7f3ff',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  noteText: {
    fontSize: 13,
    color: '#0066cc',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
