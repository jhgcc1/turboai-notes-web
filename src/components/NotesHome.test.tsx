import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotesHome } from "./NotesHome";
import { api } from "@/lib/api";

const reportUnexpected = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    api: {
      me: vi.fn(),
      categories: vi.fn(),
      notes: vi.fn(),
      createNote: vi.fn(),
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

const notes = [
  {
    id: 10,
    title: "First note",
    body: "Some body",
    category: 1,
    category_name: "Random Thoughts",
    category_color: "#E9A680",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

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

describe("NotesHome", () => {
  beforeEach(() => {
    vi.mocked(api.me).mockResolvedValue({ id: 1, email: "a@b.com", date_joined: "" });
    vi.mocked(api.categories).mockResolvedValue(categories);
    vi.mocked(api.notes).mockResolvedValue(notes);
  });

  it("renders categories and notes once loaded", async () => {
    render(<NotesHome />);
    expect(await screen.findByRole("button", { name: /Random Thoughts/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /School/ })).toBeInTheDocument();
    expect(screen.getByText("First note")).toBeInTheDocument();
    expect(screen.getByText("Some body")).toBeInTheDocument();
  });

  it("falls back to placeholder copy for blank notes", async () => {
    vi.mocked(api.notes).mockResolvedValue([{ ...notes[0], title: "", body: "" }]);
    render(<NotesHome />);
    expect(await screen.findByText("Note Title")).toBeInTheDocument();
    expect(screen.getByText("Note content...")).toBeInTheDocument();
  });

  it("ignores results that resolve after unmount (success path)", async () => {
    let resolveCategories!: () => void;
    vi.mocked(api.categories).mockReturnValue(
      new Promise((resolve) => {
        resolveCategories = () => resolve(categories);
      }),
    );
    const { unmount } = render(<NotesHome />);
    unmount();
    resolveCategories();
    await new Promise((r) => setTimeout(r, 0));
  });

  it("ignores errors that reject after unmount", async () => {
    let rejectMe!: () => void;
    vi.mocked(api.me).mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectMe = () => reject(new Error("boom"));
      }),
    );
    const hrefSetter = stubLocation();
    const { unmount } = render(<NotesHome />);
    unmount();
    rejectMe();
    await new Promise((r) => setTimeout(r, 0));
    expect(hrefSetter).not.toHaveBeenCalled();
  });

  it("filters notes by category and toggles the filter off", async () => {
    const user = userEvent.setup();
    render(<NotesHome />);
    const categoryButton = await screen.findByRole("button", { name: /Random Thoughts/ });
    vi.mocked(api.notes).mockClear();

    await user.click(categoryButton);
    await waitFor(() => expect(api.notes).toHaveBeenCalledWith(1));

    await user.click(categoryButton);
    await waitFor(() => expect(api.notes).toHaveBeenCalledWith(undefined));
  });

  it("creates a new note in the current category and navigates to it", async () => {
    const user = userEvent.setup();
    const hrefSetter = stubLocation();
    vi.mocked(api.createNote).mockResolvedValue({ ...notes[0], id: 99 });
    render(<NotesHome />);
    await screen.findByRole("button", { name: /Random Thoughts/ });

    await user.click(screen.getByText("+ New Note"));

    await waitFor(() =>
      expect(api.createNote).toHaveBeenCalledWith({
        title: "Note Title",
        body: "",
        category: 1,
      }),
    );
    await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith("/notes/edit/?id=99"));
  });

  it("creates a new note in the selected filter category", async () => {
    const user = userEvent.setup();
    stubLocation();
    vi.mocked(api.createNote).mockResolvedValue({ ...notes[0], id: 100 });
    render(<NotesHome />);
    const schoolButton = await screen.findByRole("button", { name: /School/ });
    await user.click(schoolButton);
    await waitFor(() => expect(api.notes).toHaveBeenCalledWith(2));

    await user.click(screen.getByText("+ New Note"));
    await waitFor(() =>
      expect(api.createNote).toHaveBeenCalledWith({
        title: "Note Title",
        body: "",
        category: 2,
      }),
    );
  });

  it("does nothing when creating a note without any categories", async () => {
    vi.mocked(api.categories).mockResolvedValue([]);
    vi.mocked(api.notes).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<NotesHome />);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Random Thoughts/ })).not.toBeInTheDocument(),
    );

    await user.click(screen.getByText("+ New Note"));
    expect(api.createNote).not.toHaveBeenCalled();
  });

  it("shows the empty-state illustration when there are no notes", async () => {
    vi.mocked(api.notes).mockResolvedValue([]);
    render(<NotesHome />);
    expect(
      await screen.findByText("I'm just here waiting for your charming notes..."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("empty-notes")).toBeInTheDocument();
    expect(screen.queryByText("First note")).not.toBeInTheDocument();
  });

  it("redirects to /login when the initial fetch fails", async () => {
    const hrefSetter = stubLocation();
    reportUnexpected.mockClear();
    vi.mocked(api.me).mockRejectedValue(new Error("unauthenticated"));
    render(<NotesHome />);
    await waitFor(() => expect(hrefSetter).toHaveBeenCalledWith("/login"));
    expect(reportUnexpected).toHaveBeenCalledWith(expect.any(Error), "NotesHome.load");
  });

  it("reports createNote failures without navigating", async () => {
    const user = userEvent.setup();
    const hrefSetter = stubLocation();
    reportUnexpected.mockClear();
    vi.mocked(api.createNote).mockRejectedValue(new Error("create failed"));
    render(<NotesHome />);
    await screen.findByRole("button", { name: /Random Thoughts/ });
    await user.click(screen.getByText("+ New Note"));
    await waitFor(() =>
      expect(reportUnexpected).toHaveBeenCalledWith(expect.any(Error), "NotesHome.createNote"),
    );
    expect(hrefSetter).not.toHaveBeenCalled();
  });
});
