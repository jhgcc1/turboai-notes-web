import { render } from "@testing-library/react";
import { AuthDecorations } from "./AuthDecorations";

describe("AuthDecorations", () => {
  it("renders the decorative SVGs", () => {
    const { container } = render(<AuthDecorations />);
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });
});
