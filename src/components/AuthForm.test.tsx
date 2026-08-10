import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./AuthForm";
import { api } from "@/lib/api";

const { MockApiError, reportUnexpected } = vi.hoisted(() => ({
  MockApiError: class MockApiError extends Error {
    status = 400;
    constructor(message?: string, status = 400) {
      super(message);
      this.status = status;
    }
  },
  reportUnexpected: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: MockApiError,
  api: {
    csrf: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock("@/lib/reportUnexpected", () => ({
  reportUnexpected: (...args: unknown[]) => reportUnexpected(...args),
}));

function stubLocation() {
  const hrefSetter = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      get href() {
        return "http://localhost/";
      },
      set href(value: string) {
        hrefSetter(value);
      },
    },
  });
  return hrefSetter;
}

describe("AuthForm", () => {
  it("submits login and navigates home on success", async () => {
    const user = userEvent.setup();
    const hrefSetter = stubLocation();
    vi.mocked(api.login).mockResolvedValue({
      id: 1,
      email: "a@b.com",
      date_joined: "",
    });
    render(<AuthForm mode="login" />);
    await user.type(screen.getByPlaceholderText("Email address"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(api.login).toHaveBeenCalledWith("a@b.com", "secret123");
    await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith("/"));
  });

  it("submits signup via register", async () => {
    const user = userEvent.setup();
    stubLocation();
    vi.mocked(api.register).mockResolvedValue({
      id: 2,
      email: "new@b.com",
      date_joined: "",
    });
    render(<AuthForm mode="signup" />);
    await user.type(screen.getByPlaceholderText("Email address"), "new@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign Up" }));
    expect(api.register).toHaveBeenCalledWith("new@b.com", "secret123");
  });

  it("shows a friendly error on an ApiError", async () => {
    const user = userEvent.setup();
    reportUnexpected.mockClear();
    vi.mocked(api.login).mockRejectedValue(new MockApiError("bad request", 400));
    render(<AuthForm mode="login" />);
    await user.type(screen.getByPlaceholderText("Email address"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(
      await screen.findByText("Something went wrong. Check your email and password."),
    ).toBeInTheDocument();
    expect(reportUnexpected).toHaveBeenCalled();
  });

  it("shows a network error on unexpected failures", async () => {
    const user = userEvent.setup();
    reportUnexpected.mockClear();
    vi.mocked(api.login).mockRejectedValue(new Error("boom"));
    render(<AuthForm mode="login" />);
    await user.type(screen.getByPlaceholderText("Email address"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(await screen.findByText("Network error.")).toBeInTheDocument();
    expect(reportUnexpected).toHaveBeenCalledWith(expect.any(Error), "AuthForm.submit");
  });

  it("toggles password and shows signup copy", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    expect(screen.getByText("Yay, New Friend!")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Toggle password visibility"));
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "text");
  });
});
