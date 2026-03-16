import { useRouter } from "expo-router";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useState } from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, db } from "../config/firebase";
import { PasswordReset } from "../components/password-reset";

export default function DoctorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Enter email and password");
      return;
    }

    setLoading(true);
    try {
      setLoginError("");
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password,
      );
      const userEmail = credential.user.email || "";

      // Ensure this user exists in the doctors collection
      const doctorQuery = query(
        collection(db, "doctors"),
        where("email", "==", userEmail),
      );
      const snap = await getDocs(doctorQuery);
      if (snap.empty) {
        await signOut(auth);
        const noProfileMessage = "No doctor profile found for this account.";
        setLoginError(noProfileMessage);
        Alert.alert("Access Denied", noProfileMessage);
        return;
      }

      router.push("/doctor-dashboard");
    } catch (error: any) {
      let message = "Login failed. Please try again.";
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
        message = "Wrong email or password.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Invalid email format.";
      } else if (error?.code === "auth/too-many-requests") {
        message = "Too many failed attempts. Try again later.";
      }
      setLoginError(message);
      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Doctor Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Doctor email"
          autoCapitalize="none"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (loginError) setLoginError("");
          }}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (loginError) setLoginError("");
          }}
          editable={!loading}
        />
        {!!loginError && <Text style={styles.errorText}>{loginError}</Text>}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Signing in..." : "Login"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => setShowPasswordReset(true)}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
      <PasswordReset
        visible={showPasswordReset}
        onClose={() => setShowPasswordReset(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  card: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 12,
    width: "90%",
    maxWidth: 420,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
    color: "#0a2540",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },
  button: {
    backgroundColor: "#0a2540",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontWeight: "700" },
  backButton: { marginTop: 12, alignItems: "center" },
  backButtonText: { color: "#0ea5e9", fontWeight: "600" },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 8,
  },
  forgotPasswordText: {
    color: '#6b7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 10,
  },
});
