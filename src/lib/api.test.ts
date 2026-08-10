import { formatLastEdited, formatNoteDate } from "./api";

describe("formatNoteDate", () => {
  // Local calendar anchors avoid UTC/local day-boundary flakiness.
  const now = new Date(2024, 6, 21, 12, 0, 0); // Jul 21, 2024

  it("returns lowercase today", () => {
    expect(formatNoteDate(new Date(2024, 6, 21, 8, 0, 0).toISOString(), now)).toBe("today");
  });

  it("returns lowercase yesterday", () => {
    expect(formatNoteDate(new Date(2024, 6, 20, 8, 0, 0).toISOString(), now)).toBe("yesterday");
  });

  it("returns full Month Day without year (Figma/video cards)", () => {
    // Video frames (e.g. frame_057): "July 16", "June 12" — not "Apr 10", not Title Case relatives.
    expect(formatNoteDate(new Date(2024, 5, 11, 8, 0, 0).toISOString(), now)).toBe("June 11");
    expect(formatNoteDate(new Date(2024, 6, 16, 8, 0, 0).toISOString(), now)).toBe("July 16");
  });
});

describe("formatLastEdited", () => {
  it("matches Figma/video Last Edited shape", () => {
    // frame_103: "Last Edited: July 21, 2024 at 8:35pm"
    const local = new Date(2024, 6, 21, 20, 35, 0);
    expect(formatLastEdited(local.toISOString())).toBe("July 21, 2024 at 8:35pm");
  });

  it("uses am for morning hours and 12 for midnight/noon", () => {
    expect(formatLastEdited(new Date(2024, 0, 2, 0, 5, 0).toISOString())).toBe(
      "January 2, 2024 at 12:05am",
    );
    expect(formatLastEdited(new Date(2024, 0, 2, 12, 0, 0).toISOString())).toBe(
      "January 2, 2024 at 12:00pm",
    );
  });
});
