import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import Index from "@/pages/Index";

const mockNavigate = vi.fn();
const mockToast = vi.fn();
const mockWriteText = vi.fn();
const mockApiRequest = vi.fn();

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

vi.mock("@/lib/api", () => ({
  apiRequest: (...args: unknown[]) => mockApiRequest(...args),
}));

describe("Index section smoke tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockApiRequest.mockResolvedValue({ message: "Message sent." });

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      configurable: true,
    });

    mockWriteText.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders partner schools and section headings", () => {
    render(<Index />);

    expect(screen.getByRole("heading", { name: /Our Partner Schools/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Mwangeka Secondary School/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Kiwinda Secondary School/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Mwagafwa Vocational Training Center/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Voi Youth Polytechnic/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Dr. Aggrey High School/i })).toBeInTheDocument();
  });

  it("submits contact form and resets fields", async () => {
    render(<Index />);

    const nameInput = screen.getByPlaceholderText("Your name");
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const messageInput = screen.getByPlaceholderText("How can we help?");

    fireEvent.change(nameInput, { target: { value: "Test User" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(messageInput, { target: { value: "Hello from a test" } });

    fireEvent.click(screen.getByRole("button", { name: /Send Message/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Message Sent!" })
      );
    });

    expect((nameInput as HTMLInputElement).value).toBe("");
    expect((emailInput as HTMLInputElement).value).toBe("");
    expect((messageInput as HTMLTextAreaElement).value).toBe("");
  });

  it("copies IBAN and shows success feedback", async () => {
    render(<Index />);

    const copyButton = screen.getByRole("button", { name: /Copy IBAN/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith("DE18 7007 0024 0752 7997 00");
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "IBAN copied" })
      );
    });

    expect(screen.getByRole("button", { name: /IBAN Copied/i })).toBeInTheDocument();
  });

  it("scrolls to contact section when donation questions is clicked", () => {
    const scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      value: scrollIntoViewMock,
      configurable: true,
    });

    render(<Index />);

    fireEvent.click(screen.getByRole("button", { name: /Donation Questions/i }));

    expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
