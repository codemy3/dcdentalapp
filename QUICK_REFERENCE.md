# 🚀 Quick Reference - Reports & Medical History Feature

## 📋 Feature Overview

```
Patient Dashboard          Doctor Dashboard           Firestore
┌────────────────┐        ┌────────────────┐        ┌─────────┐
│ Upload Report  │────┐   │ View Reports   │───┐    │Reports  │
│ View Reports   │    │   │ (Button)       │   │    │         │
│ Medical History│    └──→│                │   └──→ │Patient  │
│                │        │                │        │Profile  │
└────────────────┘        └────────────────┘        │Storage  │
                                                    └─────────┘
```

---

## 🔧 Installation

```bash
# 1. Install dependencies
npm install
# or
yarn install

# 2. New dependency added: expo-document-picker
```

---

## 📁 File Structure

```
components/
├── report-upload.tsx      (New - Upload modal)
├── report-viewer.tsx      (New - View reports)
├── patient-history.tsx    (New - Medical history)
└── ... (existing)

app/
├── patient-dashboard.tsx  (Modified - Added report buttons)
├── doctor-dashboard.tsx   (Modified - Added reports button)
├── appointment.tsx        (Modified - Added patient profile)
└── ... (existing)

Documentation/
├── REPORTS_FEATURE_DOCS.md
├── PATIENT_REPORTS_GUIDE.md
├── IMPLEMENTATION_CHECKLIST.md
├── SYSTEM_ARCHITECTURE.md
└── IMPLEMENTATION_SUMMARY.md
```

---

## 🎯 Key Components

### ReportUpload.tsx
```typescript
import { ReportUpload } from '../components/report-upload';

<ReportUpload
  visible={showReportUpload}
  onClose={() => setShowReportUpload(false)}
  patientEmail={currentUser?.email}
  patientName={patientName}
  patientId={currentUser?.uid}
  onUploadSuccess={() => { /* refresh */ }}
/>
```

### ReportViewer.tsx
```typescript
import { ReportViewer } from '../components/report-viewer';

<ReportViewer
  visible={showReportViewer}
  onClose={() => setShowReportViewer(false)}
  patientEmail={patientEmail}
  patientId={patientId}
  isDoctor={true}  // true for doctor, false for patient
/>
```

### PatientHistory.tsx
```typescript
import { PatientHistory } from '../components/patient-history';

<PatientHistory
  visible={showHistory}
  onClose={() => setShowHistory(false)}
  patientEmail={currentUser?.email}
/>
```

---

## 🗄️ Firestore Schema

### Reports Collection
```
reports/
  └── {reportId}
      ├── patientId: string
      ├── patientEmail: string
      ├── patientName: string
      ├── fileName: string
      ├── description: string
      ├── reportType: "Medical Report" | "Lab Test" | "X-Ray" | "Prescription" | "Treatment Notes" | "Other"
      ├── uploadedAt: timestamp
      ├── status: "Active"
      └── visibleToDoctor: boolean
```

### Appointments Collection (Enhanced)
```
appointments/
  └── {appointmentId}
      ├── ... (existing fields)
      └── patientProfile: {
          ├── name: string
          ├── email: string
          ├── phone: string
          └── createdAt: string
      }
```

---

## 🔍 Common Queries

### Get Patient's Reports
```typescript
const q = query(
  collection(db, 'reports'),
  where('patientEmail', '==', patientEmail)
);
```

### Get Doctor's Patient Reports
```typescript
const q = query(
  collection(db, 'reports'),
  where('patientId', '==', patientId),
  where('visibleToDoctor', '==', true)
);
```

### Get Patient's Appointments (History)
```typescript
const q = query(
  collection(db, 'appointments'),
  where('email', '==', patientEmail)
);
```

---

## 🎨 UI Elements

### Buttons to Add

```tsx
// Patient Dashboard - Report Section
<View style={styles.reportSection}>
  <TouchableOpacity 
    style={styles.reportButton}
    onPress={() => setShowReportUpload(true)}
  >
    <Text style={styles.reportButtonText}>📤 Upload Report</Text>
  </TouchableOpacity>
  <TouchableOpacity 
    style={styles.reportButton}
    onPress={() => setShowReportViewer(true)}
  >
    <Text style={styles.reportButtonText}>📋 View Reports</Text>
  </TouchableOpacity>
</View>

// History Button
<TouchableOpacity 
  style={styles.historyButton}
  onPress={() => setShowHistory(true)}
>
  <Text style={styles.historyButtonText}>📜 View Medical History</Text>
</TouchableOpacity>

// Doctor Dashboard - On Appointment Card
<TouchableOpacity
  style={styles.reportsButton}
  onPress={() => {
    setSelectedPatientId(apt.email);
    setShowReportViewer(true);
  }}
>
  <Text style={styles.btnText}>📋 Reports</Text>
</TouchableOpacity>
```

