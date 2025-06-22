import { auth, db } from '@modules/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export async function login(email: string, password: string): Promise<any> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export function logout(): Promise<void> {
  return signOut(auth);
}

export async function getUserRole(uid: string): Promise<string | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data().role || null;
  }
  return null;
}

export function onUserChanged(callback: (user: any | null) => void) {
  onAuthStateChanged(auth, callback);
}
