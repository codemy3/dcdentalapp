import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
    serverTimestamp,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { LogoutButton } from "../components/logout-button";
import { DoctorProfileEditor } from "../components/doctor-profile-editor";
import { AppointmentFilter } from "../components/appointment-filter";
import { CancellationReason } from "../components/cancellation-reason";
import { PrescriptionWriter } from "../components/prescription-writer";
import { DoctorReportViewer } from "../components/doctor-report-viewer";
import { DoctorReportUpload } from "../components/doctor-report-upload";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  doctor: string;
  doctorId?: string;
  doctorEmail?: string;
  service: string;
  date: string;
  time: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  createdAt: string;
  rescheduleRequest?: {
    status: "Requested" | "Approved" | "Denied";
    newDate?: string;
    newTime?: string;
  };
  cancelRequested?: boolean;
}

type StatusTab = "Pending" | "Confirmed" | "Completed" | "Cancelled";

const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || "";

export default function DoctorDashboard() {
  const router = useRouter();
  const currentUser = auth.currentUser;

  const [doctorData, setDoctorData] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<StatusTab>("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [showReportViewer, setShowReportViewer] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatientName, setSelectedPatientName] = useState<string | null>(null);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [doctorFilter, setDoctorFilter] = useState("");
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showReportUploadModal, setShowReportUploadModal] = useState(false);
  const [selectedAppointmentForModal, setSelectedAppointmentForModal] = useState<Appointment | null>(null);

  useEffect(() => {
    if (!currentUser) {
      try {
        router.push("/doctor-login");
      } catch (error) {
        console.log("Router not ready yet, will retry");
      }
      return;
    }
    loadDoctorProfile();
  }, [currentUser, router]);

  useEffect(() => {
    if (doctorData?.name) {
      fetchAppointments();
    }
  }, [doctorData]);

  useEffect(() => {
    filterAppointments(appointments, activeTab, searchQuery);
  }, [activeTab, searchQuery, appointments]);

  const loadDoctorProfile = async () => {
    if (!currentUser?.email) return;
    try {
      console.log("🔍 Loading doctor profile for email:", currentUser.email);
      const q = query(
        collection(db, "doctors"),
        where("email", "==", currentUser.email),
      );
      const snap = await getDocs(q);
      console.log("📋 Doctor query returned", snap.size, "documents");
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const doctorInfo = {
          id: docSnap.id,
          name: docSnap.data().name,
          email: docSnap.data().email,
        };
        console.log("✅ Doctor profile loaded:", doctorInfo);
        console.log("👨‍⚕️ Doctor name that will be used for querying:", doctorInfo.name);
        setDoctorData(doctorInfo);
      } else {
        console.error("❌ No doctor found with email:", currentUser.email);
      }
    } catch (error) {
      console.error("Error loading doctor profile:", error);
    }
  };

  const fetchAppointments = async () => {
    console.log("🔄 fetchAppointments called");
    if (!doctorData?.name) {
      console.log("⚠️ No doctor name available yet, returning early");
      return;
    }
    try {
      // Query appointments assigned to this doctor by name
      const doctorNameToQuery = doctorData.name.trim();
      console.log("🔍 Querying appointments WHERE doctor ==", `'${doctorNameToQuery}'`);
      
      // First, let's see ALL appointments to debug
      const allAppts = await getDocs(collection(db, "appointments"));
      console.log("📊 Total appointments in database:", allAppts.size);
      allAppts.forEach((doc) => {
        const data = doc.data();
        console.log("  - Appointment ID:", doc.id, "| Patient:", data.name, "| Doctor field:", `'${data.doctor}'`, "| Status:", data.status);
      });
      
      const q = query(
        collection(db, "appointments"),
        where("doctor", "==", doctorNameToQuery)
      );
      const snapshot = await getDocs(q);
      console.log("✅ Filtered query returned", snapshot.size, "appointments for doctor:", `'${doctorNameToQuery}'`);

      const data: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        console.log("  ✓ Matched appointment:", d.name, "on", d.date, "at", d.time);
        data.push({
          id: docSnap.id,
          ...d,
          status: d.status || "Pending",
        } as Appointment);
      });

      // Sort in memory by createdAt descending
      data.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      console.log("📝 Total appointments after processing:", data.length);
      setAppointments(data);
      filterAppointments(data, activeTab, searchQuery);
    } catch (error) {
      console.error("❌ Error loading appointments:", error);
      Alert.alert("Error", "Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = (
    data: Appointment[],
    tab: StatusTab,
    search: string,
  ) => {
    let filtered = data.filter((a) => a.status === tab);
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.phone.includes(search) ||
          a.email.toLowerCase().includes(search.toLowerCase()),
      );
    }
    setFilteredAppointments(filtered);
  };

  const updateStatus = async (id: string, status: StatusTab, name: string) => {
    try {
      await updateDoc(doc(db, "appointments", id), { status });
      Alert.alert("Updated", `${name}'s appointment marked as ${status}`);
      fetchAppointments();
    } catch (error) {
      console.error("Error updating status:", error);
      Alert.alert("Error", "Failed to update appointment status");
    }
  };

  const approveReschedule = async (apt: Appointment) => {
    if (!apt.rescheduleRequest || apt.rescheduleRequest.status !== "Requested") return;
    try {
      await updateDoc(doc(db, "appointments", apt.id), {
        date: apt.rescheduleRequest.newDate || apt.date,
        time: apt.rescheduleRequest.newTime || apt.time,
        status: "Confirmed",
        rescheduleRequest: { ...apt.rescheduleRequest, status: "Approved" },
        rescheduleResolvedAt: serverTimestamp(),
      });
      Alert.alert("Updated", "Reschedule approved and updated.");
      
      // Send notification email
      sendNotification(
        apt.email,
        apt.name,
        'Reschedule Approved',
        `Your reschedule request has been approved. New appointment: ${apt.rescheduleRequest.newDate} at ${apt.rescheduleRequest.newTime}`
      );
      
      fetchAppointments();
    } catch (error) {
      console.error("Error approving reschedule:", error);
      Alert.alert("Error", "Failed to approve reschedule");
    }
  };

  const denyReschedule = async (apt: Appointment) => {
    if (!apt.rescheduleRequest || apt.rescheduleRequest.status !== "Requested") return;
    try {
      await updateDoc(doc(db, "appointments", apt.id), {
        rescheduleRequest: { ...apt.rescheduleRequest, status: "Denied" },
        rescheduleResolvedAt: serverTimestamp(),
      });
      Alert.alert("Updated", "Reschedule request denied.");
      
      // Send notification email
      sendNotification(
        apt.email,
        apt.name,
        'Reschedule Request Denied',
        `Your reschedule request for ${apt.date} at ${apt.time} has been denied. Please contact us for more information.`
      );
      
      fetchAppointments();
    } catch (error) {
      console.error("Error denying reschedule:", error);
      Alert.alert("Error", "Failed to deny reschedule");
    }
  };

  const approveCancel = async (apt: Appointment) => {
    if (!apt.cancelRequested) return;
    try {
      await updateDoc(doc(db, "appointments", apt.id), {
        status: "Cancelled",
        cancelRequested: false,
        cancelResolvedAt: serverTimestamp(),
      });
      Alert.alert("Updated", "Appointment cancelled as requested.");
      
      // Send notification email
      sendNotification(
        apt.email,
        apt.name,
        'Appointment Cancelled',
        `Your appointment on ${apt.date} at ${apt.time} has been cancelled as requested.`
      );
      
      fetchAppointments();
    } catch (error) {
      console.error("Error approving cancel:", error);
      Alert.alert("Error", "Failed to approve cancel request");
    }
  };

  const sendNotification = async (
    email: string,
    name: string,
    subject: string,
    message: string
  ) => {
    try {
      if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
        console.warn("EmailJS not configured for doctor notifications");
        return;
      }

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: {
            to_email: email,
            to_name: name,
            subject: subject,
            message: message,
          },
        }),
      });
    } catch (error) {
      console.error('Email notification failed:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          try {
            await signOut(auth);
            router.push("/");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const stats = {
    Pending: appointments.filter((a) => a.status === "Pending").length,
    Confirmed: appointments.filter((a) => a.status === "Confirmed").length,
    Completed: appointments.filter((a) => a.status === "Completed").length,
    Cancelled: appointments.filter((a) => a.status === "Cancelled").length,
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Doctor Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            {doctorData?.name || "Doctor"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowProfileEditor(true)}
          style={styles.editProfileBtn}
        >
          <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
        </TouchableOpacity>
        <LogoutButton userType="doctor" style={styles.logoutBtn} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient name or phone"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {(
            ["Pending", "Confirmed", "Completed", "Cancelled"] as StatusTab[]
          ).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab} ({stats[tab]})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchAppointments}
          />
        }
      >
        {filteredAppointments.length === 0 ? (
          <Text style={styles.emptyText}>No {activeTab} appointments</Text>
        ) : (
          filteredAppointments.map((apt) => (
            <View key={apt.id} style={styles.card}>
              <Text style={styles.patientName}>{apt.name}</Text>
              <Text style={styles.infoText}>Service: {apt.service}</Text>
              <Text style={styles.infoText}>
                {apt.date} at {apt.time}
              </Text>
              <Text style={styles.infoText}>Phone: {apt.phone}</Text>
              <Text style={styles.infoText}>Email: {apt.email}</Text>

              {apt.rescheduleRequest?.status === "Requested" && (
                <View style={styles.requestBox}>
                  <Text style={styles.requestTitle}>Reschedule Requested</Text>
                  <Text style={styles.requestText}>
                    New: {apt.rescheduleRequest.newDate} at {apt.rescheduleRequest.newTime}
                  </Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => approveReschedule(apt)}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.denyButton}
                      onPress={() => denyReschedule(apt)}
                    >
                      <Text style={styles.actionText}>Deny</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {apt.cancelRequested && (
                <View style={styles.requestBox}>
                  <Text style={styles.requestTitle}>Cancel Requested</Text>
                  <View style={styles.requestActions}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => approveCancel(apt)}
                    >
                      <Text style={styles.actionText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.actions}>
                {apt.status === "Pending" && (
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={() => updateStatus(apt.id, "Confirmed", apt.name)}
                  >
                    <Text style={styles.btnText}>Confirm</Text>
                  </TouchableOpacity>
                )}
                {apt.status === "Confirmed" && (
                  <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => updateStatus(apt.id, "Completed", apt.name)}
                  >
                    <Text style={styles.btnText}>Mark Completed</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setSelectedAppointmentForModal(apt);
                    setShowCancellationModal(true);
                  }}
                >
                  <Text style={styles.btnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reportsButton}
                  onPress={() => {
                    setSelectedPatientId(apt.email);                    setSelectedPatientName(apt.name);                    setShowReportViewer(true);
                  }}
                >
                  <Text style={styles.btnText}>�️ View Reports</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.prescriptionButton}
                  onPress={() => {
                    console.log('💊 Prescription button clicked');
                    console.log('Selected appointment:', apt);
                    console.log('Doctor data:', doctorData);
                    setSelectedAppointmentForModal(apt);
                    setShowPrescriptionModal(true);
                  }}
                >
                  <Text style={styles.btnText}>💊 Prescription</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={() => {
                    setSelectedAppointmentForModal(apt);
                    setShowReportUploadModal(true);
                  }}
                >
                  <Text style={styles.btnText}>📤 Upload Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* Report Viewer Modal */}
      <DoctorReportViewer
        visible={showReportViewer}
        onClose={() => {
          setShowReportViewer(false);
          setSelectedPatientId(null);
          setSelectedPatientName(null);
        }}
        patientEmail={selectedPatientId || ''}
        patientName={selectedPatientName || ''}
      />
      {/* Doctor Profile Editor Modal */}
      <DoctorProfileEditor
        visible={showProfileEditor}
        onClose={() => setShowProfileEditor(false)}
        doctorId={doctorData?.id || ''}
        onProfileUpdated={loadDoctorProfile}
      />

      {/* Cancellation Reason Modal */}
      <CancellationReason
        visible={showCancellationModal}
        onClose={() => {
          setShowCancellationModal(false);
          setSelectedAppointmentForModal(null);
        }}
        appointmentId={selectedAppointmentForModal?.id || ''}
        appointmentName={selectedAppointmentForModal?.name || ''}
        onCancelled={() => {
          fetchAppointments();
          setShowCancellationModal(false);
          setSelectedAppointmentForModal(null);
        }}
      />

      {/* Prescription Writer Modal */}
      <PrescriptionWriter
        visible={showPrescriptionModal}
        onClose={() => {
          setShowPrescriptionModal(false);
          setSelectedAppointmentForModal(null);
        }}
        patientEmail={selectedAppointmentForModal?.email || ''}
        patientName={selectedAppointmentForModal?.name || ''}
        doctorName={doctorData?.name || ''}
        doctorEmail={doctorData?.email || currentUser?.email || ''}
        appointmentId={selectedAppointmentForModal?.id || ''}
        onPrescriptionSaved={() => {
          setShowPrescriptionModal(false);
          setSelectedAppointmentForModal(null);
        }}
      />

      {/* Doctor Report Uploader Modal */}
      <DoctorReportUpload
        visible={showReportUploadModal}
        onClose={() => {
          setShowReportUploadModal(false);
          setSelectedAppointmentForModal(null);
        }}
        patientEmail={selectedAppointmentForModal?.email || ''}
        patientName={selectedAppointmentForModal?.name || ''}
        doctorName={doctorData?.name || ''}
        onUploadSuccess={() => {
          setShowReportUploadModal(false);
          setSelectedAppointmentForModal(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16 },

  headerBar: {
    backgroundColor: "#0a2540",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  headerSubtitle: { color: "#e0e7ff", fontSize: 14, marginTop: 4 },
  logoutBtn: {
    backgroundColor: "#fee2e2",
    padding: 8,
    borderRadius: 8,
  },
  logoutText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  editProfileBtn: {
    backgroundColor: "#e0f2fe",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  editProfileText: { color: "#0369a1", fontWeight: "600", fontSize: 13 },

  searchContainer: { marginHorizontal: 16, marginTop: 12 },
  searchInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },

  tabsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tabsContent: {
    alignItems: "center",
    paddingRight: 16,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#e5e7eb",
    borderRadius: 20,
    marginRight: 8,
    minWidth: 110,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#0a2540",
  },
  tabText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "700",
  },

  emptyText: {
    textAlign: "center",
    marginTop: 40,
    color: "#6b7280",
  },

  card: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  patientName: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  infoText: { fontSize: 14, color: "#6b7280", marginBottom: 4 },

  actions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  confirmButton: { backgroundColor: "#22c55e", padding: 10, borderRadius: 8 },
  completeButton: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  cancelButton: { backgroundColor: "#facc15", padding: 10, borderRadius: 8 },
  reportsButton: { backgroundColor: "#8b5cf6", padding: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  requestBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  requestTitle: {
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 6,
  },
  requestText: {
    color: "#475569",
    marginBottom: 8,
  },
  requestActions: {
    flexDirection: "row",
    gap: 10,
  },
  approveButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  denyButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 13,
  },
  prescriptionButton: {
    backgroundColor: "#ec4899",
    padding: 10,
    borderRadius: 8,
  },
  uploadButton: {
    backgroundColor: "#06b6d4",
    padding: 10,
    borderRadius: 8,
  },
});
