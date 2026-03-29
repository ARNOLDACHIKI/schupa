import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import SignIn from "@/pages/SignIn";

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockLogin = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

vi.mock("@/components/Navbar", () => ({
  default: () => <div data-testid="navbar" />,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
  }),
}));

describe("SignIn page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects admin users to admin dashboard after successful login", async () => {
    mockLogin.mockResolvedValue({ success: true, message: "ok", role: "admin" });

    render(<SignIn />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@example.com", "password");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/admin");
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Welcome back!" })
    );
  });

  it("shows error toast on failed login", async () => {
    mockLogin.mockResolvedValue({ success: false, message: "Invalid credentials" });

    render(<SignIn />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "bad-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Login Failed",
          description: "Invalid credentials",
          variant: "destructive",
        })
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("shows pending approval banner when account is awaiting admin approval", async () => {
    mockLogin.mockResolvedValue({
      success: false,
      message: "Account pending admin approval",
    });

    render(<SignIn />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Your application is under review by admin/i)
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
