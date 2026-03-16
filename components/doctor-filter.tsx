import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  email: string;
  phone: string;
}

interface DoctorFilterProps {
  onDoctorSelect: (doctor: Doctor) => void;
  onSpecializationChange?: (spec: string) => void;
}

const SPECIALIZATIONS = [
  'General Dentistry',
  'Orthodontics',
  'Pediatric Dentistry',
  'Periodontics',
  'Endodontics',
  'Prosthodontics',
  'Oral Surgery',
  'All Specializations'
];

export default function DoctorFilter({ onDoctorSelect, onSpecializationChange }: DoctorFilterProps) {
  const [selectedSpec, setSelectedSpec] = useState('All Specializations');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [selectedSpec]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      let doctorQuery = query(collection(db, 'doctors'));
      
      if (selectedSpec !== 'All Specializations') {
        doctorQuery = query(
          collection(db, 'doctors'),
          where('specialization', '==', selectedSpec)
        );
      }
      
      const snapshot = await getDocs(doctorQuery);
      const doctorList: Doctor[] = [];
      
      snapshot.forEach((doc) => {
        doctorList.push({
          id: doc.id,
          ...doc.data() as Omit<Doctor, 'id'>
        });
      });
      
      setDoctors(doctorList);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationChange = (spec: string) => {
    setSelectedSpec(spec);
    onSpecializationChange?.(spec);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Specialization</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.specScroll}
      >
        {SPECIALIZATIONS.map((spec) => (
          <TouchableOpacity
            key={spec}
            style={[
              styles.specButton,
              selectedSpec === spec && styles.specButtonActive
            ]}
            onPress={() => handleSpecializationChange(spec)}
          >
            <Text
              style={[
                styles.specText,
                selectedSpec === spec && styles.specTextActive
              ]}
            >
              {spec}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.subtitle}>Available Doctors</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading doctors...</Text>
      ) : doctors.length > 0 ? (
        <ScrollView contentContainerStyle={styles.doctorList}>
          {doctors.map((doctor) => (
            <TouchableOpacity
              key={doctor.id}
              style={styles.doctorCard}
              onPress={() => onDoctorSelect(doctor)}
            >
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <Text style={styles.doctorSpec}>{doctor.specialization}</Text>
              <Text style={styles.doctorPhone}>{doctor.phone}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.noDoctors}>No doctors available for this specialization</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  specScroll: {
    paddingVertical: 8,
    gap: 8,
  },
  specButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  specButtonActive: {
    backgroundColor: '#22c55e',
  },
  specText: {
    fontSize: 13,
    color: '#666',
  },
  specTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333',
  },
  doctorList: {
    paddingVertical: 8,
  },
  doctorCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  doctorSpec: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  doctorPhone: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 12,
  },
  noDoctors: {
    textAlign: 'center',
    color: '#999',
    marginTop: 12,
  },
});
