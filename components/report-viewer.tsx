import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  Platform,
} from 'react-native';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface Report {
  id: string;
  patientName: string;
  fileName: string;
  description: string;
  reportType: string;
  uploadedAt: any;
  status: string;
  fileData?: string; // base64 string
}

interface ReportViewerProps {
  visible: boolean;
  onClose: () => void;
  patientEmail?: string;
  patientId?: string;
  isDoctor?: boolean;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  visible,
  onClose,
  patientEmail,
  patientId,
  isDoctor = false,
}) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;

    let reportsQuery;
    
    if (isDoctor && patientId) {
      // Doctor viewing patient's reports
      reportsQuery = query(
        collection(db, 'reports'),
        where('patientId', '==', patientId),
        where('visibleToDoctor', '==', true)
      );
    } else if (patientEmail) {
      // Patient viewing their own reports
      reportsQuery = query(
        collection(db, 'reports'),
        where('patientEmail', '==', patientEmail)
      );
    } else {
      return;
    }

    const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData: Report[] = [];
      snapshot.forEach((doc) => {
        reportsData.push({
          id: doc.id,
          ...doc.data(),
        } as Report);
      });

      // Sort by date descending
      reportsData.sort((a, b) => {
        const dateA = a.uploadedAt?.toDate?.() || new Date(0);
        const dateB = b.uploadedAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setReports(reportsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [visible, patientEmail, patientId, isDoctor]);

  const handleDeleteReport = (reportId: string) => {
    if (isDoctor) {
      Alert.alert('Info', 'Only the patient can delete reports');
      return;
    }

    Alert.alert('Delete Report', 'Are you sure you want to delete this report?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'reports', reportId));
            Alert.alert('Success', 'Report deleted successfully');
          } catch (error) {
            console.error('Error deleting report:', error);
            Alert.alert('Error', 'Failed to delete report');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const handleViewReport = async (item: Report) => {
    if (!item.fileData) {
      Alert.alert('Error', 'File data not available');
      return;
    }

    try {
      if (Platform.OS === 'web') {
        // For web: create a download link
        const mimeType = item.fileName.endsWith('.pdf') 
          ? 'application/pdf' 
          : item.fileName.match(/\.(jpg|jpeg|png|gif)$/i) 
          ? 'image/jpeg' 
          : 'application/octet-stream';
        
        const base64Data = item.fileData;
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        
        // Create a temporary link and click it
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = item.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Alert.alert('Success', 'File downloaded');
      } else {
        // For native: save to temp file and share
        const baseDir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
        const fileUri = `${baseDir}${item.fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, item.fileData, {
          encoding: 'base64',
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `File saved to: ${fileUri}`);
        }
      }
    } catch (error) {
      console.error('Error viewing report:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportType}>{item.reportType}</Text>
          <Text style={styles.fileName}>📄 {item.fileName}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={() => handleViewReport(item)} style={styles.viewBtn}>
            <Text style={styles.viewBtnText}>👁️ View</Text>
          </TouchableOpacity>
          {!isDoctor && (
            <TouchableOpacity onPress={() => handleDeleteReport(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.date}>{formatDate(item.uploadedAt)}</Text>
    </View>
  );

  const emptyMessage = isDoctor 
    ? "No reports uploaded by this patient yet"
    : "You haven't uploaded any reports yet";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isDoctor ? 'Patient Reports' : 'My Medical Reports'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centerContent}>
            <Text>Loading...</Text>
          </View>
        ) : reports.length === 0 ? (
          <View style={styles.centerContent}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={renderReportItem}
            contentContainerStyle={styles.listContent}
            scrollEnabled={true}
          />
        )}
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
  listContent: {
    padding: 15,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reportInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewBtn: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reportType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066cc',
    marginBottom: 5,
  },
  fileName: {
    fontSize: 13,
    color: '#666',
  },
  deleteBtn: {
    fontSize: 18,
    padding: 5,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
});
