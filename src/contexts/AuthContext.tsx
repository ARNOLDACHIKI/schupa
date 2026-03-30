import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { type Student } from "@/data/mockData";
import { apiRequest, apiUploadRequest, clearStoredToken, getStoredToken, setStoredToken } from "@/lib/api";

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
  isAuthInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; role?: UserRole }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  verifySignupCode: (email: string, code: string) => Promise<{ success: boolean; message: string }>;
  resendSignupCode: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  isLoading: boolean;
  isDataLoading: boolean;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  pendingUsers: User[];
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  addRemark: (studentId: string, remark: string) => Promise<void>;
  uploadResult: (studentId: string, result: { semester: string; year: number; gpa: number }) => Promise<void>;
  uploadFeeRecord: (studentId: string, feeRecord: { date: string; description: string; amount: number; type: "payment" | "charge" }) => Promise<void>;
  uploadStudentDocument: (studentId: string, type: "result" | "fee_statement" | "school_id", file: File) => Promise<void>;
  uploadProfilePhoto: (studentId: string, file: File) => Promise<string>;
  updateStudentProfile: (studentId: string, payload: { photo?: string; bio?: string; course: string; institution: string; yearJoined: number; currentYear: number; totalYears: number }) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  submitContactMessage: (payload: { name: string; email: string; message: string }) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthInitialized, setIsAuthInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);

  const hydrateUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsAuthInitialized(true);
      return;
    }

    try {
      const response = await apiRequest<{ user: User }>("/auth/me", { token });
      setUser(response.user);
    } catch (_error) {
      clearStoredToken();
      setUser(null);
    } finally {
      setIsAuthInitialized(true);
    }
  }, []);

  const refreshData = useCallback(async () => {
    const token = getStoredToken();
    if (!token || !user) {
      setStudents([]);
      setPendingUsers([]);
      return;
    }

    setIsDataLoading(true);
    try {
      if (user.role === "admin") {
        const [studentsResponse, pendingResponse] = await Promise.all([
          apiRequest<{ students: Student[] }>("/students", { token }),
          apiRequest<{ pendingUsers: User[] }>("/pending-users", { token }),
        ]);

        setStudents(studentsResponse.students);
        setPendingUsers(pendingResponse.pendingUsers);
        return;
      }

      const studentResponse = await apiRequest<{ student: Student }>("/students/me", { token });
      setStudents([studentResponse.student]);
      setPendingUsers([]);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setStoredToken(response.token);
      setUser(response.user);
      return { success: true, message: "Login successful!", role: response.user.role };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to sign in.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, _password: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ message: string }>("/auth/signup", {
        method: "POST",
        body: { name, email, password: _password },
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to create account.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifySignupCode = useCallback(async (email: string, code: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ message: string }>("/auth/verify-signup-code", {
        method: "POST",
        body: { email, code },
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to verify code.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendSignupCode = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest<{ message: string }>("/auth/resend-signup-code", {
        method: "POST",
        body: { email },
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to resend code.",
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      const response = await apiRequest<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: { email },
      });
      return { success: true, message: response.message };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unable to process request.",
      };
    }
  }, []);

  const logout = useCallback(() => {
    clearStoredToken();
    setUser(null);
    setStudents([]);
    setPendingUsers([]);
  }, []);

  const approveUser = useCallback(async (userId: string) => {
    await apiRequest<{ message: string }>(`/pending-users/${userId}/approve`, { method: "POST" });
    await refreshData();
  }, [refreshData]);

  const rejectUser = useCallback(async (userId: string) => {
    await apiRequest<{ message: string }>(`/pending-users/${userId}/reject`, { method: "POST" });
    await refreshData();
  }, [refreshData]);

  const addRemark = useCallback(async (studentId: string, remark: string) => {
    await apiRequest<{ message: string }>(`/students/${studentId}/remarks`, {
      method: "POST",
      body: { text: remark },
    });
    await refreshData();
  }, [refreshData]);

  const uploadResult = useCallback(async (studentId: string, result: { semester: string; year: number; gpa: number }) => {
    await apiRequest<{ message: string }>(`/students/${studentId}/results`, {
      method: "POST",
      body: result,
    });
    await refreshData();
  }, [refreshData]);

  const uploadFeeRecord = useCallback(async (studentId: string, feeRecord: { date: string; description: string; amount: number; type: "payment" | "charge" }) => {
    await apiRequest<{ message: string }>(`/students/${studentId}/fees`, {
      method: "POST",
      body: feeRecord,
    });
    await refreshData();
  }, [refreshData]);

  const uploadStudentDocument = useCallback(async (studentId: string, type: "result" | "fee_statement" | "school_id", file: File) => {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("file", file);
    await apiUploadRequest<{ message: string }>(`/students/${studentId}/documents`, formData);
    await refreshData();
  }, [refreshData]);

  const uploadProfilePhoto = useCallback(async (studentId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiUploadRequest<{ message: string; photo: string }>(`/students/${studentId}/profile-photo`, formData);
    await refreshData();
    return response.photo;
  }, [refreshData]);

  const updateStudentProfile = useCallback(async (studentId: string, payload: { photo?: string; bio?: string; course: string; institution: string; yearJoined: number; currentYear: number; totalYears: number }) => {
    await apiRequest<{ message: string }>(`/students/${studentId}/profile`, {
      method: "PATCH",
      body: payload,
    });
    await refreshData();
  }, [refreshData]);

  const deleteStudent = useCallback(async (studentId: string) => {
    await apiRequest<{ message: string }>(`/students/${studentId}`, {
      method: "DELETE",
    });
    await refreshData();
  }, [refreshData]);

  const submitContactMessage = useCallback(async (payload: { name: string; email: string; message: string }) => {
    await apiRequest<{ message: string }>("/contact", { method: "POST", body: payload, token: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthInitialized,
        login,
        signup,
        verifySignupCode,
        resendSignupCode,
        forgotPassword,
        logout,
        isLoading,
        isDataLoading,
        students,
        setStudents,
        pendingUsers,
        approveUser,
        rejectUser,
        addRemark,
        uploadResult,
        uploadFeeRecord,
        uploadStudentDocument,
        uploadProfilePhoto,
        updateStudentProfile,
        deleteStudent,
        submitContactMessage,
        refreshData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
