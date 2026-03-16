import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface PrescriptionWriterProps {
  visible: boolean;
  onClose: () => void;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  doctorEmail?: string;
  appointmentId: string;
  onPrescriptionSaved?: () => void;
}

export function PrescriptionWriter({
  visible,
  onClose,
  patientEmail,
  patientName,
  doctorName,
  doctorEmail,
  appointmentId,
  onPrescriptionSaved,
}: PrescriptionWriterProps) {
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      console.log('💊 PrescriptionWriter modal opened');
      console.log('Props received:', {
        patientEmail,
        patientName,
        doctorName,
        doctorEmail: doctorEmail || auth.currentUser?.email || '',
        appointmentId,
        visible,
      });
    }
  }, [visible, patientEmail, patientName, doctorName, doctorEmail, appointmentId]);

  const handleSavePrescription = async () => {
    console.log('💊 handleSavePrescription called');
    console.log('📧 Patient Email:', patientEmail);
    console.log('👤 Patient Name:', patientName);
    console.log('👨‍⚕️ Doctor Name:', doctorName);
    console.log('📧 Doctor Email:', doctorEmail || auth.currentUser?.email || '');
    console.log('🆔 Appointment ID:', appointmentId);

    if (!medication.trim() || !dosage.trim() || !duration.trim()) {
      console.log('❌ Validation failed: Missing required fields');
      Alert.alert('Error', 'Please fill in medication, dosage, and duration');
      return;
    }

    if (!patientEmail || !patientName || !doctorName || !appointmentId) {
      console.log('❌ Missing required props');
      Alert.alert('Error', 'Missing patient or doctor information. Please try again.');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Starting Firestore save...');

      const prescriptionId = `${appointmentId}_${Date.now()}`;
      console.log('🆔 Prescription ID:', prescriptionId);

      const prescriptionData = {
        patientEmail,
        patientName,
        doctorName,
        doctorEmail: (doctorEmail || auth.currentUser?.email || '').trim().toLowerCase(),
        doctorUid: auth.currentUser?.uid || '',
        appointmentId,
        medication: medication.trim(),
        dosage: dosage.trim(),
        duration: duration.trim(),
        instructions: instructions.trim(),
        notes: notes.trim(),
        createdAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
      };

      console.log('📝 Prescription Data:', prescriptionData);

      await setDoc(doc(db, 'prescriptions', prescriptionId), prescriptionData);

      console.log('✅ Prescription saved successfully to Firestore');
      Alert.alert('Success', 'Prescription saved successfully');
      resetForm();
      onPrescriptionSaved?.();
      onClose();
    } catch (error: any) {
      console.error('❌ Error saving prescription:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      Alert.alert('Error', error.message || 'Failed to save prescription');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMedication('');
    setDosage('');
    setDuration('');
    setInstructions('');
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Write Prescription</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Patient: <Text style={styles.infoBold}>{patientName}</Text></Text>
              <Text style={styles.infoLabel}>Doctor: <Text style={styles.infoBold}>{doctorName}</Text></Text>
            </View>

            <Text style={styles.label}>Medication Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Amoxicillin"
              value={medication}
              onChangeText={setMedication}
              editable={!loading}
            />

            <Text style={styles.label}>Dosage *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 500mg"
              value={dosage}
              onChangeText={setDosage}
              editable={!loading}
            />

            <Text style={styles.label}>Duration *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 7 days"
              value={duration}
              onChangeText={setDuration}
              editable={!loading}
            />

            <Text style={styles.label}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="e.g., Take with food, 3 times daily"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={3}
              editable={!loading}
            />

            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes or warnings"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
              editable={!loading}
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.buttonDisabled]}
              onPress={handleSavePrescription}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Prescription</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '90%',
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
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  infoLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  infoBold: {
    fontWeight: '600',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
