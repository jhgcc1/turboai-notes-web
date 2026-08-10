import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NoteEditor } from "./NoteEditor";
import { api } from "@/lib/api";

const reportUnexpected = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: {
      getNote: vi.fn(),
      categories: vi.fn(),
      updateNote: vi.fn(),
    },
  };
});

vi.mock("@/lib/reportUnexpected", () => ({
  reportUnexpected: (...args: unknown[]) => reportUnexpected(...args),
}));

const categories = [
  { id: 1, name: "Random Thoughts", color: "#E9A680", note_count: 1, created_at: "" },
  { id: 2, name: "School", color: "#F3E3B5", note_count: 0, created_at: "" },
];

const note = {
  id: 10,
  title: "First note",
  body: "Some body",
  category: 1,
  category_name: "Random Thoughts",
  category_color: "#E9A680",
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

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

describe("NoteEditor", () => {
  beforeEach(() => {
    vi.mocked(api.getNote).mockResolvedValue(note);
    vi.mocked(api.categories).mockResolvedValue(categories);
    vi.mocked(api.updateNote).mockResolvedValue(note);
  });

  it("shows a loading state before the note arrives", () => {
    vi.mocked(api.getNote).mockReturnValue(new Promise(() => {}));
    render(<NoteEditor noteId={10} />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders the loaded note", async () => {
    render(<NoteEditor noteId={10} />);
    expect(await screen.findByDisplayValue("First note")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Some body")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toHaveValue("1");
  });

  it("saves on blur after editing the title and body", async () => {
    const user = userEvent.setup();
    render(<NoteEditor noteId={10} />);
    const title = await screen.findByDisplayValue("First note");
    await user.clear(title);
    await user.type(title, "Updated title");
    await user.tab();
    await waitFor(() =>
      expect(api.updateNote).toHaveBeenCalledWith(10, {
        title: "Updated title",
        body: "Some body",
        category: 1,
      }),
    );

    const body = screen.getByDisplayValue("Some body");
    await user.clear(body);
    await user.type(body, "New body");
    await user.tab();
    await waitFor(() =>
      expect(api.updateNote).toHaveBeenCalledWith(10, {
        title: "Updated title",
        body: "New body",
        category: 1,
      }),
    );
  });

  it("saves immediately when the category changes", async () => {
    const user = userEvent.setup();
    render(<NoteEditor noteId={10} />);
    await screen.findByDisplayValue("First note");

    await user.selectOptions(screen.getByLabelText("Category"), "2");
    await waitFor(() =>
      expect(api.updateNote).toHaveBeenCalledWith(10, {
        title: "First note",
        body: "Some body",
        category: 2,
      }),
    );
  });

  it("saves on form submit", async () => {
    render(<NoteEditor noteId={10} />);
    const title = await screen.findByDisplayValue("First note");
    const form = title.closest("form");
    expect(form).not.toBeNull();
    form!.requestSubmit();
    await waitFor(() => expect(api.updateNote).toHaveBeenCalled());
  });

  it("redirects to /login when the initial fetch fails", async () => {
    const hrefSetter = stubLocation();
    reportUnexpected.mockClear();
    vi.mocked(api.getNote).mockRejectedValue(new Error("not found"));
    render(<NoteEditor noteId={10} />);
    await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith("/login"));
    expect(reportUnexpected).toHaveBeenCalledWith(expect.any(Error), "NoteEditor.load");
  });

  it("reports save failures", async () => {
    const user = userEvent.setup();
    reportUnexpected.mockClear();
    vi.mocked(api.updateNote).mockRejectedValue(new Error("save failed"));
    render(<NoteEditor noteId={10} />);
    const title = await screen.findByDisplayValue("First note");
    await user.clear(title);
    await user.type(title, "X");
    await user.tab();
    await waitFor(() =>
      expect(reportUnexpected).toHaveBeenCalledWith(expect.any(Error), "NoteEditor.save"),
    );
  });

  it("falls back to the note's own color when its category is missing", async () => {
    vi.mocked(api.categories).mockResolvedValue([]);
    const { container } = render(<NoteEditor noteId={10} />);
    await screen.findByDisplayValue("First note");
    expect(container.querySelector("form")).toHaveStyle({ background: note.category_color });
  });

  it("ignores results that resolve after unmount", async () => {
    let resolveNote!: () => void;
    vi.mocked(api.getNote).mockReturnValue(
      new Promise((resolve) => {
        resolveNote = () => resolve(note);
      }),
    );
    const { unmount } = render(<NoteEditor noteId={10} />);
    unmount();
    resolveNote();
    await new Promise((r) => setTimeout(r, 0));
  });
});
