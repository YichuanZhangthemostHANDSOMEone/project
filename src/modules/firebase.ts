import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: 'AIzaSyAHwfnuP5J8uVATBUxnwVhPnnbvDkP1gI4',
  authDomain: 'internet-fundamental-guider.firebaseapp.com',
  projectId: 'internet-fundamental-guider',
  storageBucket: 'internet-fundamental-guider.firebasestorage.app',
  messagingSenderId: '1053498918039',
  appId: '1:1053498918039:web:54f2d56dc345f0a1b995d2',
  measurementId: 'G-BKF4Y7CNS9'
};

export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
