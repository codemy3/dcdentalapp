# 🔥 URGENT: Deploy Firestore Rules to Fix Prescriptions

## ⚠️ Issue Found
**Error:** `Missing or insufficient permissions`
**Cause:** Firestore security rules missing for `prescriptions` collection

## ✅ Rules Added

### Prescriptions Collection Rules:
```javascript
match /prescriptions/{prescriptionId} {
  // Patients can read their own prescriptions
  // Doctors can read all prescriptions they created
  // Admins can read all prescriptions
  allow read: if isSignedIn() && (
    request.auth.email == resource.data.patientEmail ||
    isDoctor(request.auth.uid) ||
    isAdmin(request.auth.uid)
  );
  
  // Only doctors can create prescriptions
  allow create: if isSignedIn() && isDoctor(request.auth.uid);
  
  // Doctors and admins can update prescriptions
  allow update: if isSignedIn() && (
    isDoctor(request.auth.uid) ||
    isAdmin(request.auth.uid)
  );
  
  // Only admins can delete prescriptions
  allow delete: if isSignedIn() && isAdmin(request.auth.uid);
}
```

### Reports Collection Rules (Updated):
Also updated reports to allow doctors to upload:
```javascript
match /reports/{reportId} {
  // Patients, doctors, and admins can read reports
  allow read: if isSignedIn() && (
    request.auth.email == resource.data.patientEmail ||
    isDoctor(request.auth.uid) ||
    isAdmin(request.auth.uid)
  );
  
  // Both patients and doctors can upload reports
  allow create: if isSignedIn();
  
  // Updated to allow proper access
  allow update, delete: if isSignedIn() && (
    request.auth.email == resource.data.patientEmail ||
    isDoctor(request.auth.uid) ||
    isAdmin(request.auth.uid)
  );
}
```

---

## 🚀 Deploy Rules to Firebase

### Method 1: Firebase Console (Easiest)

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com
   - Select project: `dcdentalapp`

2. **Navigate to Firestore Rules:**
   - Click "Firestore Database" in left menu
   - Click "Rules" tab at top

3. **Update Rules:**
   - Copy content from `firestore.rules` file
   - Paste into the editor
   - Click "Publish" button

4. **Verify:**
   - Wait for "Rules published successfully" message
   - Takes ~30 seconds to propagate

---

### Method 2: Firebase CLI (Recommended)

1. **Make sure Firebase CLI is installed:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Deploy Rules:**
   ```bash
   cd C:\projects\DCDentalApp
   firebase deploy --only firestore:rules
   ```

4. **Wait for success message:**
   ```
   ✔  Deploy complete!
   
   Project Console: https://console.firebase.google.com/project/dcdentalapp/overview
   ```

---

## ✅ Testing After Deployment

1. **Wait 30-60 seconds** for rules to propagate
2. **Refresh the browser** page
3. **Try saving prescription again**
4. **Check console** - should see: `✅ Prescription saved successfully to Firestore`
5. **Login as patient** - Click "💊 My Prescriptions"
6. **Verify prescription appears** in the list

---

## 🔍 Verify Rules Are Active

### Check via Firebase Console:
1. Go to Firestore Database → Rules
2. Look for `prescriptions` section
3. Verify rules match the ones above

### Test Permissions:
Run this in browser console after login as doctor:
```javascript
// Test if doctor can write prescription
const testDoc = {
  patientEmail: 'test@test.com',
  patientName: 'Test Patient',
  doctorName: 'Test Doctor',
  appointmentId: 'test123',
  medication: 'Test Med',
  dosage: '100mg',
  duration: '7 days',
  instructions: 'Test',
  notes: 'Test',
  date: '2026-01-30'
};

// This should succeed
firebase.firestore()
  .collection('prescriptions')
  .add(testDoc)
  .then(() => console.log('✅ Permission test passed'))
  .catch((err) => console.error('❌ Permission test failed:', err));
```

---

## 🐛 Troubleshooting

### Still getting permission denied?
1. **Clear browser cache** (Ctrl + F5)
2. **Wait 2 minutes** for rules to fully propagate
3. **Check if logged in as doctor** (not patient/admin)
4. **Verify Firebase project** in console matches your app
5. **Re-deploy rules** using Firebase CLI

### Rules not deploying?
1. **Check firebase.json** exists in project root
2. **Verify firestore.rules path** in firebase.json
3. **Try:** `firebase deploy --only firestore:rules --force`

### Doctor not recognized?
1. Check doctor exists in `doctors` collection in Firestore
2. Verify `request.auth.uid` matches document ID in `doctors` collection
3. Check console log to see current user UID

---

## 📋 Quick Command Reference

```bash
# Login
firebase login

# Initialize (if needed)
firebase init

# Deploy rules only
firebase deploy --only firestore:rules

# Deploy everything
firebase deploy

# Check current project
firebase projects:list

# Switch project
firebase use dcdentalapp
```

---

## ✅ After Rules Are Deployed

Once rules are deployed successfully:

1. ✅ Doctors can save prescriptions
2. ✅ Patients can view their prescriptions
3. ✅ Doctors can upload reports
4. ✅ All permissions working correctly

**The prescription save functionality will work immediately!**

---

**Next Step:** Deploy the rules using one of the methods above, then test prescription saving again.
