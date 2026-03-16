import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getApps, initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db, firebaseConfig } from "../config/firebase";

// Use a secondary Firebase app so creating doctor accounts does not replace the admin session
const secondaryApp =
  getApps().find((app) => app.name === "admin-secondary") ||
  initializeApp(firebaseConfig, "admin-secondary");
const secondaryAuth = getAuth(secondaryApp);

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("Doctor@123");
  const [loading, setLoading] = useState(false);

  /** 🔹 Fetch Doctors */
  const fetchDoctors = async () => {
    try {
      const snapshot = await getDocs(collection(db, "doctors"));
      const list: Doctor[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<Doctor, "id">;

        list.push({
          id: docSnap.id, // ✅ correct Firestore document ID
          ...data,
        });
      });

      setDoctors(list);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to load doctors");
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  /** 🔹 Add Doctor */
  const addDoctor = async () => {
    if (!name || !specialization || !email || !phone || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

      // Check if doctor email already exists in Firestore
      const existingDoctors = await getDocs(collection(db, "doctors"));
      const emailExists = existingDoctors.docs.some(
        doc => doc.data().email === email.trim().toLowerCase()
      );
    
      if (emailExists) {
        Alert.alert("Error", "A doctor with this email already exists");
        return;
      }

    try {
      setLoading(true);

      // Create Firebase Auth account for the doctor without affecting the admin session
      await createUserWithEmailAndPassword(
        secondaryAuth,
        email.trim().toLowerCase(),
        password,
      );

      // Add doctor to Firestore
      await addDoc(collection(db, "doctors"), {
        name,
        specialization,
        email: email.trim().toLowerCase(),
        phone,
        createdAt: new Date().toISOString(),
      });

      setName("");
      setSpecialization("");
      setEmail("");
      setPhone("");
      setPassword("Doctor@123");

      Alert.alert(
        "Success",
        `Doctor added successfully!\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease save these credentials.`,
      );
      fetchDoctors();
    } catch (error: any) {
      console.error(error);
        let message = "Failed to add doctor";
      
        if (error?.code === "auth/email-already-in-use") {
          message = "This email is already registered in the system. Please use a different email.";
        } else if (error?.code === "auth/invalid-email") {
          message = "Invalid email format. Please enter a valid email address.";
        } else if (error?.code === "auth/weak-password") {
          message = "Password is too weak. Please use a stronger password.";
        } else if (error?.message) {
          message = error.message;
        }
      
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  /** 🔹 Delete Doctor */
  const removeDoctor = async (doctorId: string, doctorName: string) => {
    // Use window.confirm for web compatibility; Alert can be ignored by web builds.
    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(`Remove Dr. ${doctorName}?`)
        : true;
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "doctors", doctorId));
      Alert.alert("Success", "Doctor removed successfully");
      fetchDoctors();
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to remove doctor");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Doctors Management</Text>

      {/* ➕ Add Doctor */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Doctor</Text>

        <TextInput
          style={styles.input}
          placeholder="Doctor Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Specialization"
          value={specialization}
          onChangeText={setSpecialization}
        />

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Default Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Text style={styles.helperText}>
          This password will be used for doctor login. Default: Doctor@123
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={addDoctor}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? "Adding..." : "+ Add Doctor"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 👨‍⚕️ Doctors List */}
      <Text style={styles.sectionTitle}>Doctors List</Text>

      {doctors.length === 0 ? (
        <Text style={styles.emptyText}>No doctors added yet</Text>
      ) : (
        doctors.map((docItem) => (
          <View key={docItem.id} style={styles.doctorCard}>
            <Text style={styles.doctorName}>Dr. {docItem.name}</Text>
            <Text style={styles.info}>{docItem.specialization}</Text>
            <Text style={styles.info}>{docItem.email}</Text>
            <Text style={styles.info}>{docItem.phone}</Text>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => removeDoctor(docItem.id, docItem.name)}
            >
              <Text style={styles.deleteText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 16 },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  cardTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },

  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 12,
    marginTop: -6,
  },

  addButton: {
    backgroundColor: "#0ea5e9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "#fff", fontWeight: "600" },

  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  emptyText: { textAlign: "center", color: "#6b7280" },

  doctorCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  doctorName: { fontSize: 16, fontWeight: "700" },
  info: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  deleteButton: {
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  deleteText: { color: "#dc2626", fontWeight: "600" },
});
