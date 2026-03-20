import { useLocalSearchParams, useRouter } from "expo-router";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    oobCode?: string;
    mode?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const code = typeof params.oobCode === "string" ? params.oobCode : "";

  useEffect(() => {
    const validateResetCode = async () => {
      if (!code) {
        setErrorText("Invalid or missing reset link.");
        setLoading(false);
        return;
      }

      try {
        const resolvedEmail = await verifyPasswordResetCode(auth, code);
        setEmail(resolvedEmail || "");
        setValidCode(true);
      } catch (error: any) {
        const codeValue = error?.code || "";
        if (codeValue === "auth/expired-action-code") {
          setErrorText("This reset link has expired. Please request a new one.");
        } else if (codeValue === "auth/invalid-action-code") {
          setErrorText("This reset link is invalid or already used.");
        } else {
          setErrorText("Unable to verify reset link. Please request a new one.");
        }
      } finally {
        setLoading(false);
      }
    };

    validateResetCode();
  }, [code]);

  const handleSubmit = async () => {
    if (!validCode) return;

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorText("Please enter and confirm your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorText("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorText("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorText("");
      setSuccessText("");
      await confirmPasswordReset(auth, code, newPassword);
      setSuccessText("Password reset successful. Redirecting to login...");

      // Web popup alerts can be blocked; always provide inline success + timed redirect.
      setTimeout(() => {
        router.replace("/patient-login");
      }, 1500);

      Alert.alert("Success", "Password reset successful. Please log in.");
    } catch (error: any) {
      const codeValue = error?.code || "";
      setSuccessText("");
      if (codeValue === "auth/weak-password") {
        setErrorText("Please choose a stronger password.");
      } else if (codeValue === "auth/expired-action-code") {
        setErrorText("This reset link has expired. Please request a new one.");
      } else if (codeValue === "auth/invalid-action-code") {
        setErrorText("This reset link is invalid or already used.");
      } else {
        setErrorText("Failed to reset password. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a2540" />
        <Text style={styles.loadingText}>Validating reset link...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset Password</Text>
        {!!email && <Text style={styles.emailText}>Account: {email}</Text>}

        <TextInput
          style={styles.input}
          placeholder="New password"
          secureTextEntry
          value={newPassword}
          onChangeText={(text) => {
            setNewPassword(text);
            if (errorText) setErrorText("");
          }}
          editable={validCode && !submitting}
        />

        <TextInput
          style={styles.input}
          placeholder="Confirm new password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errorText) setErrorText("");
          }}
          editable={validCode && !submitting}
        />

        {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
        {!!successText && <Text style={styles.successText}>{successText}</Text>}

        <TouchableOpacity
          style={[styles.button, (!validCode || submitting) && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!validCode || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Set New Password</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/")}> 
          <Text style={styles.backText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#6b7280",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "100%",
    maxWidth: 420,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0a2540",
    marginBottom: 8,
    textAlign: "center",
  },
  emailText: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginBottom: 10,
  },
  successText: {
    color: "#16a34a",
    fontSize: 13,
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#0a2540",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  backButton: {
    marginTop: 14,
    alignItems: "center",
  },
  backText: {
    color: "#0ea5e9",
    fontWeight: "600",
  },
});
