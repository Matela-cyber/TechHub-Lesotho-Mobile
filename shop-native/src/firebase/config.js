import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCiK8Co8tp9i2kjefB4ryGuoaVbWYYCdtY",
  authDomain: "techhub-lesotho.firebaseapp.com",
  projectId: "techhub-lesotho",
  storageBucket: "techhub-lesotho.appspot.com",
  messagingSenderId: "105062272362",
  appId: "1:105062272362:web:8ac6b3a5a389a658dde913",
};

let app;
let auth;
let db;

try {
  const isNew = getApps().length === 0;
  app = isNew ? initializeApp(firebaseConfig) : getApp();

  auth = isNew
    ? initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
    : getAuth(app);

  db = isNew
    ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
    : getFirestore(app);
} catch (e) {
  console.error("Firebase init error:", e);
  throw e;
}

export { auth, db };
