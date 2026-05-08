import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCiK8Co8tp9i2kjefB4ryGuoaVbWYYCdtY",
  authDomain: "techhub-lesotho.firebaseapp.com",
  projectId: "techhub-lesotho",
  storageBucket: "techhub-lesotho.appspot.com",
  messagingSenderId: "105062272362",
  appId: "1:105062272362:web:1eb03128a28d167fdde913",
};

const isNew = getApps().length === 0;
const app = isNew ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = isNew
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = isNew
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : getFirestore(app);

export const storage = getStorage(app);
