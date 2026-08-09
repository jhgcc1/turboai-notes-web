import { render, screen } from "@testing-library/react";
import { EmptyNotesState } from "./EmptyNotesState";

describe("EmptyNotesState", () => {
  it("renders the waiting copy and illustration", () => {
    const { container } = render(<EmptyNotesState />);
    expect(
      screen.getByText("I'm just here waiting for your charming notes..."),
    ).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeTruthy();
    expect(screen.getByTestId("empty-notes")).toBeInTheDocument();
  });
});
