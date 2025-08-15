
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
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
    
    console.log(`Getting role for ${email}: sessionRole=${sessionRole}, localRole=${localRole}`);
    
    if (sessionRole === 'admin' || localRole === 'admin') return 'admin';
    if (sessionRole === 'assembler' || localRole === 'assembler') return 'assembler';
  } catch (error) {
    console.warn('Error accessing storage for role:', error);
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

  const login = async (email: string, password: string) => {
    sessionStorage.removeItem('guest-user');
    await signInWithEmailAndPassword(auth, email, password);
    // Note: The role will be determined by getRoleFromEmail when onAuthStateChanged fires
  };

  const signup = async (email: string, password: string, fullName: string, role: UserRole) => {
    sessionStorage.removeItem('guest-user');
    
    // Store the role BEFORE creating the user to ensure it's available when onAuthStateChanged fires
    console.log(`Storing role ${role} for email ${email}`);
    sessionStorage.setItem(`role_${email}`, role);
    localStorage.setItem(`role_${email}`, role);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: fullName });
    
    // Refresh user to get displayName
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

    // The onAuthStateChanged will fire and set the user with the correct role
    // No need to manually set the user here as it will be handled by the listener
  };
  
  const loginAsGuest = () => {
    const guestUser = { uid: 'guest', email: 'guest@example.com', role: 'guest' as UserRole, displayName: 'Guest User' };
    sessionStorage.setItem('guest-user', JSON.stringify(guestUser));
    setUser(guestUser);
    setLoading(false);
  }

  const logout = async () => {
    sessionStorage.removeItem('guest-user');
    // Note: we are not cleaning up role storage on logout
    // to allow role persistence for returning users in this mock setup.
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, loginAsGuest }}>
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
