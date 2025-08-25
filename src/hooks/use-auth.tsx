
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import type { Worker } from "@/lib/types";


export type UserRole = "admin" | "assembler" | "guest";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRoleFromEmail = (email: string | null): UserRole => {
  if (!email) return "guest";
  
  // Check both sessionStorage and localStorage for stored role
  try {
    const sessionRole = sessionStorage.getItem(`role_${email}`);
    const localRole = localStorage.getItem(`role_${email}`);
    
    if (sessionRole === 'admin' || localRole === 'admin') return 'admin';
    if (sessionRole === 'assembler' || localRole === 'assembler') return 'assembler';
  } catch (error) {
    // Silent fail for storage access
  }
  
  // Fallback to email pattern matching
  if (email.endsWith("@admin.com")) return "admin";
  
  // Default to assembler
  return "assembler";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const role = getRoleFromEmail(firebaseUser.email);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: role,
        });
      } else {
        const guestUser = JSON.parse(sessionStorage.getItem('guest-user') || 'null');
        setUser(guestUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    sessionStorage.removeItem('guest-user');
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const signup = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    sessionStorage.removeItem('guest-user');
    
    // Store the role BEFORE creating the user
    sessionStorage.setItem(`role_${email}`, role);
    localStorage.setItem(`role_${email}`, role);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    
    const updatedFirebaseUser = auth.currentUser;

    if (role === 'assembler' && updatedFirebaseUser) {
        const workerRef = doc(db, "workers", updatedFirebaseUser.uid);
        const newWorker: Worker = {
            id: updatedFirebaseUser.uid,
            name: fullName,
            email: email,
            skills: ['New Recruit'],
            availability: 'Pending',
            pastPerformance: 0,
            timeLoggedSeconds: 0,
        };
        await setDoc(workerRef, newWorker);
    }
  }, []);
  
  const loginAsGuest = useCallback(() => {
    const guestUser = { uid: 'guest', email: 'guest@example.com', role: 'guest' as UserRole, displayName: 'Guest User' };
    sessionStorage.setItem('guest-user', JSON.stringify(guestUser));
    setUser(guestUser);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem('guest-user');
    await signOut(auth);
    setUser(null);
  }, []);

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    logout,
    loginAsGuest,
  }), [user, loading, login, signup, logout, loginAsGuest]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
