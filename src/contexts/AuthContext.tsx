import React, { createContext, useContext, useState, useCallback } from "react";
import { mockStudents, type Student } from "@/data/mockData";

export type UserRole = "admin" | "student";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  approved: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  pendingUsers: User[];
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  addRemark: (studentId: string, remark: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const DEMO_ACCOUNTS: { email: string; password: string; user: User }[] = [
  {
    email: "admin@schupa.org",
    password: "Admin@2026",
    user: { id: "admin-1", email: "admin@schupa.org", name: "SCHUPA Admin", role: "admin", approved: true },
  },
  {
    email: "student@schupa.org",
    password: "Student@2026",
    user: { id: "student-1", email: "student@schupa.org", name: "Amina Wanjiku", role: "student", approved: true },
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [pendingUsers, setPendingUsers] = useState<User[]>([
    { id: "pending-1", email: "james@example.com", name: "James Odhiambo", role: "student", approved: false },
    { id: "pending-2", email: "grace@example.com", name: "Grace Muthoni", role: "student", approved: false },
  ]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    const account = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === password);
    setIsLoading(false);
    if (account) {
      setUser(account.user);
      return { success: true, message: "Login successful!" };
    }
    return { success: false, message: "Invalid email or password. Try demo accounts." };
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    const newUser: User = { id: `pending-${Date.now()}`, email, name, role: "student", approved: false };
    setPendingUsers((prev) => [...prev, newUser]);
    return { success: true, message: "Account created! Please wait for admin approval before logging in." };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const approveUser = useCallback((userId: string) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const rejectUser = useCallback((userId: string) => {
    setPendingUsers((prev) => prev.filter((u) => u.id !== userId));
  }, []);

  const addRemark = useCallback((studentId: string, remark: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, remarks: [...s.remarks, { date: new Date().toISOString().split("T")[0], text: remark, by: "Admin" }] } : s
      )
    );
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, students, setStudents, pendingUsers, approveUser, rejectUser, addRemark }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
