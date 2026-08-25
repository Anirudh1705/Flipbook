import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
  type Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  type Firestore,
} from 'firebase/firestore';
import type { Book } from '../types/book';
import { isAuthorizedAdminEmail, STORAGE_KEYS } from './config';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBmxXVI9IYW0UGqZKCFNXoQ3WlM_WwsMQE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'flipbok-703a1.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'flipbok-703a1',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'flipbok-703a1.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '210274607699',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:210274607699:web:9a11caf4974af01a605ca6',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-GRQ7Y6B7J1',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured && typeof window !== 'undefined') {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
  }
}

export { auth, db };

/**
 * Secure Firebase Authentication with Admin Whitelist
 * Only allowed admin emails (anirudhkaushik@galgotiasuniversity.edu.in, anirudhsharma9893@gmail.com) can log in.
 */
export async function loginWithFirebase(email: string, pass: string): Promise<User> {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }

  const cleanEmail = email.trim().toLowerCase();

  // Strict email whitelist check
  if (!isAuthorizedAdminEmail(cleanEmail)) {
    throw new Error(`Unauthorized: "${cleanEmail}" is not an authorized administrator email.`);
  }

  const credential = await signInWithEmailAndPassword(auth, cleanEmail, pass);

  if (!isAuthorizedAdminEmail(credential.user.email)) {
    await firebaseSignOut(auth);
    throw new Error(`Access Denied: "${credential.user.email}" is not authorized.`);
  }

  localStorage.setItem(STORAGE_KEYS.ADMIN_USER_EMAIL, credential.user.email || cleanEmail);
  return credential.user;
}

/**
 * Sign in with Google (Admin Whitelist Enforced)
 */
export async function loginWithGoogle(): Promise<User> {
  if (!auth) {
    throw new Error('Firebase is not configured.');
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  const credential = await signInWithPopup(auth, provider);
  const cleanEmail = credential.user.email?.trim().toLowerCase() || '';

  if (!isAuthorizedAdminEmail(cleanEmail)) {
    await firebaseSignOut(auth);
    throw new Error(`Unauthorized: "${cleanEmail}" is not an authorized administrator email.`);
  }

  localStorage.setItem('flipbook_admin_authenticated', 'true');
  localStorage.setItem(STORAGE_KEYS.ADMIN_USER_EMAIL, cleanEmail);
  return credential.user;
}

export async function logoutFromFirebase(): Promise<void> {
  if (auth) {
    await firebaseSignOut(auth);
  }
  localStorage.removeItem('flipbook_admin_authenticated');
  localStorage.removeItem(STORAGE_KEYS.ADMIN_USER_EMAIL);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

/**
 * Firestore Database operations for publications
 */
const BOOKS_COLLECTION = 'publications';

export async function getBooksFromFirestore(): Promise<Book[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, BOOKS_COLLECTION), orderBy('display_order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Book));
  } catch (err) {
    console.warn('Firestore fetch failed:', err);
    return [];
  }
}

export async function saveBookToFirestore(book: Partial<Book>): Promise<Book> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }

  const bookId = book.id || String(Date.now());
  const bookRef = doc(db, BOOKS_COLLECTION, bookId);

  const newBook: Book = {
    id: bookId,
    book_number: book.book_number || 1,
    title: book.title || 'Untitled Publication',
    slug: book.slug || `book-${bookId}`,
    pdf_url: book.pdf_url || '',
    cover_url: book.cover_url || '',
    description: book.description || '',
    category: book.category || 'General',
    author: book.author || '',
    publication_date: book.publication_date || new Date().toISOString().split('T')[0],
    page_count: book.page_count || 14,
    file_size: book.file_size || 1048576,
    is_published: book.is_published ?? true,
    display_order: book.display_order || 1,
  };

  await setDoc(bookRef, newBook, { merge: true });
  return newBook;
}

export async function deleteBookFromFirestore(id: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, BOOKS_COLLECTION, id));
}
