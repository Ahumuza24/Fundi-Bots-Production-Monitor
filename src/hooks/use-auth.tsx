
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
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type UserRole = "admin" | "assembler" | "guest";

interface User {
  uid: string;
  email: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy role assignment. In a real app, this would come from a database or custom claims.
const getRoleFromEmail = (email: string | null): UserRole => {
  if (!email) return "guest";
  if (email.endsWith("@admin.com")) {
    return "admin";
  }
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
  
  const loginAsGuest = () => {
    const guestUser = { uid: 'guest', email: 'guest@example.com', role: 'guest' as UserRole };
    sessionStorage.setItem('guest-user', JSON.stringify(guestUser));
    setUser(guestUser);
    setLoading(false);
  }

  const logout = async () => {
    sessionStorage.removeItem('guest-user');
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginAsGuest }}>
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
