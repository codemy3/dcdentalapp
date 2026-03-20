import React, { useState } from 'react';
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '../config/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import * as FileSystem from 'expo-file-system';

interface ReportUploadProps {
  visible: boolean;
  onClose: () => void;
  patientEmail: string;
  patientName: string;
  patientId: string;
  onUploadSuccess: () => void;
}

export const ReportUpload: React.FC<ReportUploadProps> = ({
  visible,
  onClose,
  patientEmail,
  patientName,
  patientId,
  onUploadSuccess,
}) => {
  const [description, setDescription] = useState('');
  const [reportType, setReportType] = useState('Medical Report');
  const [fileName, setFileName] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const reportTypes = ['Medical Report', 'Lab Test', 'X-Ray', 'Prescription', 'Treatment Notes', 'Other'];

  const MAX_UPLOAD_BYTES = 700 * 1024; // Keep below Firestore 1MB document limit after base64 expansion.

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result !== 'string') {
          reject(new Error('Unable to read selected file.'));
          return;
        }
        resolve(result.includes(',') ? result.split(',')[1] : result);
      };
      reader.onerror = () => reject(new Error('Unable to read selected file.'));
      reader.readAsDataURL(file);
    });

  const readSelectedFileAsBase64 = async (fileAsset: any) => {
    if (fileAsset?.file && typeof File !== 'undefined') {
      return fileToBase64(fileAsset.file as File);
    }

    if (fileAsset?.uri?.startsWith('data:')) {
      return fileAsset.uri.split(',')[1] || '';
    }

    if (fileAsset?.uri?.startsWith('blob:') || fileAsset?.uri?.startsWith('http')) {
      const response = await fetch(fileAsset.uri);
      const blob = await response.blob();
      return fileToBase64(new File([blob], fileAsset?.name || 'report'));
    }

    return FileSystem.readAsStringAsync(fileAsset.uri, {
      encoding: 'base64',
    });
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      if (!file.uri) {
        Alert.alert('Error', 'Could not read file. Please try another.');
        return;
      }

      const fileSizeBytes = file.size || 0;
      if (fileSizeBytes > MAX_UPLOAD_BYTES) {
        Alert.alert('Error', 'File too large. Please choose a file under 700 KB.');
        return;
      }

      setFileName(file.name || 'document');
      setFileUri(file.uri);
      setFileSize(fileSizeBytes);
      setSelectedFile(file);
      console.log('📄 File selected:', file.name, 'Size:', fileSizeBytes, 'bytes');
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!fileName || !fileUri) {
      Alert.alert('Error', 'Please choose a file first');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please add a description');
      return;
    }

    setUploading(true);
    try {
      const base64 = await readSelectedFileAsBase64(selectedFile || { uri: fileUri, name: fileName });

      // Store report with base64 data in Firestore
      const reportData = {
        patientId,
        patientEmail,
        patientName,
        fileName,
        fileData: base64, // Store base64 string
        fileSize,
        description: description.trim(),
        reportType,
        uploadedAt: serverTimestamp(),
        status: 'Active',
        visibleToDoctor: true,
      };

      console.log('📤 Uploading report:', { ...reportData, fileData: `[${fileSize} bytes]` });

      const reportsRef = collection(db, 'reports');
      const docRef = await addDoc(reportsRef, reportData);

      console.log('✅ Report uploaded successfully:', docRef.id);

      Alert.alert('Success', 'Report uploaded successfully');
      setDescription('');
      setFileName('');
      setFileUri('');
      setFileSize(0);
      setSelectedFile(null);
      setReportType('Medical Report');
      onUploadSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error uploading report:', error);
      const errorMessage = error?.message || 'Failed to upload report';
      
      if (errorMessage.toLowerCase().includes('permission')) {
        Alert.alert(
          'Permission Error',
          'You do not have permission to upload reports. Please ensure you are logged in as a patient and try again.'
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload Medical Report</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.label}>Patient: {patientName}</Text>

          <Text style={styles.sectionTitle}>Report Type</Text>
          <View style={styles.typeContainer}>
            {reportTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  reportType === type && styles.typeButtonActive,
                ]}
                onPress={() => setReportType(type)}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    reportType === type && styles.typeButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Select File</Text>
          <TouchableOpacity style={styles.fileButton} onPress={pickDocument}>
            <Text style={styles.fileButtonText}>
              {fileName ? `📎 ${fileName}` : '📎 Choose File (PDF/Doc/Image)'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Enter report description, findings, or notes..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
            onPress={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.uploadButtonText}>Upload Report</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeBtn: {
    fontSize: 24,
    color: '#666',
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
    paddingBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    marginBottom: 10,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#0066cc',
    borderColor: '#0066cc',
  },
  typeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  fileButton: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#0066cc',
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    marginBottom: 15,
  },
  fileButtonText: {
    fontSize: 16,
    color: '#0066cc',
    fontWeight: '500',
  },
  fileNameInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
  },
  descriptionInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
