import { render, screen } from "@testing-library/react";
import NoteEditPage from "./page";
import { useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
}));

vi.mock("@/components/NoteEditor", () => ({
  NoteEditor: ({ noteId }: { noteId: number }) => <div>note-editor-{noteId}</div>,
}));

describe("NoteEditPage", () => {
  it("renders NoteEditor when an id is present", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("id=42") as unknown as ReturnType<typeof useSearchParams>,
    );
    render(<NoteEditPage />);
    expect(screen.getByText("note-editor-42")).toBeInTheDocument();
  });

  it("shows a message when the id is missing", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams() as unknown as ReturnType<typeof useSearchParams>,
    );
    render(<NoteEditPage />);
    expect(screen.getByText("Missing note id.")).toBeInTheDocument();
  });
});
