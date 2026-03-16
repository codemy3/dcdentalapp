import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface AppointmentFilterProps {
  onSearchChange: (query: string) => void;
  onDateFilterChange: (date: string) => void;
  onDoctorFilterChange: (doctor: string) => void;
}

export function AppointmentFilter({
  onSearchChange,
  onDateFilterChange,
  onDoctorFilterChange,
}: AppointmentFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    onSearchChange(text);
  };

  const handleDateChange = (text: string) => {
    setDateFilter(text);
    onDateFilterChange(text);
  };

  const handleDoctorChange = (text: string) => {
    setDoctorFilter(text);
    onDoctorFilterChange(text);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    setDoctorFilter('');
    onSearchChange('');
    onDateFilterChange('');
    onDoctorFilterChange('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search appointments..."
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text style={styles.filterButtonText}>
            {showFilters ? '▲' : '▼'} Filters
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <TextInput
            style={styles.filterInput}
            placeholder="Filter by date (YYYY-MM-DD)"
            value={dateFilter}
            onChangeText={handleDateChange}
          />
          <TextInput
            style={styles.filterInput}
            placeholder="Filter by doctor name"
            value={doctorFilter}
            onChangeText={handleDoctorChange}
          />
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filtersContainer: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
