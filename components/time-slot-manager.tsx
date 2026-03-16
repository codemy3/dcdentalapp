import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface TimeSlotManagerProps {
  doctorId: string;
  selectedDate: string;
  onSlotSelect: (time: string) => void;
}

const CLINIC_HOURS = {
  start: 9, // 9 AM
  end: 17,  // 5 PM
  slotDuration: 30 // minutes
};

export default function TimeSlotManager({ doctorId, selectedDate, onSlotSelect }: TimeSlotManagerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateAndCheckSlots();
  }, [doctorId, selectedDate]);

  const generateAndCheckSlots = async () => {
    try {
      setLoading(true);
      const slots: TimeSlot[] = [];

      // Generate all possible time slots
      for (let hour = CLINIC_HOURS.start; hour < CLINIC_HOURS.end; hour++) {
        for (let min = 0; min < 60; min += CLINIC_HOURS.slotDuration) {
          const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
          slots.push({ time, available: true });
        }
      }

      // Check booked appointments
      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('date', '==', selectedDate),
        where('status', '!=', 'Cancelled')
      );

      const snapshot = await getDocs(appointmentsQuery);
      const bookedTimes = new Set<string>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.time) bookedTimes.add(data.time);
      });

      // Mark booked slots as unavailable
      const updatedSlots = slots.map(slot => ({
        ...slot,
        available: !bookedTimes.has(slot.time)
      }));

      setTimeSlots(updatedSlots);
    } catch (error) {
      console.error('Failed to generate time slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const isPastDate = () => {
    const selected = new Date(selectedDate);
    const today = new Date();
    return selected < today;
  };

  if (isPastDate()) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Cannot book appointments in the past</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Time Slot</Text>
      <Text style={styles.dateText}>Date: {selectedDate}</Text>

      {loading ? (
        <Text style={styles.loadingText}>Loading available slots...</Text>
      ) : timeSlots.length === 0 ? (
        <Text style={styles.noSlotsText}>No time slots available</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.slotsGrid}>
          {timeSlots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              style={[
                styles.slotButton,
                !slot.available && styles.slotButtonDisabled,
              ]}
              onPress={() => slot.available && onSlotSelect(slot.time)}
              disabled={!slot.available}
            >
              <Text
                style={[
                  styles.slotText,
                  !slot.available && styles.slotTextDisabled,
                ]}
              >
                {slot.time}
              </Text>
              {!slot.available && <Text style={styles.bookedLabel}>Booked</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#e5e5e5' }]} />
          <Text style={styles.legendText}>Booked</Text>
        </View>
      </View>
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
    marginBottom: 8,
    color: '#333',
  },
  dateText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
  },
  slotButton: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
  },
  slotButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  slotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  slotTextDisabled: {
    color: '#999',
  },
  bookedLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginVertical: 16,
  },
  noSlotsText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    marginVertical: 16,
    fontSize: 14,
    fontWeight: '600',
  },
});
