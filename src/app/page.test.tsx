import { render, screen } from "@testing-library/react";
import HomePage from "./page";

vi.mock("@/components/NotesHome", () => ({
  NotesHome: () => <div>notes-home-stub</div>,
}));

describe("HomePage", () => {
  it("renders NotesHome", () => {
    render(<HomePage />);
    expect(screen.getByText("notes-home-stub")).toBeInTheDocument();
  });
});
