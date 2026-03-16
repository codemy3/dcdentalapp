import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  bloodType?: string;
  allergies?: string;
  medicalHistory?: string;
}

interface PatientProfileManagerProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdate?: () => void;
}

export default function PatientProfileManager({
  visible,
  onClose,
  onProfileUpdate,
}: PatientProfileManagerProps) {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [editForm, setEditForm] = useState<Partial<PatientProfile>>({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchProfile();
    }
  }, [visible]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'patients', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as PatientProfile;
        setProfile({ ...data, id: user.uid });
        setEditForm({ ...data });
      } else {
        // Create default profile
        const defaultProfile: PatientProfile = {
          id: user.uid,
          name: user.displayName || '',
          email: user.email || '',
          phone: '',
        };
        setProfile(defaultProfile);
        setEditForm(defaultProfile);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Validate required fields
      if (!editForm.name?.trim() || !editForm.email?.trim() || !editForm.phone?.trim()) {
        Alert.alert('Error', 'Name, email, and phone are required');
        return;
      }

      // Validate phone format
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(editForm.phone.replace(/[^\d]/g, ''))) {
        Alert.alert('Error', 'Please enter a valid 10-digit phone number');
        return;
      }

      // Validate date of birth format if provided
      if (editForm.dateOfBirth) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(editForm.dateOfBirth)) {
          Alert.alert('Error', 'Date of birth must be in YYYY-MM-DD format');
          return;
        }
      }

      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, 'patients', user.uid);
      await updateDoc(docRef, {
        ...editForm,
        updatedAt: serverTimestamp(),
      });

      setProfile({ ...editForm, id: user.uid } as PatientProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
      onProfileUpdate?.();
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity
          onPress={() => {
            if (editing) {
              setEditForm(profile);
            }
            setEditing(!editing);
          }}
        >
          <Text style={styles.editButton}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
          {/* Basic Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Name *</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.name || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, name: text })
                  }
                  placeholder="Your full name"
                />
              ) : (
                <Text style={styles.value}>{profile.name || 'N/A'}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email *</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.email || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, email: text })
                  }
                  placeholder="Email address"
                  keyboardType="email-address"
                  editable={false}
                />
              ) : (
                <Text style={styles.value}>{profile.email || 'N/A'}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone *</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.phone || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, phone: text })
                  }
                  placeholder="10-digit phone number"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.value}>{profile.phone || 'N/A'}</Text>
              )}
            </View>
          </View>

          {/* Personal Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Date of Birth</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.dateOfBirth || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, dateOfBirth: text })
                  }
                  placeholder="YYYY-MM-DD"
                />
              ) : (
                <Text style={styles.value}>
                  {profile.dateOfBirth || 'Not provided'}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Blood Type</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.bloodType || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, bloodType: text })
                  }
                  placeholder="e.g., O+, A-, B+, AB"
                />
              ) : (
                <Text style={styles.value}>
                  {profile.bloodType || 'Not provided'}
                </Text>
              )}
            </View>
          </View>

          {/* Address Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Address</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Street Address</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.address || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, address: text })
                  }
                  placeholder="Street address"
                />
              ) : (
                <Text style={styles.value}>{profile.address || 'N/A'}</Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>City</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  value={editForm.city || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, city: text })
                  }
                  placeholder="City"
                />
              ) : (
                <Text style={styles.value}>{profile.city || 'N/A'}</Text>
              )}
            </View>
          </View>

          {/* Medical Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Medical Information</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Allergies</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.allergies || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, allergies: text })
                  }
                  placeholder="List any allergies (comma-separated)"
                  multiline
                />
              ) : (
                <Text style={styles.value}>
                  {profile.allergies || 'None reported'}
                </Text>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Medical History</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.medicalHistory || ''}
                  onChangeText={(text) =>
                    setEditForm({ ...editForm, medicalHistory: text })
                  }
                  placeholder="Any relevant medical history"
                  multiline
                />
              ) : (
                <Text style={styles.value}>
                  {profile.medicalHistory || 'None recorded'}
                </Text>
              )}
            </View>
          </View>

          {editing && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          )}

          <View style={styles.spacing} />
        </ScrollView>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
    marginTop: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  editButton: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  container: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#22c55e',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  value: {
    fontSize: 14,
    color: '#333',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  spacing: {
    height: 32,
  },
});
