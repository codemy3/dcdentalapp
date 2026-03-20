import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface Report {
  id: string;
  name: string;
  type: string;
  description: string;
  uploadedAt: string;
  uploadedAtMs: number;
  uploadedBy: string; // 'patient' or 'doctor'
  patientName: string;
}

interface DoctorReportViewerProps {
  visible: boolean;
  onClose: () => void;
  patientEmail: string;
  patientName: string;
}

export function DoctorReportViewer({
  visible,
  onClose,
  patientEmail,
  patientName,
}: DoctorReportViewerProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    if (visible) {
      loadReports();
    }
  }, [visible, patientEmail]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'reports'),
        where('patientEmail', '==', patientEmail)
      );

      const snapshot = await getDocs(q);
      const data: Report[] = [];

      snapshot.forEach((doc) => {
        const docData = doc.data();
        const rawUploadedAt = docData.uploadedAt;
        const uploadedAtMs =
          rawUploadedAt instanceof Timestamp
            ? rawUploadedAt.toMillis()
            : new Date(rawUploadedAt || 0).getTime();
        data.push({
          id: doc.id,
          name: docData.name || 'Report',
          type: docData.type || 'Medical Report',
          description: docData.description || '',
          uploadedAt: new Date(uploadedAtMs || Date.now()).toISOString(),
          uploadedAtMs,
          uploadedBy: docData.uploadedBy || 'patient',
          patientName: docData.patientName || '',
        });
      });

      // Sort by date (newest first)
      data.sort((a, b) => b.uploadedAtMs - a.uploadedAtMs);
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUploadedByLabel = (uploadedBy: string) => {
    return uploadedBy === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Patient';
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <TouchableOpacity
      style={styles.reportCard}
      onPress={() => setSelectedReport(item)}
    >
      <View style={styles.reportHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reportType}>{item.type}</Text>
          <Text style={styles.reportUploadedBy}>{getUploadedByLabel(item.uploadedBy)}</Text>
        </View>
        <Text style={styles.reportDate}>
          {new Date(item.uploadedAt).toLocaleDateString()}
        </Text>
      </View>
      {item.description && (
        <Text style={styles.reportDescription} numberOfLines={2}>
          {item.description}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Medical Reports</Text>
              <Text style={styles.subtitle}>Patient: {patientName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={styles.loadingText}>Loading reports...</Text>
            </View>
          ) : reports.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyText}>📄 No reports available</Text>
              <Text style={styles.emptySubText}>
                Reports will appear here when uploaded
              </Text>
            </View>
          ) : (
            <FlatList
              data={reports}
              renderItem={renderReportItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>

        {/* Report Detail Modal */}
        {selectedReport && (
          <Modal visible={!!selectedReport} transparent animationType="fade">
            <View style={styles.overlay}>
              <View style={[styles.modal, styles.detailModal]}>
                <View style={styles.header}>
                  <Text style={styles.title}>Report Details</Text>
                  <TouchableOpacity
                    onPress={() => setSelectedReport(null)}
                    style={styles.closeButton}
                  >
                    <Text style={styles.closeText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailContent}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Report Type</Text>
                    <Text style={styles.detailValue}>{selectedReport.type}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Uploaded By</Text>
                    <Text style={styles.detailValue}>
                      {getUploadedByLabel(selectedReport.uploadedBy)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Date</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedReport.uploadedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {selectedReport.description && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Description</Text>
                      <Text style={styles.detailValue}>{selectedReport.description}</Text>
                    </View>
                  )}

                  <Text style={styles.infoText}>
                    📝 Report data is stored securely. You can view this report anytime from your records.
                  </Text>

                  <TouchableOpacity
                    style={styles.closeDetailButton}
                    onPress={() => setSelectedReport(null)}
                  >
                    <Text style={styles.closeDetailButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
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
    maxHeight: '80%',
  },
  detailModal: {
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 24,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  reportCard: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reportType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  reportUploadedBy: {
    fontSize: 12,
    color: '#666',
  },
  reportDate: {
    fontSize: 12,
    color: '#999',
  },
  reportDescription: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  infoText: {
    fontSize: 13,
    color: '#0284c7',
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 15,
  },
  closeDetailButton: {
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeDetailButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
