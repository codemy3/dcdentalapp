# Troubleshooting Guide - DC Dental App

## Common Issues and Solutions

### 🔴 Issue: Logout Button Not Working on Admin Page

**Symptoms:**
- Clicking logout button does nothing
- Button appears but is not clickable
- No confirmation dialog appears

**Solutions:**

1. **Check Browser Console**
   - Open browser developer tools (F12)
   - Look for console logs starting with 🚪, 🔄, ✅, or ❌
   - These will help identify where the logout process is failing

2. **Verify Button is Visible**
   - The logout button should appear in the top-right corner
   - It should have a light red background (#fee2e2)
   - Text should say "🚪 Logout"

3. **Clear Browser Cache**
   ```
   - Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cached images and files"
   - Click "Clear data"
   - Refresh the page (Ctrl+R or Cmd+R)
   ```

4. **Hard Reload the App**
   ```bash
   # In terminal where expo is running:
   # Press 'r' to reload
   # Or press 'R' to restart
   
   # For web:
   Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   ```

5. **Verify Firebase Auth is Working**
   - Try logging out from patient or doctor dashboard
   - If those work, the issue is specific to admin page styling

---

### 🔴 Issue: Firebase 400 Error (identitytoolkit.googleapis.com)

**Error Message:**
```
Failed to load resource: the server responded with a status of 400 ()
identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=...
```

**This Error Means:**
The Firebase Authentication API rejected the request. Common causes:

#### Cause 1: Invalid Credentials
**Solution:**
- Double-check email and password
- Ensure no extra spaces in email field
- Password is case-sensitive

#### Cause 2: User Doesn't Exist
**Solution:**
- Verify the account exists in Firebase Console
- Check the email is registered for that user type (admin/doctor/patient)

#### Cause 3: Email/Password Auth Not Enabled
**Solution:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project (dcdentalapp)
3. Go to Authentication → Sign-in method
4. Ensure "Email/Password" is enabled
5. Save changes if you enabled it

#### Cause 4: API Key Restrictions
**Solution:**
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your project
3. Go to APIs & Services → Credentials
4. Find your API key
5. Check if there are restrictions blocking localhost or your domain
6. Update restrictions if needed

#### Cause 5: Platform-Specific Auth Issue
**Solution:**
The auth persistence has been updated to handle different platforms. If still failing:
- Try running on a different platform (web vs mobile)
- Check if the issue is consistent across platforms

---

### 🔴 Issue: Logout Button Appears But Nothing Happens

**Symptoms:**
- Button is visible
- Clicking does nothing
- No confirmation dialog

**Solutions:**

1. **Check for JavaScript Errors**
   ```
   - Open browser console (F12)
   - Look for red error messages
   - Common errors:
     - "router is undefined" → Router context issue
     - "auth is undefined" → Firebase not initialized
     - "signOut is not a function" → Import issue
   ```

2. **Verify React Native Alert Works**
   - The logout uses Alert.alert() which may not work on web
   - Try on mobile device or emulator
   - For web, check if browser allows dialogs

3. **Test with Console Logs**
   The logout button now includes console logs:
   ```
   🚪 Logout button clicked for: admin
   🔄 Attempting to sign out...
   ✅ Sign out successful
   🔀 Navigating to: /admin-login
   ```
   
   If you don't see these logs, the button's onPress is not firing.

4. **Check Button Styling**
   The button might be covered by another element:
   ```tsx
   // Admin dashboard logout button should have:
   style={{
     backgroundColor: "#fee2e2",
     paddingHorizontal: 14,
     paddingVertical: 10,
     borderRadius: 8,
     minWidth: 80,
   }}
   ```

---

### 🔴 Issue: After Logout, Redirects to Wrong Page

**Symptoms:**
- Logout succeeds
- But redirects to wrong login page (e.g., patient instead of admin)

**Solution:**
Check the `userType` prop passed to LogoutButton:
```tsx
// Correct:
<LogoutButton userType="admin" />

// Wrong:
<LogoutButton userType="patient" />  // Will redirect to patient login!
```

---

### 🔴 Issue: Logout Works on Some Dashboards but Not Others

**Comparison:**

**Patient Dashboard** ✅
```tsx
import { LogoutButton } from '../components/logout-button';
<LogoutButton userType="patient" style={styles.logoutButton} />
```

**Doctor Dashboard** ✅
```tsx
import { LogoutButton } from '../components/logout-button';
<LogoutButton userType="doctor" style={styles.logoutBtn} />
```

**Admin Dashboard** ✅ (after fix)
```tsx
import { LogoutButton } from '../components/logout-button';
<LogoutButton userType="admin" style={styles.logoutBtn} />
```

**Key Points:**
- Import path must be correct
- `userType` prop must match the dashboard
- Style prop is optional but should not break the button

---

### 🛠️ Quick Debugging Checklist

When logout button doesn't work:

1. [ ] Open browser console (F12)
2. [ ] Click the logout button
3. [ ] Check for console logs (🚪, 🔄, ✅, ❌)
4. [ ] Check for red error messages
5. [ ] Verify button is visible and has correct styling
6. [ ] Try hard reload (Ctrl+Shift+R)
7. [ ] Clear browser cache
8. [ ] Restart Expo dev server
9. [ ] Test on different platform (web vs mobile)
10. [ ] Check Firebase Console for auth status

---

### 🔧 Firebase Configuration Issues

If Firebase isn't working at all:

1. **Check Firebase Config**
   ```typescript
   // config/firebase.ts should have:
   export const auth = getAuth(app);
   export const db = getFirestore(app);
   ```

2. **Verify Firebase Initialization**
   ```typescript
   // Should see in console:
   console.log('Firebase initialized:', firebaseApp.name);
   ```

3. **Check Firebase Project Status**
   - Go to Firebase Console
   - Verify project is active
   - Check quotas haven't been exceeded
   - Ensure billing is set up (if using paid features)

---

### 📱 Platform-Specific Issues

#### Web (Browser)
- Alert.alert may not work the same as mobile
- Use window.confirm() as fallback if needed
- Check browser console for errors
- Clear cache and hard reload

#### iOS Simulator
- May need to reset simulator
- Check Expo logs in terminal
- Verify permissions are granted

#### Android Emulator
- May need to clear app data
- Check Expo logs in terminal
- Verify Google Play Services installed

---

### 🆘 Last Resort Solutions

If nothing else works:

1. **Nuclear Option - Clean Restart**
   ```bash
   # Stop Expo
   # Then:
   rm -rf node_modules
   rm -rf .expo
   npm install
   npm start -- --clear
   ```

2. **Check for Package Conflicts**
   ```bash
   npm list firebase
   npm list expo-router
   # Ensure versions are compatible
   ```

3. **Create New Admin Account**
   - Sometimes specific accounts get corrupted
   - Create new admin in Firebase Console
   - Test with new account

4. **Review Recent Changes**
   - What changed before logout stopped working?
   - Revert recent changes one by one
   - Test after each revert

---

### 📞 Getting More Help

If you're still stuck:

1. **Collect Debug Information**
   - Browser console logs
   - Network tab (F12 → Network)
   - Error messages (exact text)
   - Platform (web/iOS/Android)
   - Steps to reproduce

2. **Check Firebase Status**
   - https://status.firebase.google.com
   - Verify no ongoing outages

3. **Review Code**
   - Compare your code with working examples
   - Check all imports are correct
   - Verify file paths

---

### ✅ Verification After Fix

To confirm logout is working:

1. [ ] Login to admin dashboard
2. [ ] Click logout button
3. [ ] Confirmation dialog appears
4. [ ] Click "Logout" in dialog
5. [ ] Successfully signed out from Firebase
6. [ ] Redirected to admin login page
7. [ ] Cannot access admin dashboard without logging in again
8. [ ] No errors in console
9. [ ] Works consistently on multiple attempts
10. [ ] Works on all platforms you support

---

## Recent Fixes Applied

### Admin Dashboard Logout Button (Jan 30, 2026)

**Problem:** 
- Logout button not working on admin page
- 400 error from Firebase Auth

**Fixes Applied:**

1. **Updated Button Styling**
   ```typescript
   logoutBtn: {
     backgroundColor: "#fee2e2",
     paddingHorizontal: 14,  // Was just 'padding: 8'
     paddingVertical: 10,
     borderRadius: 8,
     minWidth: 80,           // Added
     alignItems: 'center',   // Added
   }
   ```

2. **Improved Button Layout**
   ```tsx
   <View style={{ marginLeft: 'auto' }}>
     <LogoutButton userType="admin" style={styles.logoutBtn} />
   </View>
   ```

3. **Enhanced Error Handling**
   - Added console.log statements throughout logout process
   - Better error messages in catch blocks
   - Track each step of logout flow

4. **Fixed Firebase Auth Persistence**
   ```typescript
   // Now only sets web persistence on web platform
   if (Platform.OS === 'web') {
     setPersistence(auth, browserLocalPersistence).catch((error) => {
       console.error('Error setting auth persistence:', error);
     });
   }
   ```

---

**Last Updated:** January 30, 2026  
**Status:** Fixed and tested
