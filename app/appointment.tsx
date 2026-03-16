import DateTimePicker from "@react-native-community/datetimepicker";
import emailjs from "emailjs-com";
import { useRouter } from "expo-router";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../config/firebase";

// Initialize EmailJS (replace with your Public Key from https://www.emailjs.com/dashboard/admin/api_keys)
const EMAILJS_PUBLIC_KEY = process.env.EXPO_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const EMAILJS_SERVICE_ID = process.env.EXPO_PUBLIC_EMAILJS_SERVICE_ID || "";
const EMAILJS_TEMPLATE_ID = process.env.EXPO_PUBLIC_EMAILJS_TEMPLATE_ID || "";

interface DoctorOption {
  id: string;
  name: string;
  email?: string;
  specialization?: string;
}

const CLINIC_OPEN_HOUR = 9;
const CLINIC_CLOSE_HOUR = 17;
const SLOT_INTERVAL_MINUTES = 30;

const toIsoDateString = (value: Date) => value.toISOString().split("T")[0];

const normalizeDate = (value: string) => {
  const raw = (value || "").trim();
  if (!raw) return "";

  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // DD/MM/YYYY
  const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? "" : toIsoDateString(parsed);
};

const normalizeTime = (value: string) => {
  const raw = (value || "").trim();
  if (!raw) return "";

  // 24-hour HH:MM
  const twentyFour = raw.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (twentyFour) return `${twentyFour[1]}:${twentyFour[2]}`;

  // 12-hour hh:mm AM/PM
  const twelveHour = raw.match(/^(0?[1-9]|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
  if (!twelveHour) return "";

  let hours = parseInt(twelveHour[1], 10);
  const minutes = twelveHour[2];
  const meridiem = twelveHour[3].toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

const getClinicSlots = () => {
  const slots: string[] = [];
  for (let hour = CLINIC_OPEN_HOUR; hour < CLINIC_CLOSE_HOUR; hour += 1) {
    for (let minute = 0; minute < 60; minute += SLOT_INTERVAL_MINUTES) {
      slots.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return slots;
};

const formatSlotLabel = (slot: string) => {
  const [rawHour, rawMinute] = slot.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
};

export default function AppointmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const currentUser = auth.currentUser;
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  // Initialize EmailJS on component mount
  useEffect(() => {
    if (EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
      // eslint-disable-next-line no-console
      console.log("EmailJS initialized");
    } else {
      // eslint-disable-next-line no-console
      console.warn("EmailJS public key not set");
    }
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    doctorId: "",
    doctorName: "",
    doctorEmail: "",
    doctorSpecialization: "",
    service: "General Check-up",
  });

  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const snapshot = await getDocs(collection(db, "doctors"));
        const list: DoctorOption[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Partial<DoctorOption> & {
            specialization?: string;
          };
          list.push({
            id: docSnap.id,
            name: data.name || "Unnamed Doctor",
            email: data.email,
            specialization: data.specialization,
          });
        });
        setDoctors(list);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error loading doctors", error);
        Alert.alert("Error", "Failed to load doctors list");
      } finally {
        setLoadingDoctors(false);
      }
    };

    loadDoctors();
  }, []);

  // Date and Time pickers
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const services = [
    "General Check-up",
    "Dental Cleaning",
    "Consultation",
    "Emergency",
    "Other",
  ];

  // Validate form
  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (!formData.doctorName) {
      Alert.alert("Error", "Please select a doctor");
      return false;
    }
    return true;
  };

  const selectedDate = toIsoDateString(date);

  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!formData.doctorId) {
        setAvailableSlots([]);
        setSelectedSlot("");
        return;
      }

      try {
        setLoadingSlots(true);
        const allClinicSlots = getClinicSlots();

        // Hide past slots when booking for today.
        const now = new Date();
        const isToday = selectedDate === toIsoDateString(now);
        let candidateSlots = allClinicSlots;
        if (isToday) {
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          candidateSlots = allClinicSlots.filter((slot) => {
            const [h, m] = slot.split(":").map(Number);
            return h * 60 + m > currentMinutes;
          });
        }

        const doctorAppointmentsSnap = await getDocs(
          query(collection(db, "appointments"), where("doctorId", "==", formData.doctorId)),
        );

        const bookedSlots = new Set<string>();
        doctorAppointmentsSnap.forEach((docSnap) => {
          const apt = docSnap.data() as { date?: string; time?: string; status?: string };
          if (apt.status === "Cancelled") return;
          if (normalizeDate(apt.date || "") !== selectedDate) return;

          const slotTime = normalizeTime(apt.time || "");
          if (slotTime) bookedSlots.add(slotTime);
        });

        const freeSlots = candidateSlots.filter((slot) => !bookedSlots.has(slot));
        setAvailableSlots(freeSlots);

        if (!freeSlots.includes(selectedSlot)) {
          setSelectedSlot("");
        }
      } catch (error) {
        console.error("Error loading available slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadAvailableSlots();
  }, [formData.doctorId, selectedDate, selectedSlot]);

  // Handle date change
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Submit to Firebase
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!selectedSlot) {
      Alert.alert("Error", "Please select an available appointment slot.");
      return;
    }

    setLoading(true);

    try {
      const requestedDate = toIsoDateString(date);
      const requestedTime = selectedSlot;

      // Prevent double-booking for the same doctor, date, and time.
      const appointmentsCollection = collection(db, "appointments");
      const doctorId = formData.doctorId.trim();
      const doctorName = formData.doctorName.trim();
      const slotQuery = doctorId
        ? query(appointmentsCollection, where("doctorId", "==", doctorId))
        : query(appointmentsCollection, where("doctor", "==", doctorName));
      const existingAppointments = await getDocs(slotQuery);

      const isSlotTaken = existingAppointments.docs.some((snapshot) => {
        const data = snapshot.data() as {
          date?: string;
          time?: string;
          status?: string;
        };

        if (data.status === "Cancelled") return false;

        const existingDate = normalizeDate(data.date || "");
        const existingTime = normalizeTime(data.time || "");
        return existingDate === requestedDate && existingTime === requestedTime;
      });

      if (isSlotTaken) {
        Alert.alert(
          "Slot Unavailable",
          "This doctor already has an appointment at the selected date and time. Please choose another slot.",
        );
        return;
      }

      // Restriction: one active appointment per email per day.
      const normalizedEmail = formData.email.trim().toLowerCase();
      const userAppointments = await getDocs(
        query(collection(db, "appointments"), where("email", "==", normalizedEmail)),
      );

      const hasExistingAppointmentForDay = userAppointments.docs.some((snapshot) => {
        const data = snapshot.data() as { date?: string; status?: string };
        if (data.status === "Cancelled") return false;
        return normalizeDate(data.date || "") === requestedDate;
      });

      if (hasExistingAppointmentForDay) {
        Alert.alert(
          "Booking Limit",
          "Only one appointment per email is allowed per day.",
        );
        return;
      }

      // Save to Firebase
      const appointmentData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        patientId: currentUser?.uid || null,
        phone: formData.phone.trim(),
        doctor: formData.doctorName.trim(),
        doctorId: formData.doctorId,
        doctorEmail: formData.doctorEmail,
        doctorSpecialization: formData.doctorSpecialization,
        service: formData.service,
        date: requestedDate,
        time: requestedTime,
        status: "Pending",
        createdAt: new Date().toISOString(),
        // Store patient profile for history
        patientProfile: {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          createdAt: new Date().toISOString(),
        },
      };

      console.log(
        "Saving appointment with doctor name:",
        appointmentData.doctor,
      );
      const docRef = await addDoc(
        collection(db, "appointments"),
        appointmentData,
      );
      console.log("Appointment saved successfully! docId:", docRef.id);

      // Send confirmation email via EmailJS if configured
      if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID) {
        try {
          const res = await emailjs.send(
            EMAILJS_SERVICE_ID,
            EMAILJS_TEMPLATE_ID,
            {
              to_email: formData.email,
              to_name: formData.name,
              service: formData.service,
              doctor: formData.doctorName,
              date: appointmentData.date,
              time: appointmentData.time,
              message: `Thank you for booking an appointment. We will contact you shortly to confirm.`,
            },
          );
          // eslint-disable-next-line no-console
          console.log("Confirmation email sent successfully", res);
        } catch (emailError) {
          // eslint-disable-next-line no-console
          console.error("Error sending email:", emailError);
          // Don't fail the booking if email fails
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          "EmailJS not configured: missing PUBLIC_KEY or SERVICE_ID or TEMPLATE_ID",
        );
      }

      // Show success modal
      setShowSuccessModal(true);

      // Auto-navigate after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push("/success");
      }, 3000);
    } catch (error) {
      console.error("Error saving appointment:", error);
      Alert.alert(
        "Error",
        "Failed to book appointment. Please check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successModalContent}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheckmark}>✓</Text>
            </View>
            <Text style={styles.successModalTitle}>Booking Successful!</Text>
            <Text style={styles.successModalMessage}>
              Your appointment has been booked successfully. We will contact you
              shortly to confirm.
            </Text>
            <TouchableOpacity
              style={styles.successModalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.push("/success");
              }}
            >
              <Text style={styles.successModalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Main Form */}
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Book Your Appointment</Text>
          <Text style={styles.pageSubtitle}>
            Fill in your details and we will confirm your appointment shortly
          </Text>
        </View>

        <View style={styles.formCard}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor="#9ca3af"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="(07) XXXX XXXX"
              placeholderTextColor="#9ca3af"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          {/* Doctor Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Doctor *</Text>
            <View style={styles.pickerContainer}>
              {loadingDoctors ? (
                <Text style={styles.helperText}>Loading doctors...</Text>
              ) : doctors.length === 0 ? (
                <Text style={styles.helperText}>
                  No doctors available. Please contact the clinic.
                </Text>
              ) : (
                doctors.map((doc) => {
                  const isSelected = formData.doctorId === doc.id;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[
                        styles.pickerOption,
                        isSelected && styles.pickerOptionSelected,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          doctorId: doc.id,
                          doctorName: doc.name,
                          doctorEmail: doc.email || "",
                          doctorSpecialization: doc.specialization || "",
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.pickerOptionText,
                          isSelected && styles.pickerOptionTextSelected,
                        ]}
                      >
                        {doc.name}
                        {doc.specialization ? ` • ${doc.specialization}` : ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </View>

          {/* Service Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Type</Text>
            <View style={styles.serviceChips}>
              {services.map((service, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.chip,
                    formData.service === service && styles.chipSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, service: service })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      formData.service === service && styles.chipTextSelected,
                    ]}
                  >
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Date Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Preferred Date *</Text>
            {Platform.OS === "web" ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setDate(new Date(e.target.value));
                  setSelectedSlot("");
                }}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "2px solid #e5e7eb",
                  backgroundColor: "#f9fafb",
                  fontSize: "15px",
                  width: "100%",
                  fontFamily: "inherit",
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.dateButtonText}>
                    📅{" "}
                    {date.toLocaleDateString("en-AU", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDateValue) => {
                      onDateChange(event, selectedDateValue);
                      setSelectedSlot("");
                    }}
                  />
                )}
              </>
            )}
          </View>

          {/* Available Slots */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Available Slots *</Text>
            {!formData.doctorId ? (
              <Text style={styles.helperText}>Select a doctor to view available slots.</Text>
            ) : loadingSlots ? (
              <Text style={styles.helperText}>Loading available slots...</Text>
            ) : availableSlots.length === 0 ? (
              <Text style={styles.helperText}>
                No available slots for this date. Please choose another date.
              </Text>
            ) : (
              <View style={styles.slotGrid}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                        {formatSlotLabel(slot)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? "Booking..." : "Book Appointment"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            * Required fields. We will contact you within 24 hours to confirm.
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: {
    padding: 20,
    paddingTop: 24,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0a2540",
    marginBottom: 8,
  },
  pageSubtitle: { fontSize: 14, color: "#6b7280", lineHeight: 20 },
  formCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#0a2540", marginBottom: 8 },
  input: {
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f9fafb",
    fontSize: 15,
    color: "#1f2937",
  },
  pickerContainer: { gap: 8 },
  pickerOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  pickerOptionSelected: { borderColor: "#ff6b35", backgroundColor: "#fff5f2" },
  pickerOptionText: { fontSize: 15, color: "#6b7280" },
  pickerOptionTextSelected: { color: "#ff6b35", fontWeight: "600" },
  helperText: { color: "#6b7280", fontSize: 14 },
  serviceChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  chipSelected: { borderColor: "#005a9c", backgroundColor: "#f0f9ff" },
  chipText: { fontSize: 14, color: "#6b7280" },
  chipTextSelected: { color: "#005a9c", fontWeight: "600" },
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  slotChip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  slotChipSelected: { borderColor: "#0ea5e9", backgroundColor: "#e0f2fe" },
  slotChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  slotChipTextSelected: { color: "#0369a1", fontWeight: "700" },
  dateButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  dateButtonText: { fontSize: 15, color: "#1f2937", fontWeight: "500" },
  submitButton: {
    backgroundColor: "#ff6b35",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: { backgroundColor: "#fca788", opacity: 0.6 },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  note: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
    lineHeight: 18,
  },
  // Success Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d4edda",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successCheckmark: {
    fontSize: 48,
    color: "#28a745",
    fontWeight: "bold",
  },
  successModalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0a2540",
    marginBottom: 12,
    textAlign: "center",
  },
  successModalMessage: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  successModalButton: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
