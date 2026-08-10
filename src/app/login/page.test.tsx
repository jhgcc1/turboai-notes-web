import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

vi.mock("@/components/AuthForm", () => ({
  AuthForm: ({ mode }: { mode: string }) => <div>auth-form-{mode}</div>,
}));

describe("LoginPage", () => {
  it("renders AuthForm in login mode", () => {
    render(<LoginPage />);
    expect(screen.getByText("auth-form-login")).toBeInTheDocument();
  });
});
