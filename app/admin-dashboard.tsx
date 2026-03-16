import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
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
import { db } from "../config/firebase";
import AdminDoctors from "./admin-doctors";
import { LogoutButton } from "../components/logout-button";

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  doctor: string;
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

type AppointmentTab = "Pending" | "Confirmed" | "Completed" | "Cancelled";

const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || "";
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || "";
type AdminTab = "appointments" | "doctors";

export default function AdminDashboard() {
  const [adminTab, setAdminTab] = useState<AdminTab>("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<
    Appointment[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AppointmentTab>("Pending");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAppointments = async () => {
    try {
      const q = query(
        collection(db, "appointments"),
        orderBy("createdAt", "desc"),
      );
      const snapshot = await getDocs(q);

      const data: Appointment[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        data.push({
          id: docSnap.id,
          ...d,
          status: d.status || "Pending",
        } as Appointment);
      });

      setAppointments(data);
      filterAppointments(data, activeTab, searchQuery);
    } catch (error) {
      Alert.alert("Error", "Failed to load appointments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAppointments = (
    data: Appointment[],
    tab: AppointmentTab,
    search: string,
  ) => {
    let filtered = data.filter((a) => a.status === tab);
    if (search) {
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(search.toLowerCase()) ||
          a.email.toLowerCase().includes(search.toLowerCase()) ||
          a.phone.includes(search) ||
          a.doctor.toLowerCase().includes(search.toLowerCase()),
      );
    }
    setFilteredAppointments(filtered);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments(appointments, activeTab, searchQuery);
  }, [activeTab, searchQuery, appointments]);

  const updateStatus = async (
    id: string,
    status: AppointmentTab,
    name: string,
  ) => {
    await updateDoc(doc(db, "appointments", id), { status });
    Alert.alert("Updated", `${name}'s appointment marked as ${status}`);
    fetchAppointments();
  };

  const deleteAppointment = async (id: string, name: string) => {
    const confirmed = window.confirm(`Delete ${name}'s appointment?`);
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, "appointments", id));
      alert("Appointment deleted successfully");
      fetchAppointments();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete appointment");
    }
  };

  const approveReschedule = async (apt: Appointment) => {
    if (!apt.rescheduleRequest || apt.rescheduleRequest.status !== "Requested") return;
    try {
      await updateDoc(doc(db, "appointments", apt.id), {
        date: apt.rescheduleRequest.newDate || apt.date,
        time: apt.rescheduleRequest.newTime || apt.time,
        status: "Confirmed",
        rescheduleRequest: {
          ...apt.rescheduleRequest,
          status: "Approved",
        },
        rescheduleResolvedAt: serverTimestamp(),
      });
      Alert.alert("Updated", "Reschedule approved and appointment updated.");
      
      // Send notification email
      sendNotification(
        apt.email,
        apt.name,
        'Reschedule Approved',
        `Your reschedule request has been approved. New appointment: ${apt.rescheduleRequest.newDate} at ${apt.rescheduleRequest.newTime}`
      );
      
      fetchAppointments();
    } catch (error) {
      Alert.alert("Error", "Failed to approve reschedule");
    }
  };

  const denyReschedule = async (apt: Appointment) => {
    if (!apt.rescheduleRequest || apt.rescheduleRequest.status !== "Requested") return;
    try {
      await updateDoc(doc(db, "appointments", apt.id), {
        rescheduleRequest: {
          ...apt.rescheduleRequest,
          status: "Denied",
        },
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
        console.warn("EmailJS not configured for admin notifications");
        return;
      }

      // Using EmailJS for notifications
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
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ marginLeft: 'auto' }}>
          <LogoutButton userType="admin" style={styles.logoutBtn} />
        </View>
      </View>

      <View style={styles.adminTabs}>
        <TouchableOpacity
          style={[
            styles.adminTab,
            adminTab === "appointments" && styles.adminTabActive,
          ]}
          onPress={() => setAdminTab("appointments")}
        >
          <Text
            style={[
              styles.adminTabText,
              adminTab === "appointments" && styles.adminTabTextActive,
            ]}
          >
            Appointments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.adminTab,
            adminTab === "doctors" && styles.adminTabActive,
          ]}
          onPress={() => setAdminTab("doctors")}
        >
          <Text
            style={[
              styles.adminTabText,
              adminTab === "doctors" && styles.adminTabTextActive,
            ]}
          >
            Doctors
          </Text>
        </TouchableOpacity>
      </View>

      {adminTab === "appointments" && (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, phone, or doctor"
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
                [
                  "Pending",
                  "Confirmed",
                  "Completed",
                  "Cancelled",
                ] as AppointmentTab[]
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
              <Text style={styles.emptyText}>No appointments</Text>
            ) : (
              filteredAppointments.map((apt) => (
                <View key={apt.id} style={styles.card}>
                  <Text style={styles.patientName}>{apt.name}</Text>
                  <Text>{apt.doctor}</Text>
                  <Text>
                    {apt.date} at {apt.time}
                  </Text>

                  <View style={styles.actions}>
                    {apt.status === "Pending" && (
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => updateStatus(apt.id, "Confirmed", apt.name)}
                      >
                        <Text style={styles.btnText}>Confirm</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => updateStatus(apt.id, "Cancelled", apt.name)}
                    >
                      <Text style={styles.btnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteAppointment(apt.id, apt.name)}
                    >
                      <Text style={styles.btnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

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
                </View>
              ))
            )}
          </ScrollView>
        </>
      )}

      {adminTab === "doctors" && <AdminDoctors />}
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
  logoutBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },

  adminTabs: {
    flexDirection: "row",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  adminTab: {
    flex: 1,
    padding: 14,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
  },
  adminTabActive: {
    backgroundColor: "#0a2540",
  },
  adminTabText: {
    fontWeight: "600",
    color: "#374151",
  },
  adminTabTextActive: {
    color: "#fff",
  },

  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
  },

  tabsWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    minWidth: 120,
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
  patientName: { fontSize: 18, fontWeight: "bold" },

  actions: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  confirmButton: { backgroundColor: "#22c55e", padding: 10, borderRadius: 8 },
  cancelButton: { backgroundColor: "#facc15", padding: 10, borderRadius: 8 },
  deleteButton: { backgroundColor: "#ef4444", padding: 10, borderRadius: 8 },
  btnText: { color: "#fff", fontWeight: "bold" },
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
});
