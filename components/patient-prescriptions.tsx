import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  duration: string;
  instructions: string;
  notes: string;
  doctorName: string;
  date: string;
}

interface PatientPrescriptionsProps {
  visible: boolean;
  onClose: () => void;
  patientEmail: string;
}

export function PatientPrescriptions({
  visible,
  onClose,
  patientEmail,
}: PatientPrescriptionsProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    if (visible) {
      loadPrescriptions();
    }
  }, [visible, patientEmail]);

  const loadPrescriptions = async () => {
    console.log('💊 loadPrescriptions called');
    console.log('📧 Patient Email:', patientEmail);

    if (!patientEmail) {
      console.log('❌ No patient email provided');
      Alert.alert('Error', 'Patient email not found');
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 Querying Firestore for prescriptions...');

      const q = query(
        collection(db, 'prescriptions'),
        where('patientEmail', '==', patientEmail)
      );

      const snapshot = await getDocs(q);
      console.log('📊 Found', snapshot.size, 'prescriptions');

      const data: Prescription[] = [];

      snapshot.forEach((doc) => {
        console.log('📄 Prescription doc:', doc.id, doc.data());
        data.push({
          id: doc.id,
          ...doc.data(),
        } as Prescription);
      });

      // Sort by date (newest first)
      data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      console.log('✅ Loaded and sorted', data.length, 'prescriptions');
      setPrescriptions(data);
    } catch (error: any) {
      console.error('❌ Error loading prescriptions:', error);
      console.error('Error message:', error.message);
      Alert.alert('Error', 'Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const renderPrescriptionItem = ({ item }: { item: Prescription }) => (
    <TouchableOpacity
      style={styles.prescriptionCard}
      onPress={() => setSelectedPrescription(item)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.medicationName}>{item.medication}</Text>
          <Text style={styles.doctorName}>Dr. {item.doctorName}</Text>
        </View>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <Text style={styles.dosage}>Dosage: {item.dosage}</Text>
      <Text style={styles.duration}>Duration: {item.duration}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>My Prescriptions</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loadingText}>Loading prescriptions...</Text>
            </View>
          ) : prescriptions.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>📋 No prescriptions yet</Text>
              <Text style={styles.emptySubText}>
                Prescriptions from your doctors will appear here
              </Text>
            </View>
          ) : (
            <FlatList
              data={prescriptions}
              renderItem={renderPrescriptionItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Prescription Detail Modal */}
        {selectedPrescription && (
          <Modal visible={!!selectedPrescription} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={[styles.modal, styles.detailModal]}>
                <View style={styles.header}>
                  <Text style={styles.title}>Prescription Details</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedPrescription(null)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Prescribed by</Text>
                    <Text style={styles.detailValue}>Dr. {selectedPrescription.doctorName}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>{selectedPrescription.date}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Medication</Text>
                    <Text style={styles.medicationNameDetail}>{selectedPrescription.medication}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Dosage</Text>
                    <Text style={styles.detailValue}>{selectedPrescription.dosage}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{selectedPrescription.duration}</Text>
                  </View>

                  {selectedPrescription.instructions && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Instructions</Text>
                      <Text style={styles.detailValue}>{selectedPrescription.instructions}</Text>
                    </View>
                  )}

                  {selectedPrescription.notes && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notes</Text>
                      <Text style={styles.detailValue}>{selectedPrescription.notes}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.closeDetailButton}
                    onPress={() => setSelectedPrescription(null)}
                  >
                    <Text style={styles.closeDetailButtonText}>Close</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
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
  detailModal: {
    maxHeight: '85%',
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
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  prescriptionCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  doctorName: {
    fontSize: 13,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  dosage: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  duration: {
    fontSize: 13,
    color: '#555',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  medicationNameDetail: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0284c7',
  },
  closeDetailButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  closeDetailButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
