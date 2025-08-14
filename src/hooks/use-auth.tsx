
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
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type UserRole = "admin" | "assembler" | "guest";

interface User {
  uid: string;
  email: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getRoleFromEmail = (email: string | null): UserRole => {
  if (!email) return "guest";
  if (sessionStorage.getItem(`role_${email}`) === 'admin') return 'admin';
  if (email.endsWith("@admin.com")) return "admin";
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
  };

  const signup = async (email: string, password: string, role: UserRole) => {
    sessionStorage.removeItem('guest-user');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if(userCredential.user.email) {
      // In a real app, this would be stored in a database or as a custom claim.
      // We use sessionStorage as a temporary mock for this.
      sessionStorage.setItem(`role_${userCredential.user.email}`, role);
    }
  };
  
  const loginAsGuest = () => {
    const guestUser = { uid: 'guest', email: 'guest@example.com', role: 'guest' as UserRole };
    sessionStorage.setItem('guest-user', JSON.stringify(guestUser));
    setUser(guestUser);
    setLoading(false);
  }

  const logout = async () => {
    sessionStorage.removeItem('guest-user');
    // Note: we are not cleaning up role session storage on logout
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
