import { initializeApp, getApps } from "firebase/app";
import {
    browserLocalPersistence,
    getAuth,
    setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

export const firebaseConfig = {
  apiKey: "AIzaSyCtjWupX7p1e2zwQYliYB_DHyGIvp6N0uQ",
  authDomain: "dcdentalapp.firebaseapp.com",
  projectId: "dcdentalapp",
  storageBucket: "dcdentalapp.appspot.com",
  messagingSenderId: "400693543479",
  appId: "1:400693543479:web:e3b6d5001236eec1e635b2",
};

// Avoid re-initializing in web/hot-reload scenarios
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const firebaseApp = app;

export const auth = getAuth(app);

// Set persistence based on platform
if (Platform.OS === 'web') {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Error setting auth persistence:', error);
  });
}

export const db = getFirestore(app);
