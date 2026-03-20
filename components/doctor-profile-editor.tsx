import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface DoctorProfileEditorProps {
  visible: boolean;
  onClose: () => void;
  doctorId: string;
  onProfileUpdated?: () => void;
}

const SPECIALIZATIONS = [
  'General Dentistry',
  'Orthodontics',
  'Endodontics',
  'Periodontics',
  'Prosthodontics',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Cosmetic Dentistry',
];

export function DoctorProfileEditor({
  visible,
  onClose,
  doctorId,
  onProfileUpdated,
}: DoctorProfileEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [showSpecializations, setShowSpecializations] = useState(false);

  useEffect(() => {
    if (visible && doctorId) {
      loadDoctorProfile();
    }
  }, [visible, doctorId]);

  const loadDoctorProfile = async () => {
    try {
      setLoading(true);
      const doctorRef = doc(db, 'doctors', doctorId);
      const doctorSnap = await getDoc(doctorRef);

      if (doctorSnap.exists()) {
        const data = doctorSnap.data();
        setName(data.name || '');
        setPhone(data.phone || '');
        setSpecialization(data.specialization || '');
        setBio(data.bio || '');
        setExperience(data.experience || '');
        setEducation(data.education || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits && (phoneDigits.length < 7 || phoneDigits.length > 15)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      setSaving(true);
      const doctorRef = doc(db, 'doctors', doctorId);
      
      await updateDoc(doctorRef, {
        name: name.trim(),
        phone: phone.trim(),
        specialization: specialization.trim(),
        bio: bio.trim(),
        experience: experience.trim(),
        education: education.trim(),
        updatedAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'Profile updated successfully');
      onProfileUpdated?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <ScrollView style={styles.content}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Full Name"
              />

              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="10-digit phone number"
                keyboardType="phone-pad"
                maxLength={10}
              />

              <Text style={styles.label}>Specialization</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowSpecializations(!showSpecializations)}
              >
                <Text style={styles.pickerButtonText}>
                  {specialization || 'Select Specialization'}
                </Text>
                <Text>{showSpecializations ? '▲' : '▼'}</Text>
              </TouchableOpacity>

              {showSpecializations && (
                <View style={styles.pickerList}>
                  {SPECIALIZATIONS.map((spec) => (
                    <TouchableOpacity
                      key={spec}
                      style={styles.pickerItem}
                      onPress={() => {
                        setSpecialization(spec);
                        setShowSpecializations(false);
                      }}
                    >
                      <Text style={styles.pickerItemText}>{spec}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={bio}
                onChangeText={setBio}
                placeholder="Brief introduction about yourself"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Experience</Text>
              <TextInput
                style={styles.input}
                value={experience}
                onChangeText={setExperience}
                placeholder="e.g., 10 years"
              />

              <Text style={styles.label}>Education</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={education}
                onChangeText={setEducation}
                placeholder="Degrees, certifications, etc."
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
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
    width: '95%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
  },
  loadingContainer: {
    padding: 50,
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: 5,
    backgroundColor: '#fff',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
