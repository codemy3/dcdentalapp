# Visual Integration Guide

## Doctor Dashboard Layout

```
┌─────────────────────────────────────────┐
│   👨‍⚕️ DOCTOR DASHBOARD                      │
├─────────────────────────────────────────┤
│                                           │
│   Header: "Hello, Dr. [Name]"            │
│   [Edit Profile] [Logout]                │
│                                           │
├─────────────────────────────────────────┤
│   Search: [Patient Name/Phone/Email]   │
│                                           │
├─────────────────────────────────────────┤
│   Tabs: [Pending] [Confirmed] [Completed] [Cancelled]
│                                           │
├─────────────────────────────────────────┤
│                                           │
│  ┌─── APPOINTMENT CARD ────────────────┐ │
│  │ Patient: John Doe                   │ │
│  │ Service: Dental Checkup             │ │
│  │ Date: 2026-02-01 at 10:30           │ │
│  │ Phone: 555-1234                     │ │
│  │ Email: john@example.com             │ │
│  │                                     │ │
│  │ [CONFIRM] [COMPLETED] [CANCEL]      │ │
│  │ [📋 REPORTS] [💊 PRESCRIPTION]      │ │
│  │ [📤 UPLOAD REPORT]                  │ │
│  │                                     │ │
│  │ Reschedule Pending? ...             │ │
│  │ Cancel Pending? ...                 │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─── APPOINTMENT CARD ────────────────┐ │
│  │ ... (another appointment)            │ │
│  └─────────────────────────────────────┘ │
│                                           │
└─────────────────────────────────────────┘
```

### New Buttons in Doctor Dashboard:

| Button | Color | Function | Modal |
|--------|-------|----------|-------|
| 💊 PRESCRIPTION | Pink | Write prescription | PrescriptionWriter |
| 📤 UPLOAD REPORT | Cyan | Upload medical report | DoctorReportUpload |
| CANCEL | Yellow | Cancel with reason | CancellationReason |
| 📋 REPORTS | Purple | View patient reports | DoctorReportViewer |

---

## Patient Dashboard Layout

```
┌─────────────────────────────────────────┐
│   👤 PATIENT DASHBOARD                   │
├─────────────────────────────────────────┤
│                                           │
│   Header: "Hello, [Name]! 👋"            │
│   "Your Appointments"            [Logout]│
│                                           │
├─────────────────────────────────────────┤
│   [+ BOOK NEW APPOINTMENT]                │
│   [💊 MY PRESCRIPTIONS] ← NEW!           │
│   [📋 UPLOAD REPORT]                     │
│   [📅 MEDICAL HISTORY]                   │
│   [👨‍⚕️ FIND DOCTORS]                      │
│   [👤 MY PROFILE]                        │
│                                           │
├─────────────────────────────────────────┤
│                                           │
│  ┌─── APPOINTMENT CARD ────────────────┐ │
│  │ Dr. Smith - Dental Cleaning         │ │
│  │ Status: [PENDING]                   │ │
│  │                                     │ │
│  │ 📅 2026-02-01 at 10:30              │ │
│  │ 📞 Your Phone: 555-5678             │ │
│  │ 📧 you@example.com                  │ │
│  │ 🕐 Booked: 2026-01-30               │ │
│  │                                     │ │
│  │ [📝 RESCHEDULE] [✖ CANCEL]          │ │
│  │                                     │ │
│  │ Reschedule pending? ...             │ │
│  │ Cancel pending? ...                 │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  ┌─── APPOINTMENT CARD ────────────────┐ │
│  │ ... (another appointment)            │ │
│  └─────────────────────────────────────┘ │
│                                           │
└─────────────────────────────────────────┘
```

### New Buttons in Patient Dashboard:

| Button | Color | Function | Modal |
|--------|-------|----------|-------|
| 💊 MY PRESCRIPTIONS | Purple | View all prescriptions | PatientPrescriptions |
| ✖ CANCEL | Red | Cancel with reason | CancellationReason |

---

## Modal Flows

### Doctor: Write Prescription Modal

