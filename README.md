# DC Dental App 🦷

A professional React Native dental clinic appointment and medical records management application built with Expo and Firebase.

## ✨ Features

### Core Features (Phase 1)
- 👥 **Three-Role System**: Patient, Doctor, and Admin dashboards
- 📅 **Appointment Management**: Book, confirm, complete, and cancel appointments
- 🔐 **Secure Authentication**: Firebase Auth with email/password
- 📊 **Real-time Database**: Firestore with live data synchronization

### Medical Records System (Phase 1)
- 📤 **Report Upload**: Patients can upload medical documents
  - 6 report types: Medical Report, Lab Test, X-Ray, Prescription, Treatment Notes, Other
  - Add descriptions and notes
  - Secure storage in Firestore

- 📋 **Report Viewer**: 
  - Patients view their own reports
  - Doctors view patient reports
  - Real-time updates
  - Delete functionality (patients only)

- 📜 **Medical History**: 
  - Complete appointment history
  - Patient profile storage per appointment
  - Detailed view with all patient information
  - Status tracking

### 🆕 Enhancement Features (Phase 2) - NEW!
- 🚪 **Logout Functionality**: Secure logout for all user roles with confirmation
- 🔑 **Password Reset**: Forgot password flow on all login pages
- 🔍 **Advanced Search**: Filter appointments by doctor, date, and search query
- ✏️ **Doctor Profiles**: Doctors can edit their professional information
- ✅ **Appointment Confirmation**: Review details before booking
- 🔔 **Automated Reminders**: Email reminders sent 24 hours before appointments

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- iOS/Android emulator or physical device

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Firebase**
   - Update `config/firebase.ts` with your Firebase credentials
   - Enable Firestore and Authentication in Firebase Console

3. **Start the app**
   ```bash
   npm start
   ```

4. **Run on your platform**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app

## 📱 App Workflows

### Patient Workflow
```
Login/Register → Dashboard
  ├─ Book Appointment (with confirmation)
  ├─ View Appointments (with advanced search)
  ├─ Upload Medical Report
  ├─ View Reports
  ├─ View Medical History
  ├─ Edit Profile
  ├─ Reset Password (from login)
  └─ Logout
```

### Doctor Workflow
```
Login → Dashboard
  ├─ View Appointments (with filters)
  ├─ Confirm/Complete/Cancel
  ├─ View Patient Reports
  ├─ Edit Professional Profile (NEW)
  ├─ Reset Password (from login)
  └─ Logout (NEW)
```

### Admin Workflow
```
Login → Dashboard
  ├─ Manage All Appointments
  ├─ Add/Remove Doctors
  ├─ View Statistics
  ├─ Reset Password (from login)
  └─ Logout (NEW)
```

## 📚 Documentation

Start with **[INDEX.md](INDEX.md)** for comprehensive documentation:

- 📖 **[PROJECT_COMPLETE.md](PROJECT_COMPLETE.md)** - Complete project overview
- 🚀 **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Developer quick start
- 🎯 **[PHASE_2_GUIDE.md](PHASE_2_GUIDE.md)** - Phase 2 features guide (NEW)
- 📋 **[REPORTS_FEATURE_DOCS.md](REPORTS_FEATURE_DOCS.md)** - Technical details
- 👥 **[PATIENT_REPORTS_GUIDE.md](PATIENT_REPORTS_GUIDE.md)** - User guide
- 🏗️ **[SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md)** - Architecture overview
- ☑️ **[IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)** - Deployment guide

## 🗂️ Project Structure

```
app/
  ├── _layout.tsx                 # Navigation routes
  ├── index.tsx                   # Home page
  ├── patient-dashboard.tsx       # Patient dashboard with reports
  ├── doctor-dashboard.tsx        # Doctor dashboard with reports
  ├── admin-dashboard.tsx         # Admin dashboard
  ├── appointment.tsx             # Appointment booking
  └── ...

components/
  ├── report-upload.tsx          # NEW - Report upload modal
  ├── report-viewer.tsx          # NEW - Report viewer modal
  ├── patient-history.tsx        # NEW - Medical history viewer
  └── ... (other components)

config/
  └── firebase.ts                # Firebase configuration

constants/
  └── Color.ts, theme.ts         # App theme configuration
```

## 🗄️ Database Schema

### Collections

**reports/** - Medical reports uploaded by patients
```
- patientId
- patientEmail
- patientName
- fileName
- description
- reportType
- uploadedAt
- visibleToDoctor
```

**appointments/** - Appointment records
```
- name, email, phone
- doctor, doctorId, doctorEmail
- service, date, time
- status (Pending/Confirmed/Completed/Cancelled)
- patientProfile (NEW - stores patient info)
```

**patients/** - Patient user data
- name, email, phone
- Additional profile info

**doctors/** - Doctor information
- name, email, specialization
- Auto-created on admin registration

**admins/** - Admin users
- name, email

## 🔐 Security

- ✅ Firebase Authentication (Email/Password)
- ✅ Role-based access control
- ✅ Firestore security rules (recommended)
- ✅ Patient data privacy
- ✅ Secure report sharing

## 📞 Technologies Used

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Firebase (Auth + Firestore)
- **Navigation**: Expo Router
- **Email**: EmailJS (appointment confirmations)
- **File Selection**: expo-document-picker

## 📦 Key Dependencies

```json
{
  "expo": "~54.0.30",
  "expo-router": "~6.0.21",
  "firebase": "^12.7.0",
  "react-native": "0.81.5",
  "typescript": "~5.9.2",
  "expo-document-picker": "^14.0.5"
}
```

## 🧪 Testing

Test the complete workflow:

1. **Patient**: Register → Book Appointment → Upload Report → View History
2. **Doctor**: Login → View Appointments → Confirm → View Reports
3. **Admin**: Login → Manage Appointments → Add Doctor

## 🚀 Deployment

### To Expo

```bash
# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android

# Submit to stores
eas submit
```

See [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) for detailed deployment guide.

## 🐛 Troubleshooting

### Reports not appearing
- Check Firestore collection exists
- Verify patient email matches
- Check browser console for errors

### Doctor can't see reports
- Verify `visibleToDoctor` is set to `true`
- Check patient email matches
- Confirm Firestore query permissions

### History not loading
- Ensure appointments have `patientProfile` field
- Check patient email is correct
- Verify appointments were created after update

For more help, see [QUICK_REFERENCE.md - Troubleshooting](QUICK_REFERENCE.md#-debugging-tips)

## 📞 Support

- **Users**: See [PATIENT_REPORTS_GUIDE.md](PATIENT_REPORTS_GUIDE.md)
- **Developers**: See [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
- **Deployment**: See [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)

## 📝 License

This project is proprietary software for DC Dental Clinic.

## 🎉 What's New (v2.0)

✨ **Medical Records System**
- Report upload with type selection
- Report viewer for patients and doctors
- Complete medical history tracking
- Patient profile storage for future care
- Real-time synchronization
- Secure data sharing between patient and doctor

## 📅 Recent Updates

- **Jan 20, 2026**: Added comprehensive report upload, viewer, and medical history system
- **Jan 15, 2026**: Fixed Firestore index errors with in-memory sorting
- **Jan 10, 2026**: Completed doctor dashboard with appointment filtering

---

**Start Here:** Read [INDEX.md](INDEX.md) for documentation navigation  
**Quick Start:** Read [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for development setup  
**Deploy:** Follow [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
