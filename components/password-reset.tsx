import React, { useState } from 'react';
import {
  Modal,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';

interface PasswordResetProps {
  visible: boolean;
  onClose: () => void;
}

export function PasswordReset({ visible, onClose }: PasswordResetProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const handleClose = () => {
    setEmail('');
    setErrorText('');
    setSuccessText('');
    onClose();
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorText('Please enter your email address');
      setSuccessText('');
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes('@')) {
      setErrorText('Please enter a valid email address');
      setSuccessText('');
      return;
    }

    try {
      setLoading(true);
      setErrorText('');
      setSuccessText('');

      const fallbackUrl = 'https://dcdentalapp.vercel.app/reset-password';
      const webContinueUrl =
        Platform.OS === 'web' && typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : fallbackUrl;

      try {
        await sendPasswordResetEmail(auth, normalizedEmail, {
          url: webContinueUrl,
          handleCodeInApp: false,
        });
      } catch (innerError: any) {
        const code = innerError?.code;
        const shouldFallbackToDefaultFlow =
          code === 'auth/invalid-continue-uri' ||
          code === 'auth/unauthorized-continue-uri' ||
          code === 'auth/missing-continue-uri';

        if (!shouldFallbackToDefaultFlow) {
          throw innerError;
        }

        // Fallback keeps reset working when continue URL configuration differs between environments.
        await sendPasswordResetEmail(auth, normalizedEmail);
      }
      
      Alert.alert(
        'Success',
        'Password reset email sent! Please check your inbox and follow the instructions.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
            },
          },
        ]
      );

      setSuccessText(
        'Reset email sent. Please check your inbox and spam folder, then open the link to set a new password.',
      );
    } catch (error: any) {
      let errorMessage = 'Failed to send reset email';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Password reset is not enabled in Firebase Authentication settings.';
      } else if (error.code === 'auth/invalid-continue-uri' || error.code === 'auth/missing-continue-uri') {
        errorMessage = 'Password reset link configuration is invalid. Please contact support.';
      } else if (error?.code) {
        errorMessage = `Failed to send reset email (${error.code}).`;
      }
      
      setErrorText(errorMessage);
      setSuccessText('');
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.description}>
            Enter your email address and we will send you instructions to reset your password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorText) setErrorText('');
              if (successText) setSuccessText('');
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}
          {!!successText && <Text style={styles.successText}>{successText}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Email</Text>
            )}
          </TouchableOpacity>
        </View>
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
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
    fontWeight: '300',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    marginBottom: 12,
  },
  successText: {
    color: '#16a34a',
    fontSize: 13,
    marginBottom: 12,
  },
});
