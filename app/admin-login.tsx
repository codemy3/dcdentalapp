import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { PasswordReset } from '../components/password-reset';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Enter email and password');
      return;
    }

    try {
      setLoading(true);
      setLoginError('');
      await signInWithEmailAndPassword(auth, email.trim(), password);

      // ✅ Firebase auth success
      router.push('/admin-dashboard');
    } catch (error: any) {
      let message = 'Invalid admin credentials.';
      if (error?.code === 'auth/invalid-email') {
        message = 'Invalid email format.';
      } else if (error?.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Try again later.';
      }
      setLoginError(message);
      Alert.alert('Access Denied', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        <Text style={styles.title}>Admin Login</Text>

        <TextInput
          style={styles.input}
          placeholder="Admin email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (loginError) setLoginError('');
          }}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (loginError) setLoginError('');
          }}
        />

        {!!loginError && <Text style={styles.errorText}>{loginError}</Text>}

        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={() => setShowPasswordReset(true)}
          disabled={loading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
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
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loginCard: { backgroundColor: '#fff', padding: 30, borderRadius: 12, width: '90%' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 },
  button: { backgroundColor: '#0a2540', padding: 14, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 12,
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
