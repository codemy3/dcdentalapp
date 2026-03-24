import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, doc, onSnapshot, query, where, updateDoc, serverTimestamp, onAuthStateChanged } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View, Modal, TextInput } from 'react-native';
import { auth, db } from '../config/firebase';
import { ReportUpload } from '../components/report-upload';
import { ReportViewer } from '../components/report-viewer';
import { PatientHistory } from '../components/patient-history';
import DoctorFilter from '../components/doctor-filter';
import TimeSlotManager from '../components/time-slot-manager';
import PatientProfileManager from '../components/patient-profile-manager';
import { LogoutButton } from '../components/logout-button';
import { AppointmentConfirmation } from '../components/appointment-confirmation';
import { PatientPrescriptions } from '../components/patient-prescriptions';
import { CancellationReason } from '../components/cancellation-reason';

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  doctor: string;
  service: string;
  date: string;
  time: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
  rescheduleRequest?: {
    status: 'Requested' | 'Approved' | 'Denied';
    newDate?: string;
    newTime?: string;
  };
  cancelRequested?: boolean;
}

const parseDateInput = (raw: string): Date | null => {
  const value = raw.trim();
  if (!value) return null;

  // Accept YYYY-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const parsed = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Accept DD/MM/YYYY (used by existing booked appointments)
  const dmyMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmyMatch) {
    const parsed = new Date(`${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const parseTimeInput = (raw: string): string | null => {
  const value = raw.trim();
  if (!value) return null;

  // HH:MM (24-hour)
  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(value)) {
    return value;
  }

  // HH:MM AM/PM
  const twelveHour = value.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
  if (!twelveHour) return null;

  let hours = parseInt(twelveHour[1], 10);
  const minutes = twelveHour[2];
  const meridiem = twelveHour[3].toUpperCase();

  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
};

const toIsoDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function PatientDashboard() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [showReportUpload, setShowReportUpload] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [patientPhone, setPatientPhone] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [showProfileManager, setShowProfileManager] = useState(false);
  const [showDoctorFilter, setShowDoctorFilter] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [showPrescriptions, setShowPrescriptions] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellationAppointment, setCancellationAppointment] = useState<Appointment | null>(null);

  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setPageReady(true), 20);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!pageReady) return;
    if (!currentUser) {
      router.replace('/patient-login');
      return;
    }

    // Fetch patient info
    const patientRef = doc(db, 'patients', currentUser.uid);
    const unsubscribePatient = onSnapshot(patientRef, (docSnap) => {
      if (docSnap.exists()) {
        setPatientName(docSnap.data().name);
        setPatientPhone(docSnap.data().phone || '');
      }
    });

    // Fetch patient appointments by patient ID and email (fallback) for robust recent-appointment listing
    const appointmentsQueryById = query(
      collection(db, 'appointments'),
      where('patientId', '==', currentUser.uid)
    );
    const appointmentsQueryByEmail = currentUser.email
      ? query(
          collection(db, 'appointments'),
          where('email', '==', currentUser.email.toLowerCase())
        )
      : null;

    const mapSnapToAppointments = (querySnapshot: any) => {
      const data: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Appointment);
      });
      return data;
    };

    let loadedById: Appointment[] = [];
    let loadedByEmail: Appointment[] = [];

    const unionAppointments = () => {
      const combined = [...loadedById, ...loadedByEmail];
      const unique = new Map<string, Appointment>();
      combined.forEach((apt) => {
        unique.set(apt.id, apt);
      });
      const result = Array.from(unique.values());
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAppointments(result);
      setLoading(false);
      setRefreshing(false);
    };

    const unsubscribeAppointmentsById = onSnapshot(appointmentsQueryById, (querySnapshot) => {
      loadedById = mapSnapToAppointments(querySnapshot);
      unionAppointments();
    });

    let unsubscribeAppointmentsByEmail: (() => void) | null = null;
    if (appointmentsQueryByEmail) {
      unsubscribeAppointmentsByEmail = onSnapshot(appointmentsQueryByEmail, (querySnapshot) => {
        loadedByEmail = mapSnapToAppointments(querySnapshot);
        unionAppointments();
      });
    }


    return () => {
      unsubscribePatient();
      unsubscribeAppointmentsById();
      if (unsubscribeAppointmentsByEmail) {
        unsubscribeAppointmentsByEmail();
      }
    };
  }, [currentUser]);

  const onRefresh = () => {
    setRefreshing(true);
  };

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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await signOut(auth);
            router.push('/');
          } catch (error) {
            Alert.alert('Error', 'Failed to logout');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleBookNew = () => {
    router.push('/appointment');
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.appointmentCard}>
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

      <View style={styles.cardDetails}>
        <Text style={styles.detailLabel}>📅 Date & Time</Text>
        <Text style={styles.detailValue}>
          {item.date} at {item.time}
        </Text>

        <Text style={styles.detailLabel}>📞 Phone</Text>
        <Text style={styles.detailValue}>{item.phone}</Text>

        <Text style={styles.detailLabel}>📧 Email</Text>
        <Text style={styles.detailValue}>{item.email}</Text>

        <Text style={styles.detailLabel}>🕐 Booked</Text>
        <Text style={styles.detailValue}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {item.rescheduleRequest?.status === 'Requested' && (
        <Text style={styles.requestText}>Reschedule requested: {item.rescheduleRequest.newDate} {item.rescheduleRequest.newTime}</Text>
      )}
      {item.cancelRequested && (
        <Text style={styles.requestText}>Cancel requested – awaiting approval</Text>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.rescheduleButton}
          onPress={() => {
            setSelectedAppointment(item);
            setNewDate(item.date);
            setNewTime(item.time);
            setShowRescheduleModal(true);
          }}
        >
          <Text style={styles.rescheduleButtonText}>📝 Request Reschedule</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelRequest(item)}
        >
          <Text style={styles.cancelButtonText}>✖ Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleCancelRequest = (item: Appointment) => {
    if (item.cancelRequested) {
      Alert.alert('Info', 'Cancel request already sent.');
      return;
    }
    setCancellationAppointment(item);
    setShowCancellationModal(true);
  };

  const handleSubmitReschedule = async () => {
    if (!selectedAppointment) return;
    if (!newDate.trim() || !newTime.trim()) {
      Alert.alert('Error', 'Please provide new date and time.');
      return;
    }

    const requestedDate = parseDateInput(newDate);
    if (!requestedDate) {
      Alert.alert('Error', 'Invalid date. Use YYYY-MM-DD or DD/MM/YYYY.');
      return;
    }

    const normalizedTime = parseTimeInput(newTime);
    if (!normalizedTime) {
      Alert.alert('Error', 'Invalid time. Use HH:MM (24h) or HH:MM AM/PM.');
      return;
    }

    const appointmentDate = parseDateInput(selectedAppointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    requestedDate.setHours(0, 0, 0, 0);

    // Restriction: patient cannot reschedule on the same calendar day as the appointment.
    if (appointmentDate) {
      appointmentDate.setHours(0, 0, 0, 0);
      if (appointmentDate.getTime() === today.getTime()) {
        Alert.alert('Not Allowed', 'You cannot reschedule an appointment on the same day.');
        return;
      }
    }

    // Also prevent requesting a same-day new slot.
    if (requestedDate.getTime() === today.getTime()) {
      Alert.alert('Not Allowed', 'Please choose a date after today for rescheduling.');
      return;
    }

    if (requestedDate < today) {
      Alert.alert('Error', 'Cannot request a date in the past.');
      return;
    }

    try {
      await updateDoc(doc(db, 'appointments', selectedAppointment.id), {
        rescheduleRequest: {
          status: 'Requested',
          newDate: toIsoDate(requestedDate),
          newTime: normalizedTime,
        },
        rescheduleRequestedAt: serverTimestamp(),
      });
      Alert.alert('Sent', 'Reschedule request submitted.');
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setNewDate('');
      setNewTime('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reschedule request.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {patientName || 'Patient'}! 👋</Text>
          <Text style={styles.subtitle}>Your Appointments</Text>
          <View style={styles.patientStatusBadge}> 
            <Text style={styles.patientStatusBadgeText}>
              {currentUser ? '🔒 Signed-in Patient Mode' : '👤 Guest Mode'}
            </Text>
          </View>
        </View>
        <LogoutButton userType="patient" style={styles.logoutButton} />
      </View>

      {/* Action Buttons Grid */}
      <View style={styles.actionGrid}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryButton]}
          onPress={handleBookNew}
        >
          <Text style={styles.actionButtonText}>+ Book</Text>
          <Text style={styles.actionButtonSubtext}>New Appointment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setShowPrescriptions(true)}
        >
          <Text style={styles.actionButtonText}>💊</Text>
          <Text style={styles.actionButtonSubtext}>Prescriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={() => setShowReportUpload(true)}
        >
          <Text style={styles.actionButtonText}>📤</Text>
          <Text style={styles.actionButtonSubtext}>Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.quaternaryButton]}
          onPress={() => setShowReportViewer(true)}
        >
          <Text style={styles.actionButtonText}>📋</Text>
          <Text style={styles.actionButtonSubtext}>View Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.quinaryButton]}
          onPress={() => setShowHistory(true)}
        >
          <Text style={styles.actionButtonText}>📜</Text>
          <Text style={styles.actionButtonSubtext}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.sinaryButton]}
          onPress={() => setShowProfileManager(true)}
        >
          <Text style={styles.actionButtonText}>👤</Text>
          <Text style={styles.actionButtonSubtext}>My Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No Appointments Yet</Text>
          <Text style={styles.emptyText}>
            Book your first appointment to get started
          </Text>
          <TouchableOpacity style={styles.emptyBookButton} onPress={handleBookNew}>
            <Text style={styles.emptyBookButtonText}>+ Book Appointment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={appointments}
          renderItem={renderAppointmentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Reschedule Modal */}
      <Modal visible={showRescheduleModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Reschedule</Text>
            <Text style={styles.modalLabel}>New Date</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="YYYY-MM-DD"
              value={newDate}
              onChangeText={setNewDate}
              autoCapitalize="none"
            />
            <Text style={styles.modalLabel}>New Time</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="HH:MM"
              value={newTime}
              onChangeText={setNewTime}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => {
                  setShowRescheduleModal(false);
                  setSelectedAppointment(null);
                  setNewDate('');
                  setNewTime('');
                }}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmit]}
                onPress={handleSubmitReschedule}
              >
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Report Upload Modal */}
      <ReportUpload
        visible={showReportUpload}
        onClose={() => setShowReportUpload(false)}
        patientEmail={currentUser?.email || ''}
        patientName={patientName}
        patientId={currentUser?.uid || ''}
        onUploadSuccess={() => {
          // Refresh or handle success
        }}
      />

      {/* Report Viewer Modal */}
      <ReportViewer
        visible={showReportViewer}
        onClose={() => setShowReportViewer(false)}
        patientEmail={currentUser?.email || ''}
        patientId={currentUser?.uid || ''}
        isDoctor={false}
      />

      {/* Patient History Modal */}
      <PatientHistory
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        patientEmail={currentUser?.email || ''}
      />

      {/* Patient Profile Manager Modal */}
      <PatientProfileManager
        visible={showProfileManager}
        onClose={() => setShowProfileManager(false)}
        onProfileUpdate={() => {
          // Refresh data if needed
        }}
      />

      {/* Patient Prescriptions Modal */}
      <PatientPrescriptions
        visible={showPrescriptions}
        onClose={() => setShowPrescriptions(false)}
        patientEmail={currentUser?.email || ''}
      />

      {/* Cancellation Reason Modal */}
      <CancellationReason
        visible={showCancellationModal}
        onClose={() => {
          setShowCancellationModal(false);
          setCancellationAppointment(null);
        }}
        appointmentId={cancellationAppointment?.id || ''}
        appointmentName={cancellationAppointment?.name || ''}
        onCancelled={() => {
          setShowCancellationModal(false);
          setCancellationAppointment(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 13,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '32%',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
  },
  secondaryButton: {
    backgroundColor: '#a855f7',
  },
  tertiaryButton: {
    backgroundColor: '#06b6d4',
  },
  quaternaryButton: {
    backgroundColor: '#6366f1',
  },
  quinaryButton: {
    backgroundColor: '#f59e0b',
  },
  sinaryButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonText: {
    fontSize: 28,
    marginBottom: 4,
  },
  actionButtonSubtext: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyBookButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyBookButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  appointmentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  service: {
    fontSize: 13,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  patientStatusBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  patientStatusBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
    marginBottom: 2,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
  },
  rescheduleButton: {
    backgroundColor: '#f0f9ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    flex: 1,
  },
  rescheduleButtonText: {
    color: '#0ea5e9',
    fontWeight: '600',
    fontSize: 14,
  },
  requestText: {
    marginTop: 8,
    color: '#6b7280',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: '#fff1f2',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
    flex: 1,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1f2937',
  },
  modalLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    color: '#111827',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalSubmit: {
    backgroundColor: '#0ea5e9',
  },
  modalButtonText: {
    color: '#111827',
    fontWeight: '600',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 40,
  },
});