```
┌─────────────────────────────────────────┐
│     💊 WRITE PRESCRIPTION               │
├─────────────────────────────────────────┤
│                                           │
│ Patient: John Doe                        │
│ Email: john@example.com                  │
│ Doctor: Dr. Smith                        │
│                                           │
│ Medication Name* ___________________     │
│ Dosage* ___________________               │
│ Duration* ___________________             │
│ Instructions ___________________          │
│ Notes _____________________________       │
│                                           │
│ [CANCEL]            [💾 SAVE PRESCRIPTION]│
│                                           │
└─────────────────────────────────────────┘
```

### Doctor: Upload Report Modal

```
┌─────────────────────────────────────────┐
│     📤 UPLOAD MEDICAL REPORT             │
├─────────────────────────────────────────┤
│                                           │
│ Patient: John Doe                        │
│ Doctor: Dr. Smith                        │
│                                           │
│ Report Type*                             │
│ ├─ Medical Report                        │
│ ├─ Lab Test                              │
│ ├─ X-Ray                                 │
│ ├─ Prescription                          │
│ ├─ Treatment Notes                       │
│ └─ Other                                 │
│                                           │
│ Description _____________________________│
│ ________________________________        │
│                                           │
│ [CANCEL]            [📤 UPLOAD REPORT]   │
│                                           │
└─────────────────────────────────────────┘
```

### Cancel with Reason Modal

```
┌─────────────────────────────────────────┐
│     ❌ CANCEL APPOINTMENT                │
├─────────────────────────────────────────┤
│                                           │
│ Appointment: John Doe                    │
│ Date: 2026-02-01 at 10:30                │
│                                           │
│ Cancellation Reason*                     │
│ _________________________________        │
│ _________________________________        │
│ _________________________________        │
│                                           │
│ [CANCEL]                  [✓ SUBMIT]     │
│                                           │
└─────────────────────────────────────────┘
```

### Patient: View Prescriptions Modal

```
┌─────────────────────────────────────────┐
│     💊 MY PRESCRIPTIONS                  │
├─────────────────────────────────────────┤
│                                           │
│ 🔍 Search [____________]                 │
│                                           │
│ ┌─────────────────────────────────────┐ │
│ │ Amoxicillin                         │ │
│ │ Prescribed by: Dr. Smith            │ │
│ │ Date: Jan 28, 2026                  │ │
│ │ [TAP FOR DETAILS]                   │ │
│ └─────────────────────────────────────┘ │
│                                           │
│ ┌─────────────────────────────────────┐ │
│ │ Ibuprofen 200mg                     │ │
│ │ Prescribed by: Dr. Johnson          │ │
│ │ Date: Jan 25, 2026                  │ │
│ │ [TAP FOR DETAILS]                   │ │
│ └─────────────────────────────────────┘ │
│                                           │
│                        [← BACK]  [CLOSE] │
│                                           │
└─────────────────────────────────────────┘
```

### Prescription Details (Patient)

```
┌─────────────────────────────────────────┐
│     💊 PRESCRIPTION DETAILS              │
├─────────────────────────────────────────┤
│                                           │
│ Medication: Amoxicillin                 │
│ Doctor: Dr. Smith                        │
│ Prescribed: Jan 28, 2026                 │
│                                           │
│ Dosage: 500mg                            │
│ Duration: 7 days                         │
│                                           │
│ Instructions:                            │
│ Take with food, 3 times daily            │
│                                           │
│ Notes:                                   │
│ Complete the full course                 │
│                                           │
│                        [← BACK]  [CLOSE] │
│                                           │
└─────────────────────────────────────────┘
```

---

## Doctor Report Viewer Modal

```
┌─────────────────────────────────────────┐
│     📋 PATIENT REPORTS                   │
│     John Doe (john@example.com)          │
├─────────────────────────────────────────┤
│                                           │
│ 🔍 Search [____________]                 │
│                                           │
│ ┌─────────────────────────────────────┐ │
│ │ 👨‍⚕️ Dental X-Ray                     │ │
│ │ Uploaded by: Dr. Smith              │ │
│ │ Date: Jan 30, 2026                  │ │
│ │ Description: Upper jaw exam         │ │
│ │ [VIEW]                              │ │
│ └─────────────────────────────────────┘ │
│                                           │
│ ┌─────────────────────────────────────┐ │
│ │ 👤 Medical Report                   │ │
│ │ Uploaded by: Patient                │ │
│ │ Date: Jan 29, 2026                  │ │
│ │ Description: Previous checkup       │ │
│ │ [VIEW]                              │ │
│ └─────────────────────────────────────┘ │
│                                           │
│                        [← BACK]  [CLOSE] │
│                                           │
└─────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Prescription Data Flow

```
Doctor Dashboard
    ↓
