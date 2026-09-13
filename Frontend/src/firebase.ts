import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
  getIdToken,
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
}

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId,
)

export const firebaseApp: FirebaseApp | null = firebaseEnabled
  ? getApps().length > 0
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null

export async function signUpWithFirebase(email: string, password: string) {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not configured for this environment.')
  }
  const credentials = await createUserWithEmailAndPassword(firebaseAuth, email, password)
  return credentials.user
}

export async function signInWithFirebase(email: string, password: string) {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not configured for this environment.')
  }
  const credentials = await signInWithEmailAndPassword(firebaseAuth, email, password)
  return credentials.user
}

export async function signOutFirebase() {
  if (!firebaseAuth) {
    return
  }
  await signOut(firebaseAuth)
}

export function onFirebaseAuthStateChanged(cb: (user: User | null) => void) {
  if (!firebaseAuth) {
    cb(null)
    return () => undefined
  }
  return onAuthStateChanged(firebaseAuth, cb)
}

export async function getFirebaseToken(): Promise<string | null> {
  if (!firebaseAuth) {
    return null
  }
  const user = firebaseAuth.currentUser
  if (!user) {
    return null
  }
  return getIdToken(user)
}
