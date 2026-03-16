import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../config/firebase';

export default function PatientRegister() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!name.trim()) return setErrorMessage('Please enter your full name'), false;
    if (!email.trim()) return setErrorMessage('Please enter your email'), false;
    if (!phone.trim()) return setErrorMessage('Please enter your phone number'), false;
    if (password.length < 6)
      return setErrorMessage('Password must be at least 6 characters'), false;
    if (password !== confirmPassword)
      return setErrorMessage('Passwords do not match'), false;

    setErrorMessage('');
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        password
      );

      await setDoc(doc(db, 'patients', userCredential.user.uid), {
        uid: userCredential.user.uid,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
      });

      setSuccess(true);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('This email is already registered. Please login.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Invalid email address.');
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ SUCCESS SCREEN (WEB SAFE)
  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successTitle}>🎉 Account Created!</Text>
        <Text style={styles.successText}>
          Your account has been created successfully.
        </Text>

        <TouchableOpacity
          style={styles.successButton}
          onPress={() => router.replace('/patient-login')}
        >
          <Text style={styles.successButtonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.registerCard}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join us to book appointments easily</Text>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          value={password}
          secureTextEntry
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError(
              text.length > 0 && text.length < 6
                ? 'Password must be at least 6 characters'
                : ''
            );
          }}
        />

        {passwordError ? (
          <Text style={styles.errorText}>{passwordError}</Text>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          secureTextEntry
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.registerButtonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  registerCard: { margin: 20, padding: 30, backgroundColor: '#fff', borderRadius: 16 },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center' },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  registerButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: { color: '#fff', fontWeight: '600' },
  errorText: { color: '#ef4444', fontSize: 13, marginBottom: 8 },

  // ✅ SUCCESS UI
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    padding: 20,
  },
  successTitle: { fontSize: 28, fontWeight: '700', marginBottom: 10 },
  successText: { fontSize: 15, color: '#374151', marginBottom: 20 },
  successButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },
  successButtonText: { color: '#fff', fontWeight: '600' },
});
