import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

interface DoctorReportUploadProps {
  visible: boolean;
  onClose: () => void;
  patientEmail: string;
  patientName: string;
  doctorName: string;
  onUploadSuccess?: () => void;
}

const REPORT_TYPES = [
  'Medical Report',
  'Lab Test',
  'X-Ray',
  'Prescription',
  'Treatment Notes',
  'Other',
];

export function DoctorReportUpload({
  visible,
  onClose,
  patientEmail,
  patientName,
  doctorName,
  onUploadSuccess,
}: DoctorReportUploadProps) {
  const [reportType, setReportType] = useState('Medical Report');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTypeList, setShowTypeList] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setSelectedFile(file);
        Alert.alert('Success', `File selected: ${file.name}`);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!reportType.trim() || !description.trim()) {
      Alert.alert('Error', 'Please select report type and add description');
      return;
    }

    if (!selectedFile) {
      Alert.alert('Error', 'Please select a file to upload');
      return;
    }

    try {
      setLoading(true);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: 'base64',
      });

      // Create report in Firestore
      const reportId = `${patientEmail}_${Date.now()}`;
      await setDoc(doc(db, 'reports', reportId), {
        patientEmail,
        patientName,
        type: reportType.trim(),
        description: description.trim(),
        uploadedBy: 'doctor',
        uploadedByName: doctorName,
        uploadedAt: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
        fileName: selectedFile.name,
        fileType: selectedFile.mimeType,
        fileData: base64,
      });

      Alert.alert('Success', 'Report uploaded successfully');
      resetForm();
      onUploadSuccess?.();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload report');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReportType('Medical Report');
    setDescription('');
    setShowTypeList(false);
    setSelectedFile(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Upload Patient Report</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Patient: <Text style={styles.infoBold}>{patientName}</Text></Text>
              <Text style={styles.infoLabel}>Doctor: <Text style={styles.infoBold}>{doctorName}</Text></Text>
            </View>

            <Text style={styles.label}>Report Type *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTypeList(!showTypeList)}
            >
              <Text style={styles.pickerButtonText}>{reportType}</Text>
              <Text>{showTypeList ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showTypeList && (
              <View style={styles.pickerList}>
                {REPORT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerItem}
                    onPress={() => {
                      setReportType(type);
                      setShowTypeList(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Description/Notes *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe the report, findings, or important notes..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              editable={!loading}
              placeholderTextColor="#999"
            />

            <Text style={styles.label}>Select File *</Text>
            <TouchableOpacity
              style={styles.filePickerButton}
              onPress={pickDocument}
              disabled={loading}
            >
              <Text style={styles.filePickerIcon}>📎</Text>
              <Text style={styles.filePickerText}>
                {selectedFile ? selectedFile.name : 'Choose file (PDF or Image)'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
              💡 Tip: Provide clear descriptions so the patient understands the report
            </Text>

            <TouchableOpacity
              style={[styles.uploadButton, loading && styles.buttonDisabled]}
              onPress={handleUpload}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>📤 Upload Report</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
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
  content: {
    padding: 20,
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
  },
  infoLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
  },
  infoBold: {
    fontWeight: '600',
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
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
    marginBottom: 12,
  },
  pickerButtonText: {
    fontSize: 14,
    color: '#333',
  },
  pickerList: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerItemText: {
    fontSize: 14,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#0284c7',
    marginTop: 8,
    marginBottom: 20,
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 6,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#06b6d4',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#ecfeff',
    marginBottom: 12,
  },
  filePickerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  filePickerText: {
    flex: 1,
    fontSize: 14,
    color: '#0e7490',
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#0ea5e9',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