### Styles Template
```typescript
reportSection: {
  flexDirection: 'row',
  paddingHorizontal: 20,
  gap: 10,
  marginBottom: 10,
},
reportButton: {
  flex: 1,
  backgroundColor: '#6366f1',
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
},
reportButtonText: {
  color: 'white',
  fontSize: 14,
  fontWeight: '600',
},
historyButton: {
  backgroundColor: '#f59e0b',
  marginHorizontal: 20,
  marginBottom: 16,
  paddingVertical: 12,
  borderRadius: 10,
  alignItems: 'center',
},
historyButtonText: {
  color: 'white',
  fontSize: 14,
  fontWeight: '600',
},
reportsButton: {
  backgroundColor: '#8b5cf6',
  padding: 10,
  borderRadius: 8,
},
```

---

## 🔐 Access Control

| Operation | Patient | Doctor |
|-----------|---------|--------|
| Upload report | ✅ Own | ❌ |
| View report | ✅ Own | ✅ If visible |
| Delete report | ✅ Own | ❌ |
| View history | ✅ Own | ❌ |

---

## 🐛 Debugging Tips

### Check Console Logs
```typescript
// In report-upload.tsx
console.log('✅ Report uploaded successfully:', docRef.id);

// In report-viewer.tsx
console.log('📋 Reports loaded:', reportsData);

// In patient-history.tsx
console.log('📜 History loaded:', historyData);
```

### Common Issues
1. **Reports not appearing**
   - Check Firestore collection exists
   - Verify patient email matches
   - Check browser console for errors

2. **Doctor can't see reports**
   - Verify `visibleToDoctor` is `true`
   - Check patient email is correct

3. **History not loading**
   - Ensure patient email is correct
   - Check appointments have `patientProfile`

---

## 📱 Testing Checklist

```typescript
// Patient Upload Test
✓ Can select report type
✓ Can choose file
✓ Can add description
✓ Upload saves to Firebase
✓ Success alert shows
✓ Modal closes

// Patient View Test
✓ Modal opens
✓ Reports list appears
✓ Sorted by date (newest first)
✓ Can see description
✓ Can delete own reports

// Patient History Test
✓ Modal opens
✓ All appointments listed
✓ Can click for details
✓ Shows patient profile
✓ Status badges correct

// Doctor View Test
✓ Reports button visible
✓ Modal opens
✓ Only patient's reports show
✓ Cannot delete
✓ Can read descriptions
```

---

## 🚀 Deployment Steps

```bash
# 1. Install dependencies
npm install

# 2. Verify no TypeScript errors
npm run lint

# 3. Test locally
npm start

# 4. Test on device
# Run on iOS/Android simulator or real device

# 5. Deploy
eas build --platform ios
eas build --platform android
eas submit

# 6. Monitor
# Check Firestore for new collections
# Verify users can access features
```

---

## 📞 Support References

| Issue | Reference |
|-------|-----------|
| Technical details | REPORTS_FEATURE_DOCS.md |
| User guide | PATIENT_REPORTS_GUIDE.md |
| Deployment | IMPLEMENTATION_CHECKLIST.md |
| Architecture | SYSTEM_ARCHITECTURE.md |
| Quick start | This document |

---

## 🔗 Dependencies Added

```json
{
  "expo-document-picker": "^14.0.5"
}
```

**Why?** - To enable file selection on mobile devices

---

## 💾 Data Backup

Before deploying, backup your Firestore:
1. Go to Firebase Console
2. Firestore Database → Backups
3. Create manual backup
4. Export data if needed

---

## 🎓 Code Examples

### Upload Report Example
```typescript
const reportData = {
  patientId: 'user123',
  patientEmail: 'patient@email.com',
  patientName: 'John Doe',
  fileName: 'medical_report.pdf',
  description: 'Annual checkup results',
  reportType: 'Medical Report',
  uploadedAt: serverTimestamp(),
  status: 'Active',
  visibleToDoctor: true,
};

const reportsRef = collection(db, 'reports');
const docRef = await addDoc(reportsRef, reportData);
```

### Query Patient Reports
```typescript
const q = query(
  collection(db, 'reports'),
  where('patientEmail', '==', 'patient@email.com')
);

const unsubscribe = onSnapshot(q, (snapshot) => {
  const reports = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setReports(reports);
});
```

### Delete Report
```typescript
const handleDelete = async (reportId) => {
  try {
    await deleteDoc(doc(db, 'reports', reportId));
    // UI updates automatically via onSnapshot
  } catch (error) {
    console.error('Error deleting report:', error);
  }
};
```

---

## 🌐 Real-time Updates

All components use `onSnapshot` for real-time sync:

```typescript
// This will trigger whenever data changes
const unsubscribe = onSnapshot(query, (snapshot) => {
  // Update state with new data
});

// Important: Clean up on unmount
return () => unsubscribe();
```

---

## 📊 Performance Notes

- Small queries (< 50 docs): ✅ Instant
- Medium queries (50-200 docs): ✅ Fast
- Large queries (> 200 docs): ⚠️ Consider pagination
- Real-time updates: ✅ Efficient

---

## 🎯 Next Phase (Future Enhancements)

- [ ] Firebase Storage for actual files
- [ ] Download report files
- [ ] PDF export
- [ ] Share with multiple doctors
- [ ] Email report copies
- [ ] Mobile camera integration

---

**Quick Reference Version:** 1.0  
**Last Updated:** January 20, 2026  
**Status:** Ready for Development
