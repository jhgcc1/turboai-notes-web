import { render, screen } from "@testing-library/react";
import SignupPage from "./page";

vi.mock("@/components/AuthForm", () => ({
  AuthForm: ({ mode }: { mode: string }) => <div>auth-form-{mode}</div>,
}));

describe("SignupPage", () => {
  it("renders AuthForm in signup mode", () => {
    render(<SignupPage />);
    expect(screen.getByText("auth-form-signup")).toBeInTheDocument();
  });
});
