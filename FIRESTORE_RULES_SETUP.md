# 🔐 Firestore Security Rules - Medical Records

## Current Issue
Users are getting "Missing or insufficient permissions" error when uploading reports. This means Firestore security rules need to be updated.

## How to Fix

### Step 1: Go to Firebase Console
1. Visit: https://console.firebase.google.com
2. Select your project: **dcdentalapp**
3. Go to **Firestore Database** → **Rules**

### Step 2: Replace Rules with These

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========== REPORTS COLLECTION ==========
    // Allow authenticated users to upload their own reports
    match /reports/{reportId} {
      allow create: if request.auth != null;
      allow read: if request.auth.uid == resource.data.patientId 
                     || request.auth.token.email == get(/databases/$(database)/documents/appointments/$(reportId)).data.doctorEmail;
      allow delete: if request.auth.uid == resource.data.patientId;
      allow update: if request.auth.uid == resource.data.patientId;
    }

    // ========== APPOINTMENTS COLLECTION ==========
    match /appointments/{appointmentId} {
      allow create: if request.auth != null;
      allow read: if request.auth.token.email == resource.data.email 
                     || request.auth.token.email == resource.data.doctorEmail;
      allow update: if request.auth.token.email == resource.data.doctorEmail
                       || request.auth.token.email == resource.data.email;
      allow delete: if false; // Never delete appointments
    }

    // ========== PATIENTS COLLECTION ==========
    match /patients/{patientId} {
      allow create: if request.auth.uid == patientId;
      allow read: if request.auth.uid == patientId;
      allow update: if request.auth.uid == patientId;
      allow delete: if false;
    }

    // ========== DOCTORS COLLECTION ==========
    match /doctors/{doctorId} {
      allow create: if request.auth != null;
      allow read: if true; // Patients need to see doctor list
      allow update: if request.auth.token.email == resource.data.email;
      allow delete: if false;
    }

    // ========== ADMINS COLLECTION ==========
    match /admins/{adminId} {
      allow read, write: if request.auth.uid == adminId;
      allow delete: if false;
    }
  }
}
```

### Step 3: Click "Publish"
- Review the rules
- Click the **"Publish"** button
- Wait for confirmation

## Testing After Update

1. Go back to the app
2. Login as a patient
3. Go to Patient Dashboard
4. Click "📤 Upload Report"
5. Fill in:
   - Report Type: Choose any type
   - File Name: Enter any name (e.g., "medical_report.pdf")
   - Description: Enter some text
6. Click "Upload Report"
7. Should see success message ✅

## If Still Getting Error

Try these steps:

### Option 1: Temporary Development Rules (NOT for production!)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Option 2: Check Authentication
1. Make sure you're logged in as a patient
2. Try logging out and back in
3. Refresh the page

### Option 3: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for detailed error message
4. Share the error message

## Important Notes

⚠️ **NEVER use these rules in production:**
- Rules that allow anyone to read/write
- Rules without proper authentication checks
- Rules that don't validate data structure

✅ **Always use rules that:**
- Check `request.auth != null` (user is authenticated)
- Validate user ownership (check `request.auth.uid` or email)
- Restrict operations (read/write/update/delete separately)
- Validate data structure

## For Production

When deploying to production, use stricter rules and:
1. Enable Google Cloud Audit Logging
2. Set up alerts for suspicious activity
3. Review rules with security team
4. Test thoroughly before deploying
5. Monitor Firestore usage and costs

---

**Status:** Need to update Firestore Rules  
**Next Step:** Follow steps above to fix permission error
