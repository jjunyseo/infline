'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 인증 상태 변화 감지
  useEffect(() => {
    // Firebase가 설정되지 않은 경우
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // 사용자 문서 업데이트 (마지막 로그인 시간)
      if (user && db) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
          }
        } catch (error) {
          console.warn('Failed to update user document:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 이메일/비밀번호 로그인
  const signIn = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    await signInWithEmailAndPassword(auth, email, password);
  };

  // 이메일/비밀번호 회원가입
  const signUp = async (email: string, password: string, displayName: string) => {
    if (!auth || !db) throw new Error('Firebase가 설정되지 않았습니다.');

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 프로필 업데이트
    await updateProfile(user, { displayName });

    // Firestore에 사용자 문서 생성
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      photoURL: null,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  };

  // Google 로그인
  const signInWithGoogle = async () => {
    if (!auth || !db) throw new Error('Firebase가 설정되지 않았습니다.');

    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    // Firestore에 사용자 문서 생성/업데이트
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      });
    } else {
      await setDoc(userRef, { lastLoginAt: serverTimestamp() }, { merge: true });
    }
  };

  // 로그아웃
  const signOut = async () => {
    if (!auth) throw new Error('Firebase가 설정되지 않았습니다.');
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
