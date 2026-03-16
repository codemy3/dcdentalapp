import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  doctor: string;
  service: string;
  date: string;
  status: string;
  createdAt: string;
}

interface PatientHistoryProps {
  visible: boolean;
  onClose: () => void;
  patientEmail: string;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({
  visible,
  onClose,
  patientEmail,
}) => {
  const [history, setHistory] = useState<PatientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<PatientProfile | null>(null);

  useEffect(() => {
    if (!visible || !patientEmail) return;

    const appointmentsQuery = query(
      collection(db, 'appointments'),
      where('email', '==', patientEmail)
    );

    const unsubscribe = onSnapshot(appointmentsQuery, (snapshot) => {
      const profilesData: PatientProfile[] = [];
      snapshot.forEach((doc) => {
        profilesData.push({
          id: doc.id,
          ...doc.data(),
        } as PatientProfile);
      });

      // Sort by date descending (most recent first)
      profilesData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(profilesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [visible, patientEmail]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#f59e0b';
      case 'Confirmed':
        return '#10b981';
      case 'Completed':
        return '#6b7280';
      case 'Cancelled':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const renderProfileItem = ({ item }: { item: PatientProfile }) => (
    <TouchableOpacity
      style={styles.profileCard}
      onPress={() => setSelectedProfile(item)}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.doctorName}>{item.doctor}</Text>
          <Text style={styles.service}>{item.service}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.date}>📅 {item.date}</Text>
        <Text style={styles.info}>🏥 Appointment ID: {item.id.substring(0, 8)}...</Text>
      </View>
    </TouchableOpacity>
  );

  const renderDetailModal = () => {
    if (!selectedProfile) return null;

    return (
      <Modal visible={true} animationType="slide" transparent>
        <View style={styles.detailContainer}>
          <View style={styles.detailHeader}>
            <TouchableOpacity onPress={() => setSelectedProfile(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.detailTitle}>Appointment Details</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.detailContent}>
            <Text style={styles.sectionTitle}>Patient Information</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{selectedProfile.name}</Text>

              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{selectedProfile.email}</Text>

              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{selectedProfile.phone}</Text>
            </View>

            <Text style={styles.sectionTitle}>Appointment Information</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Doctor</Text>
              <Text style={styles.value}>{selectedProfile.doctor}</Text>

              <Text style={styles.label}>Service</Text>
              <Text style={styles.value}>{selectedProfile.service}</Text>

              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{selectedProfile.date}</Text>

              <Text style={styles.label}>Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(selectedProfile.status) },
                ]}
              >
                <Text style={styles.statusText}>{selectedProfile.status}</Text>
              </View>

              <Text style={styles.label}>Created</Text>
              <Text style={styles.value}>
                {new Date(selectedProfile.createdAt).toLocaleDateString()} at{' '}
                {new Date(selectedProfile.createdAt).toLocaleTimeString()}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeModalButton}
              onPress={() => setSelectedProfile(null)}
            >
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <>
      <Modal visible={visible && !selectedProfile} animationType="slide" transparent>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Patient History</Text>
            <View style={{ width: 40 }} />
          </View>

          {loading ? (
            <View style={styles.centerContent}>
              <Text>Loading...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.centerContent}>
              <Text style={styles.emptyText}>No appointments in history</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(item) => item.id}
              renderItem={renderProfileItem}
              contentContainerStyle={styles.listContent}
              scrollEnabled={true}
            />
          )}
        </View>
      </Modal>

      {renderDetailModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeBtn: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  service: {
    fontSize: 12,
    color: '#666',
  },
  cardBody: {
    gap: 5,
  },
  date: {
    fontSize: 13,
    color: '#666',
  },
  info: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  detailContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  detailContent: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  infoBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    color: '#333',
  },
  closeModalButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  closeModalText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
