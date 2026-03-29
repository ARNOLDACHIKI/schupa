import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import type { ReactNode } from "react";
import ForgotPassword from "@/pages/ForgotPassword";

const mockToast = vi.fn();
const mockForgotPassword = vi.fn();

vi.mock("react-router-dom", () => ({
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
    forgotPassword: mockForgotPassword,
  }),
}));

describe("ForgotPassword page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits forgot-password request and shows success state", async () => {
    mockForgotPassword.mockResolvedValue({
      success: true,
      message: "If the account exists, a reset link will be sent.",
    });

    render(<ForgotPassword />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "student@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith("student@example.com");
    });

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Reset Link Sent" })
    );
    expect(
      screen.getByText(/If an account with that email exists, we've sent a password reset link/i)
    ).toBeInTheDocument();
  });

  it("shows error toast when forgot-password request fails", async () => {
    mockForgotPassword.mockResolvedValue({
      success: false,
      message: "Unable to process request.",
    });

    render(<ForgotPassword />);

    fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "student@example.com" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Send Reset Link/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Request Failed",
          description: "Unable to process request.",
          variant: "destructive",
        })
      );
    });

    expect(screen.queryByText(/Back to Sign In/i)).not.toBeInTheDocument();
  });
});