Click "💊 Prescription"
    ↓
PrescriptionWriter Modal Opens
    ↓
Doctor Fills:
  - Medication
  - Dosage  
  - Duration
  - Instructions
  - Notes
    ↓
Click "Save Prescription"
    ↓
Save to Firestore (prescriptions collection)
    ↓
Email Notification Sent to Patient
    ↓
Patient Dashboard → Click "💊 My Prescriptions"
    ↓
PatientPrescriptions Modal Shows Prescription
    ↓
Patient Clicks to See Details
    ↓
Full prescription displayed
```

### Report Upload Flow

```
Doctor Dashboard
    ↓
Click "📤 Upload Report"
    ↓
DoctorReportUpload Modal Opens
    ↓
Doctor Selects:
  - Report Type
  - Description
    ↓
Click "Upload Report"
    ↓
Save to Firestore (reports collection)
  - uploadedBy: "doctor"
  - uploadedByName: "Dr. Smith"
    ↓
Email Notification Sent to Patient
    ↓
Patient Sees Report with "👨‍⚕️ Doctor" Label
    ↓
Doctor Can See Report via "📋 View Reports"
```

### Cancellation Flow

```
Appointment Card
    ↓
Click "Cancel" (Doctor or Patient)
    ↓
CancellationReason Modal Opens
    ↓
User Enters Cancellation Reason
    ↓
Click "Submit"
    ↓
Update Firestore:
  - status: "Cancelled"
  - cancellationReason: "user input"
  - cancelledAt: timestamp
    ↓
Email Notification Sent
    ↓
Both doctor and patient see cancellation reason
```

---

## Color Scheme

### Doctor Dashboard:
- 🟢 Green (#22c55e) - Confirm button
- 🔵 Blue (#3b82f6) - Complete button  
- 🟡 Yellow (#facc15) - Cancel button
- 🟣 Purple (#8b5cf6) - View Reports button
- 🔴 Pink (#ec4899) - Prescription button
- 🔵 Cyan (#06b6d4) - Upload Report button

### Patient Dashboard:
- 🔵 Blue (#0ea5e9) - Book New Appointment
- 🟣 Purple (#a855f7) - My Prescriptions
- 🔵 Light Blue (#f0f9ff) - Reschedule
- 🔴 Light Red (#fff1f2) - Cancel

---

## State Management

### Doctor Dashboard States:
```tsx
showCancellationModal     // CancellationReason modal visibility
showPrescriptionModal     // PrescriptionWriter modal visibility  
showReportUploadModal     // DoctorReportUpload modal visibility
showReportViewer          // DoctorReportViewer modal visibility
selectedAppointmentForModal // Which appointment is selected
```

### Patient Dashboard States:
```tsx
showPrescriptions        // PatientPrescriptions modal visibility
showCancellationModal    // CancellationReason modal visibility
cancellationAppointment  // Which appointment is being canceled
```

---

## File Structure

```
app/
├── doctor-dashboard.tsx (MODIFIED)
│   ├── Imports 4 new components
│   ├── 4 new state variables
│   ├── 4 new modals
│   ├── 3 new buttons (💊 📤 ❌)
│   └── Updated cancel handler
│
└── patient-dashboard.tsx (MODIFIED)
    ├── Imports 2 new components
    ├── 3 new state variables
    ├── 2 new modals
    ├── 1 new button (💊)
    └── Updated cancel handler

components/
├── cancellation-reason.tsx (ALREADY EXISTS)
├── prescription-writer.tsx (ALREADY EXISTS)
├── patient-prescriptions.tsx (ALREADY EXISTS)
├── doctor-report-viewer.tsx (ALREADY EXISTS)
└── doctor-report-upload.tsx (ALREADY EXISTS)
```

---

**This visual guide shows exactly what users will see and how the features flow!** ✨
