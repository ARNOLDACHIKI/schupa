import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import AdminStudentManagement from "@/pages/AdminStudentManagement";
import ResultsUpload from "@/pages/ResultsUpload";

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockUploadResult = vi.fn();
const mockRefreshData = vi.fn();
const mockApiRequest = vi.fn();
const mockApiUploadRequest = vi.fn();

const mockUseAuthState: {
  value: {
    user: { role: "admin" | "student"; email?: string } | null;
    students: Array<{
      id: string;
      name: string;
      email: string;
      course: string;
      institution: string;
      yearJoined: number;
      currentYear: number;
      totalYears: number;
      approved?: boolean;
      photo: string;
      bio?: string;
      results: Array<{ id?: string; semester: string; year: number; gpa: number }>;
      feeRecords: Array<{ id?: string; date: string; description: string; amount: number; type: "payment" | "charge" }>;
      feeBalance: number;
      remarks: Array<{ date: string; text: string; by: string }>;
      documents?: Array<{ id: string; type: "result" | "fee_statement" | "school_id"; name: string; uploadedAt: string; url: string }>;
    }>;
    deleteStudent: (studentId: string) => Promise<void>;
    isAuthInitialized: boolean;
    uploadResult: (studentId: string, payload: { semester: string; year: number; gpa: number }) => Promise<void>;
    refreshData: () => Promise<void>;
  };
} = {
  value: {
    user: null,
    students: [],
    deleteStudent: vi.fn(),
    isAuthInitialized: true,
    uploadResult: mockUploadResult,
    refreshData: mockRefreshData,
  },
};

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <div data-testid="footer" />,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuthState.value,
}));

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
  apiUploadRequest: (...args: unknown[]) => mockApiUploadRequest(...args),
}));

describe("Admin transcript download and year rules", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApiRequest.mockResolvedValue({ documents: [] });
    mockApiUploadRequest.mockResolvedValue({ message: "ok" });
    mockRefreshData.mockResolvedValue(undefined);
    mockUploadResult.mockResolvedValue(undefined);
  });

  it("allows admin to download latest transcript from student management", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    mockUseAuthState.value = {
      user: { role: "admin" },
      isAuthInitialized: true,
      deleteStudent: vi.fn(),
      uploadResult: mockUploadResult,
      refreshData: mockRefreshData,
      students: [
        {
          id: "student-1",
          name: "Test Student",
          email: "student@example.com",
          approved: true,
          photo: "",
          bio: "",
          course: "Computer Science",
          institution: "Uni",
          yearJoined: 2024,
          currentYear: 2,
          totalYears: 4,
          results: [],
          feeRecords: [],
          feeBalance: 0,
          remarks: [],
          documents: [
            { id: "d1", type: "result", name: "old.pdf", uploadedAt: "2026-01-01T00:00:00.000Z", url: "/uploads/old.pdf" },
            { id: "d2", type: "result", name: "latest.pdf", uploadedAt: "2026-02-01T00:00:00.000Z", url: "/uploads/latest.pdf" },
          ],
        },
      ],
    };

    render(<AdminStudentManagement />);

    fireEvent.click(screen.getByTitle("Download latest transcript"));

    expect(openSpy).toHaveBeenCalledWith("/uploads/latest.pdf", "_blank", "noopener,noreferrer");
  });

  it("rejects result upload when year is outside 1 to 5", async () => {
    mockUseAuthState.value = {
      user: { role: "student", email: "student@example.com" },
      isAuthInitialized: true,
      deleteStudent: vi.fn(),
      uploadResult: mockUploadResult,
      refreshData: mockRefreshData,
      students: [
        {
          id: "student-1",
          name: "Test Student",
          email: "student@example.com",
          approved: true,
          photo: "",
          bio: "",
          course: "Computer Science",
          institution: "Uni",
          yearJoined: 2024,
          currentYear: 2,
          totalYears: 4,
          results: [],
          feeRecords: [],
          feeBalance: 0,
          remarks: [],
          documents: [],
        },
      ],
    };

    render(<ResultsUpload />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Semester 1" } });

    const spinButtons = screen.getAllByRole("spinbutton");
    fireEvent.change(spinButtons[0], { target: { value: "3.8" } });
    fireEvent.change(spinButtons[1], { target: { value: "6" } });

    const fileInput = document.querySelector("#file-input") as HTMLInputElement;
    const testFile = new File(["transcript"], "transcript.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [testFile] } });

    const submitButton = screen.getByRole("button", { name: /Upload Results/i });
    const form = submitButton.closest("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form as HTMLFormElement);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Year must be between 1 and 5.",
          variant: "destructive",
        })
      );
    });

    expect(mockUploadResult).not.toHaveBeenCalled();
  });
});
