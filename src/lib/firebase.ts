
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "fundiflow",
  "appId": "1:736168949446:web:308f122c200800f16bc9c7",
  "storageBucket": "fundiflow.firebasestorage.app",
  "apiKey": "AIzaSyDqh9fmtQH4aS4K2YjRdLMMQJt9b0mrM9E",
  "authDomain": "fundiflow.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "736168949446"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
