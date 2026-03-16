import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface CancellationReasonProps {
  visible: boolean;
  onClose: () => void;
  appointmentId: string;
  appointmentName: string;
  onCancelled?: () => void;
}

export function CancellationReason({
  visible,
  onClose,
  appointmentId,
  appointmentName,
  onCancelled,
}: CancellationReasonProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for cancellation');
      return;
    }

    try {
      setLoading(true);
      await updateDoc(doc(db, 'appointments', appointmentId), {
        status: 'Cancelled',
        cancellationReason: reason.trim(),
        cancelledAt: serverTimestamp(),
      });

      Alert.alert('Success', `${appointmentName}'s appointment has been cancelled`);
      setReason('');
      onCancelled?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Cancel Appointment</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Text style={styles.label}>
              Please provide a reason for cancelling this appointment:
            </Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter cancellation reason..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              editable={!loading}
              placeholderTextColor="#999"
            />

            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Keep Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonConfirm, loading && styles.buttonDisabled]}
                onPress={handleCancel}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Cancel Appointment</Text>
                )}
              </TouchableOpacity>
            </View>
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
    width: '90%',
    maxWidth: 500,
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
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    lineHeight: 20,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
    textAlignVertical: 'top',
    color: '#333',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: '#6c757d',
  },
  buttonConfirm: {
    backgroundColor: '#dc3545',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
