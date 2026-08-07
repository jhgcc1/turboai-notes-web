import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./AuthForm";
import { api } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {
    status = 400;
  },
  api: {
    csrf: vi.fn(),
    register: vi.fn(),
    login: vi.fn(),
  },
}));

describe("AuthForm", () => {
  it("submits login", async () => {
    const user = userEvent.setup();
    vi.mocked(api.login).mockResolvedValue({
      id: 1,
      email: "a@b.com",
      date_joined: "",
    });
    render(<AuthForm mode="login" />);
    await user.type(screen.getByPlaceholderText("Email address"), "a@b.com");
    await user.type(screen.getByPlaceholderText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Login" }));
    expect(api.login).toHaveBeenCalled();
  });

  it("toggles password and shows signup copy", async () => {
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);
    expect(screen.getByText("Yay, New Friend!")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Toggle password visibility"));
    expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "text");
  });
});
