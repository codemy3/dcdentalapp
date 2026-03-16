import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';

interface LogoutButtonProps {
  userType: 'patient' | 'doctor' | 'admin';
  style?: any;
}

export function LogoutButton({ userType, style }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    console.log('🚪 Logout button clicked for:', userType);
    
    // Use window.confirm for web, Alert.alert for native
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Are you sure you want to logout?');
      console.log('📱 Web confirmation result:', confirmed);
    } else {
      // For native platforms, use Alert.alert
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => console.log('Logout cancelled'),
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              await performLogout();
            },
          },
        ],
        { cancelable: true }
      );
      return; // Exit early for native, let Alert handle the callback
    }
    
    // For web, handle confirmation result immediately
    if (confirmed) {
      await performLogout();
    } else {
      console.log('Logout cancelled');
    }
  };

  const performLogout = async () => {
    try {
      console.log('🔄 Attempting to sign out...');
      await signOut(auth);
      console.log('✅ Sign out successful');
      
      // Navigate to appropriate login screen
      const loginRoutes: Record<typeof userType, string> = {
        patient: '/patient-login',
        doctor: '/doctor-login',
        admin: '/admin-login',
      };
      
      const targetRoute = loginRoutes[userType];
      console.log('🔀 Navigating to:', targetRoute);
      
      router.replace(targetRoute as any);
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      if (Platform.OS === 'web') {
        window.alert('Error: ' + (error.message || 'Failed to logout'));
      } else {
        Alert.alert('Error', error.message || 'Failed to logout');
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.logoutButton, style]}
      onPress={handleLogout}
    >
      <Text style={styles.logoutText}>🚪 Logout</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
