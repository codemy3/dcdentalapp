import { useRouter } from "expo-router";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      {/* Hero Section with Logo */}
      <View style={styles.hero}>
        <Text style={styles.welcomeText}>Welcome to</Text>

        {/* Logo - Replace this with actual logo */}
        <View style={styles.logoContainer}>
          {/* OPTION 1: If you have logo.png in assets/images/ */}
          <Image
            source={require("../assets/images/logo.jpg")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.heroDesc}>
          Your trusted healthcare partner providing quality dental and medical
          services
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/appointment")}
        >
          <Text style={styles.buttonText}>Book Now</Text>
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <View style={styles.servicesGrid}>
        {/* Dental Care Card */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceIcon}>🦷</Text>
          <Text style={styles.serviceTitle}>Dental Care</Text>
          <Text style={styles.serviceDesc}>
            Comprehensive dental treatments including cleaning, fillings, and
            cosmetic procedures.
          </Text>
        </View>

        {/* General Medicine Card */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceIcon}>🏥</Text>
          <Text style={styles.serviceTitle}>General Medicine</Text>
          <Text style={styles.serviceDesc}>
            Expert medical consultation and treatment for various health
            conditions.
          </Text>
        </View>

        {/* Flexible Hours */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceIcon}>⏰</Text>
          <Text style={styles.serviceTitle}>Flexible Hours</Text>
          <Text style={styles.serviceDesc}>
            Open 7 days a week with convenient appointment slots.
          </Text>
        </View>
      </View>

      {/* Contact Section */}
      <View style={styles.contactCard}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.contactText}>
          📍 Address: Agnes Water, QLD, Australia
        </Text>
        <Text style={styles.contactText}>📞 Phone: (07) 4974 9006</Text>
        <Text style={styles.contactText}>
          ✉️ Email: info@dcdentalmedical.com.au
        </Text>
        <Text style={styles.contactText}>
          🕐 Hours: Mon-Fri: 8:30 AM - 5:00 PM
        </Text>
      </View>

      {/* Quick Navigation */}
      <View style={styles.quickNav}>
        <TouchableOpacity
          style={styles.patientButton}
          onPress={() => router.push("/patient-login")}
        >
          <Text style={styles.patientButtonText}>👤 Patient Portal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.doctorButton}
          onPress={() => router.push("/doctor-login")}
        >
          <Text style={styles.doctorButtonText}>🩺 Doctor Portal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.adminButton}
          onPress={() => router.push("/admin-login")}
        >
          <Text style={styles.adminButtonText}>🔐 Admin Dashboard</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  hero: {
    backgroundColor: "#0a2540",
    padding: 32,
    paddingTop: 40,
    paddingBottom: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: "center",
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 250,
    height: 100,
  },
  // Temporary logo placeholder
  logoPlaceholder: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoPlaceholderText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ff6b35",
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0a2540",
    marginTop: 4,
    letterSpacing: 2,
  },
  heroDesc: {
    fontSize: 14,
    color: "#e0e7ff",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#ff6b35",
    padding: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  servicesGrid: {
    padding: 16,
    paddingTop: 24,
  },
  serviceCard: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#ff6b35",
  },
  serviceIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0a2540",
    marginBottom: 8,
  },
  serviceDesc: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
    marginBottom: 8,
  },
  learnMore: {
    fontSize: 14,
    color: "#ff6b35",
    fontWeight: "600",
    marginTop: 4,
  },
  contactCard: {
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
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0a2540",
    marginBottom: 16,
  },
  contactText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 10,
    lineHeight: 20,
  },
  quickNav: {
    padding: 16,
    paddingBottom: 32,
  },
  secondaryButton: {
    backgroundColor: "#005a9c",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  patientButton: {
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  patientButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  doctorButton: {
    backgroundColor: "#0ea5e9",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  doctorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  adminButton: {
    backgroundColor: "#6b7280",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
    borderWidth: 2,
    borderColor: "#9ca3af",
  },
  adminButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
